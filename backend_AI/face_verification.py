import face_recognition
import numpy as np
from PIL import Image
import io
import base64
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import Optional
import cv2 # Import OpenCV
from ultralytics import YOLO # Import YOLO
from motor.motor_asyncio import AsyncIOMotorClient
import jwt
import os
from datetime import datetime
import torch
from ultralytics.nn.tasks import DetectionModel
from torch.nn.modules.container import Sequential, ModuleList
from ultralytics.nn.modules.conv import Conv, Concat
from torch.nn.modules.conv import Conv2d
from torch.nn.modules.batchnorm import BatchNorm2d
from torch.nn.modules.activation import ReLU, LeakyReLU, SiLU
from torch.nn.modules.pooling import MaxPool2d, AdaptiveAvgPool2d
from torch.nn.modules.linear import Linear
from torch.nn.modules.dropout import Dropout
from torch.nn.modules.upsampling import Upsample
from torch.nn.modules.flatten import Flatten
from torch.nn.modules.module import Module
from ultralytics.nn.modules.block import C2f, Bottleneck, C3, C2, SPPF, SPP, DFL
from ultralytics.nn.modules.head import Detect, Segment, Pose, OBB, RTDETRDecoder
from bson import ObjectId
from skimage.metrics import structural_similarity as ssim

# MongoDB connection
MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb+srv://Dali:O74MGyE6gQxfNzBg@cluster0.u32xgcm.mongodb.net/')
JWT_SECRET = os.getenv('JWT_SECRET','dinarflow_jwt_secret_key_2024_secure_and_unique_key_for_auth')  # Make sure this matches your backend secret

# Initialize MongoDB client
client = AsyncIOMotorClient(MONGODB_URL)
db = client.test  #

# Add all to safe globals
safe_classes = [
    # Base PyTorch modules
    DetectionModel, Sequential, ModuleList, Conv, Conv2d, BatchNorm2d, 
    ReLU, LeakyReLU, SiLU, MaxPool2d, AdaptiveAvgPool2d, Linear, 
    Dropout, Upsample, Flatten, Module,
    
    # YOLO specific modules
    C2f, Bottleneck, C3, C2, SPPF, SPP, Concat, DFL,
    Detect, Segment, Pose, OBB, RTDETRDecoder
]

# Add all classes to safe globals
for cls in safe_classes:
    torch.serialization.add_safe_globals([cls])

# Load a pre-trained YOLOv8s model
try:
    # First try loading with weights_only=False for backward compatibility
    yolo_model = YOLO('yolov8s.pt', task='detect')
    print("YOLOv8s model loaded successfully.")
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    yolo_model = None # Handle case where model fails to load

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:5173"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization"],  # Explicitly allow Authorization header
)

