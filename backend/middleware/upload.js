import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
try {
    await fs.access(uploadsDir);
} catch {
    await fs.mkdir(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for profile pictures
const fileFilter = (req, file, cb) => {
    // Allow JPG, PNG, GIF, and WebP
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only JPG, PNG, GIF, and WebP images are allowed.'));
    }

    cb(null, true);
};

// Create multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Export specific upload configurations
export const uploadKyc = upload.fields([
    { name: 'frontId', maxCount: 1 },
    { name: 'backId', maxCount: 1 },
    { name: 'selfieWithId', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
]);

export const uploadSingle = upload.single('profilePicture');

// Generic image upload middleware for any field name
export const uploadImage = (fieldName) => upload.single(fieldName); 