async def verify_token(authorization: Optional[str] = Header(None)):
    """Verify JWT token and return user ID"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token provided")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("userId")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

class VerificationRequest(BaseModel):
    selfie_with_id: str  # Base64 encoded image of person holding ID
    id_image: str        # Base64 encoded image of just the ID
    personalInfo: dict   # Add personal info fields
    documents: dict      # Add documents fields

def decode_base64_image(base64_string):
    """Decode base64 string to image."""
    try:
        # Remove the data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 string
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if image has alpha channel
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        
        return np.array(image) # Return as NumPy array
    except Exception as e:
        print(f"Error decoding image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

def detect_flat_id_artifacts(image_np):
    """
    Heuristic check for printed/screen-displayed ID cards in a selfie.
    Returns True if likely fake (flat screen/photo), False if likely real.
    Applies the check to the *entire* selfie image.
    """
    # NOTE: With YOLO integration, this heuristic might become less necessary
    # as YOLO can potentially detect the physical ID better. Keeping for now.
    try:
        # Convert image to grayscale
        if len(image_np.shape) == 3:
             gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        else:
             gray = image_np # Already grayscale

        # Edge detection
        edges = cv2.Canny(gray, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        rect_like_contours = 0
        for cnt in contours:
            approx = cv2.approxPolyDP(cnt, 0.02 * cv2.arcLength(cnt, True), True)
            area = cv2.contourArea(cnt)
            x, y, w, h = cv2.boundingRect(cnt)
            aspect_ratio = float(w)/h if h > 0 else 0

            # Check for contours that are approximately rectangular and have a significant area
            # Added aspect ratio check to filter out extreme shapes
            if len(approx) == 4 and area > 5000 and 0.5 < aspect_ratio < 2.0: # Added area and aspect ratio thresholds
                rect_like_contours += 1
                print(f"  - Detected potential rectangular artifact (area: {area}, aspect_ratio: {aspect_ratio:.2f})")

        # If we find a suspiciously flat large rectangular region, it's likely a screen or printed photo
        is_flat = rect_like_contours > 0
        print(f"  - Flat ID artifact detection result: {is_flat}")
        return is_flat

    except Exception as e:
        print(f"Error in spoof detection: {e}")
        return False  # Fail-safe: assume not fake

def verify_faces(selfie_with_id_np, id_image_np):
    """Compare faces between selfie with ID and ID image."""
    try:
        print("\n=== Starting Face Verification Process ===")
        
        # Ensure images are in RGB format
        if len(selfie_with_id_np.shape) == 2:  # If grayscale
            selfie_with_id_np = cv2.cvtColor(selfie_with_id_np, cv2.COLOR_GRAY2RGB)
        elif selfie_with_id_np.shape[2] == 4:  # If RGBA
            selfie_with_id_np = cv2.cvtColor(selfie_with_id_np, cv2.COLOR_RGBA2RGB)
            
        if len(id_image_np.shape) == 2:  # If grayscale
            id_image_np = cv2.cvtColor(id_image_np, cv2.COLOR_GRAY2RGB)
        elif id_image_np.shape[2] == 4:  # If RGBA
            id_image_np = cv2.cvtColor(id_image_np, cv2.COLOR_RGBA2RGB)
        
        # Check if the same image is being used
        if np.array_equal(selfie_with_id_np, id_image_np):
            print("Error: Same image detected for both selfie and ID")
            return False, "You cannot use the same image for both selfie and ID verification. Please upload different images."
        
        # --- ID Document Validation ---
        print("\nValidating ID document...")
        
        # Convert to grayscale for edge detection
        gray = cv2.cvtColor(id_image_np, cv2.COLOR_RGB2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Find the largest contour
        if contours:
            largest_contour = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(largest_contour)
            
            # Get the bounding rectangle
            x, y, w, h = cv2.boundingRect(largest_contour)
            aspect_ratio = float(w)/h if h > 0 else 0
            
            # Check if the contour has a rectangular shape and reasonable size
            is_rectangular = 0.5 < aspect_ratio < 2.0  # ID cards typically have aspect ratio around 1.6
            is_large_enough = area > (id_image_np.shape[0] * id_image_np.shape[1] * 0.1)  # At least 10% of image area
            
            print(f"ID document validation:")
            print(f"  - Aspect ratio: {aspect_ratio:.2f}")
            print(f"  - Area: {area:.0f} pixels")
            print(f"  - Is rectangular: {is_rectangular}")
            print(f"  - Is large enough: {is_large_enough}")
            
            if not (is_rectangular and is_large_enough):
                print("ID document validation failed")
                return False, "Please ensure your ID document is clearly visible and properly framed in the image."
        
        # --- YOLO Detection in ID Image ---
        print("\nRunning YOLO detection on ID image...")
        if yolo_model is None:
            return False, "YOLO model not loaded, cannot perform object detection."
            
        # Perform inference on ID image to detect if it's actually an ID document
        id_results = yolo_model(id_image_np, verbose=False)
        
        # Check for ID-like objects in the image
        id_detected = False
        for r in id_results:
            boxes = r.boxes
            for box in boxes:
                cls = int(box.cls)
                conf = float(box.conf)
                # Check for objects that might be ID cards (expanded list)
                if yolo_model.names[cls] in ['book', 'cell phone', 'laptop', 'mouse', 'remote', 'keyboard', 'scissors', 'toothbrush', 'hair drier', 'toilet paper'] and conf > 0.3:  # Lowered confidence threshold
                    id_detected = True
                    print(f"Detected potential ID document: {yolo_model.names[cls]} with confidence {conf:.2f}")
                    break
            if id_detected:
                break
        
        # If YOLO didn't detect an ID but we have a good rectangular contour, consider it valid
        if not id_detected and contours:
            largest_contour = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(largest_contour)
            x, y, w, h = cv2.boundingRect(largest_contour)
            aspect_ratio = float(w)/h if h > 0 else 0
            
            if 0.5 < aspect_ratio < 2.0 and area > (id_image_np.shape[0] * id_image_np.shape[1] * 0.1):
                print("ID document validated through contour analysis")
                id_detected = True
                
        if not id_detected:
            print("No ID document detected in the image")
            return False, "Please upload a clear image of your ID document. The system could not detect an ID card in the image."
        
        # --- YOLO Detection in Selfie Image ---
        print("\nRunning YOLO detection on selfie with ID...")
        
        # Perform inference - looking for 'person' (class 0 in COCO) and potentially 'id card' if model supports
        results = yolo_model(selfie_with_id_np, verbose=False)
        
        user_face_box = None
        id_in_selfie = False
        # Assuming the largest 'person' is the user
        largest_person_area = 0
        
        for r in results:
            boxes = r.boxes # Boxes object
            for box in boxes:
                cls = int(box.cls) # Class index
                conf = float(box.conf) # Confidence score
                xyxy = box.xyxy[0].tolist() # Bounding box coordinates [x1, y1, x2, y2]
                
                # Class 0 is 'person' in COCO dataset
                if yolo_model.names[cls] == 'person' and conf > 0.5: # Confidence threshold for YOLO detection
                     x1, y1, x2, y2 = map(int, xyxy)
                     current_area = (y2 - y1) * (x2 - x1)
                     if current_area > largest_person_area:
                         largest_person_area = current_area
                         user_face_box = (x1, y1, x2, y2) # Store as (left, top, right, bottom)
                # Check if ID is visible in selfie - more lenient detection
                elif yolo_model.names[cls] in ['book', 'cell phone', 'laptop', 'mouse', 'remote', 'keyboard', 'scissors', 'toothbrush', 'hair drier', 'toilet paper'] and conf > 0.2:  # Even lower confidence threshold for selfie
                    id_in_selfie = True
                    print(f"Detected ID in selfie: {yolo_model.names[cls]} with confidence {conf:.2f}")

        # If YOLO didn't detect an ID in selfie, try contour analysis
        if not id_in_selfie:
            # Convert to grayscale for edge detection
            gray_selfie = cv2.cvtColor(selfie_with_id_np, cv2.COLOR_RGB2GRAY)
            blurred_selfie = cv2.GaussianBlur(gray_selfie, (5, 5), 0)
            edges_selfie = cv2.Canny(blurred_selfie, 50, 150)
            contours_selfie, _ = cv2.findContours(edges_selfie, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours_selfie:
                # Find contours that are not the face
                for contour in contours_selfie:
                    area = cv2.contourArea(contour)
                    x, y, w, h = cv2.boundingRect(contour)
                    aspect_ratio = float(w)/h if h > 0 else 0
                    
                    # Check if this contour could be an ID (rectangular and not too small)
                    if 0.3 < aspect_ratio < 3.0 and area > (selfie_with_id_np.shape[0] * selfie_with_id_np.shape[1] * 0.05):  # More lenient aspect ratio and size
                        # Check if this contour is not overlapping with the face
                        if user_face_box:
                            face_x1, face_y1, face_x2, face_y2 = user_face_box
                            if not (x < face_x2 and x + w > face_x1 and y < face_y2 and y + h > face_y1):
                                id_in_selfie = True
                                print("ID document detected in selfie through contour analysis")
                                break

        if not id_in_selfie:
            print("No ID document detected in selfie")
            return False, "Please make sure your ID document is clearly visible in the selfie image."

        if user_face_box is None:
            print("No person detected in selfie image by YOLO.")
            return False, "Could not detect person in selfie image."
            
        print(f"Detected user face in selfie using YOLO: {user_face_box}")

        # --- Face Detection and Encoding using face_recognition ---

        # Get face encoding for the user's face (cropped from selfie using YOLO box)
        print("\nGetting face encoding for user face (from selfie crop)...")
        try:
            # Crop the user face from the selfie image using the YOLO box
            x1, y1, x2, y2 = user_face_box
            
            # Add padding to the face crop (20% on each side)
            height, width = selfie_with_id_np.shape[:2]
            padding_x = int((x2 - x1) * 0.2)
            padding_y = int((y2 - y1) * 0.2)
            
            # Ensure we don't go out of bounds
            x1 = max(0, x1 - padding_x)
            y1 = max(0, y1 - padding_y)
            x2 = min(width, x2 + padding_x)
            y2 = min(height, y2 + padding_y)
            
            # Crop the face with padding
            user_face_crop_np = selfie_with_id_np[y1:y2, x1:x2]
            
            # Validate the cropped image
            if user_face_crop_np.size == 0:
                print("Empty face crop detected")
                return False, "Could not properly crop face from selfie"
                
            # Check if the image is all white (255) or black (0)
            if np.mean(user_face_crop_np) > 250 or np.mean(user_face_crop_np) < 5:
                print("Invalid face crop - image is too bright or too dark")
                return False, "Face in selfie is not clearly visible. Please ensure proper lighting."
            
            # Ensure the cropped image is in RGB format and has valid dimensions
            if len(user_face_crop_np.shape) == 2:  # If grayscale
                user_face_crop_np = cv2.cvtColor(user_face_crop_np, cv2.COLOR_GRAY2RGB)
            elif user_face_crop_np.shape[2] == 4:  # If RGBA
                user_face_crop_np = cv2.cvtColor(user_face_crop_np, cv2.COLOR_RGBA2RGB)
                
            print(f"Cropped face image shape: {user_face_crop_np.shape}")
            
            # Ensure the image is not too small
            min_face_size = 60  # Minimum face size in pixels
            if user_face_crop_np.shape[0] < min_face_size or user_face_crop_np.shape[1] < min_face_size:
                print(f"Face crop too small: {user_face_crop_np.shape}")
                return False, "Face in selfie is too small or unclear"
            
            # First detect face locations in the cropped image
            print("Detecting face locations...")
            face_locations = face_recognition.face_locations(user_face_crop_np)
            
            if not face_locations:
                print("No face locations found in cropped image.")
                return False, "Could not detect face in selfie. Please ensure your face is clearly visible and centered."
            
            # Get face encodings using the detected locations
            print("Generating face encoding...")
            user_encodings = face_recognition.face_encodings(user_face_crop_np, face_locations, num_jitters=1)
            
            if not user_encodings:
                print("Could not generate encoding for user face crop.")
                return False, "Could not process face from selfie. Please ensure your face is clearly visible and well-lit."
                
        except Exception as e:
            print(f"Error during face encoding: {str(e)}")
            if "incompatible function arguments" in str(e):
                return False, "Face detection failed. Please ensure your face is clearly visible and well-lit."
            return False, f"Error processing face: {str(e)}"

        user_encoding = user_encodings[0]
        print("Generated user face encoding.")

        # Get face location and encoding for the face in the separate ID image
        print("\nDetecting face in separate ID image...")
        # Ensure ID image is in RGB format
        if len(id_image_np.shape) == 2:  # If grayscale
            id_image_np = cv2.cvtColor(id_image_np, cv2.COLOR_GRAY2RGB)
        elif id_image_np.shape[2] == 4:  # If RGBA
            id_image_np = cv2.cvtColor(id_image_np, cv2.COLOR_RGBA2RGB)
            
        id_face_locations = face_recognition.face_locations(id_image_np, model="hog") # Using HOG for ID image is fine
        
        # Validation: Ensure exactly one face in the ID image
        if len(id_face_locations) != 1:
            print("ID image should contain exactly one face.")
            return False, "ID image must contain exactly one face"
            
        print(f"Found 1 face in ID image: {id_face_locations[0]}")

        print("Generating encoding for ID image face...")
        id_encodings = face_recognition.face_encodings(id_image_np, id_face_locations, num_jitters=10)
        id_encoding = id_encodings[0]
        print("Generated ID face encoding.")

        # --- Face Comparison ---
        
        print("\nComparing user face (from selfie) vs ID face (from ID image)...")
        # We are now comparing one specific face from the selfie (user) to one specific face from the ID image.
        distance = face_recognition.face_distance([id_encoding], user_encoding)[0]
        confidence = 1 - distance
        
        print(f"Comparison details:")
        print(f"  - Face distance: {distance:.4f}")
        print(f"  - Confidence: {confidence:.2%}")
        
        # Using a required confidence threshold of 0.6 (corresponding to distance < 0.4)
        required_distance_threshold = 1 - 0.6 # 0.4 for 60% confidence
        is_match = distance < required_distance_threshold

        print(f"\nRequired distance threshold (for 60% confidence): {required_distance_threshold:.4f}")
        
        if is_match:
            print("Face match verified!")
            return True, f"Face match verified with {confidence:.2%} confidence (distance: {distance:.4f})"
        else:
            print("Faces do not match")
            print(f"Distance {distance:.4f} is not below required threshold {required_distance_threshold:.4f}")
            return False, f"Faces do not match. Confidence: {confidence:.2%} (distance: {distance:.4f})"
    
    except Exception as e:
        print(f"\nError in face verification: {str(e)}")
        # Provide a more specific error message if it's related to YOLO model loading
        if "YOLO model not loaded" in str(e):
             raise HTTPException(status_code=500, detail=str(e))
        else:
             raise HTTPException(status_code=500, detail=f"Error processing images: {str(e)}")

@app.post("/verify-faces")
async def verify_faces_endpoint(request: VerificationRequest, token: str = Depends(verify_token)):
    """Endpoint to verify faces between selfie with ID and ID images."""
    try:
        print("\n=== New Face Verification Request ===")
        
        # Decode base64 images to numpy arrays for OpenCV and YOLO
        print("Decoding images...")
        selfie_with_id_np = decode_base64_image(request.selfie_with_id)
        id_image_np = decode_base64_image(request.id_image)
        
        # Verify faces
        print("Starting face verification...")
        is_match, message = verify_faces(selfie_with_id_np, id_image_np)
        
        # Update user's KYC status in MongoDB regardless of match result
        try:
            # Convert token to ObjectId
            user_id = ObjectId(token)
            
            # Get the current submission index
            user = await db.users.find_one({"_id": user_id})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Initialize KYC if it doesn't exist
            if 'kyc' not in user:
                user['kyc'] = {
                    'status': 'unverified',
                    'submissions': [],
                    'currentSubmission': -1
                }
            
            # If no submissions exist, create a new one
            if not user['kyc'].get('submissions'):
                user['kyc']['submissions'] = []
            
            # If no current submission, create a new one
            if user['kyc'].get('currentSubmission', -1) == -1:
                user['kyc']['currentSubmission'] = 0
                user['kyc']['submissions'].append({
                    'submittedAt': datetime.utcnow(),
                    'auditTrail': []
                })
            
            current_submission = user['kyc']['currentSubmission']
            
            # Update both the KYC status and the current submission status based on match result
            status = "verified" if is_match else "pending"  # Changed from "unverified" to "pending" for non-matching faces
            
            # Convert dateOfBirth string to Date object
            personal_info = request.personalInfo.copy()
            if 'dateOfBirth' in personal_info:
                personal_info['dateOfBirth'] = datetime.fromisoformat(personal_info['dateOfBirth'].replace('Z', '+00:00'))
            
            # Add base URL to document names
            documents = request.documents.copy()
            base_url = "http://localhost:3000/uploads/"  # Adjust this to your actual upload URL
            for key in documents:
                if documents[key]:
                    documents[key] = f"{base_url}{documents[key]}"
            
            # Get current submission index
            current_submission = user['kyc'].get('currentSubmission', -1)
            if current_submission == -1:
                current_submission = 0
                user['kyc']['currentSubmission'] = 0
                user['kyc']['submissions'] = []
            
            # Create new submission
            new_submission = {
                'submittedAt': datetime.utcnow(),
                'verifiedAt': datetime.utcnow(),
                'verificationMethod': 'face_verification',
                'personalInfo': personal_info,
                'documents': documents,
                'auditTrail': [{
                    'action': status,
                    'details': {
                        'method': 'face_verification',
                        'confidence': message.split("confidence: ")[-1].split(")")[0] if "confidence:" in message else "N/A"
                    },
                    'timestamp': datetime.utcnow()
                }]
            }
            
            # Update user's KYC data
            update_result = await db.users.update_one(
                {"_id": user_id},
                {
                    "$set": {
                        "kyc.status": status,
                        "kyc.currentSubmission": current_submission,
                        f"kyc.submissions.{current_submission}": new_submission
                    }
                }
            )
            
            if update_result.modified_count == 0:
                print(f"Warning: No documents were updated for user {token}")
                # Try alternative update if the first one failed
                update_result = await db.users.update_one(
                    {"_id": user_id},
                    {
                        "$set": {
                            "kyc.status": status,
                            "kyc.currentSubmission": current_submission,
                            "kyc.submissions.$[submission]": new_submission
                        }
                    },
                    array_filters=[{"submission.submittedAt": {"$exists": False}}]
                )
                if update_result.modified_count == 0:
                    print(f"Warning: Alternative update also failed for user {token}")
                else:
                    print(f"Updated KYC status for user {token} using alternative method")
            else:
                print(f"Updated KYC status for user {token}")
        except Exception as db_error:
            print(f"Error updating KYC status: {str(db_error)}")
            # Don't fail the request if DB update fails
            pass
        
        # Determine animation type based on status
        animation_type = "success" if is_match else "pending"
        animation_message = "Verification Successful!" if is_match else "Verification Pending Review"
        
        result = {
            "status": "success" if is_match else "pending",
            "match": is_match,
            "message": message,
            "details": {
                "face_detected": True if "Could not process user face from selfie" not in message else False,
                "verification_completed": True,
                "kyc_updated": True,
                "verification_status": status,  # Use the same status variable we set earlier
                "animation": {
                    "type": animation_type,
                    "message": animation_message,
                    "icon": "check-circle" if is_match else "clock",
                    "color": "#4CAF50" if is_match else "#FFA500",
                    "duration": 3000  # Animation duration in milliseconds
                }
            }
        }
        print(f"\nFinal result: {result}")
        return result
    
    except Exception as e:
        print(f"\nError in endpoint: {str(e)}")
        # Propagate HTTPException details from verify_faces
        if isinstance(e, HTTPException):
             return {
                 "status": "error",
                 "match": False,
                 "message": e.detail,
                 "details": {
                     "face_detected": False,
                     "verification_completed": False,
                     "error_type": "http_exception",
                     "animation": {
                         "type": "error",
                         "message": "Verification Failed",
                         "icon": "x-circle",
                         "color": "#FF0000",
                         "duration": 3000
                     }
                 }
             }
        else:
             return {
                 "status": "error",
                 "match": False,
                 "message": str(e),
                 "details": {
                     "face_detected": False,
                     "verification_completed": False,
                     "error_type": "system_error",
                     "animation": {
                         "type": "error",
                         "message": "System Error",
                         "icon": "x-circle",
                         "color": "#FF0000",
                         "duration": 3000
                     }
                 }
             }

if __name__ == "__main__":
    uvicorn.run("face_verification:app", host="0.0.0.0", port=8000, reload=True) 