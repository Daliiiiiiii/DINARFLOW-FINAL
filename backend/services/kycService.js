import User from '../models/User.js';
import fileStorage from './fileStorage.js';
import logger from './logger.js';

export default class KycService {
    validateIdNumber(idNumber) {
        return /^\d{8}$/.test(idNumber);
    }

    validateDateOfBirth(dob) {
        const date = new Date(dob);
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
            return age - 1 >= 18;
        }
        return age >= 18;
    }

    validatePersonalInfo(data) {
        const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'address', 'city', 'province', 'zipCode'];
        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        if (!this.validateDateOfBirth(data.dateOfBirth)) {
            throw new Error('User must be at least 18 years old');
        }

        if (!this.validateIdNumber(data.idNumber)) {
            throw new Error('ID number must be exactly 8 digits');
        }

        // Validate zip code format (4 digits)
        if (!/^\d{4}$/.test(data.zipCode)) {
            throw new Error('Zip code must be exactly 4 digits');
        }
    }

    async submitKyc(userId, data, files) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Initialize KYC submissions array if it doesn't exist
            if (!user.kyc) {
                user.kyc = {
                    submissions: [],
                    currentSubmission: -1
                };
            }

            // Check if user has a pending submission
            /*const hasPendingSubmission = user.kyc.submissions.some(
                submission => submission.status === 'pending'
            );
            if (hasPendingSubmission) {
                throw new Error('You already have a pending KYC submission. Please wait for it to be reviewed.');
            }*/

            // Validate personal information
            const validationErrors = [];

            // Validate ID type
            if (!['national_id', 'passport', 'driving_license'].includes(data.idType)) {
                validationErrors.push('Invalid ID type');
            }

            // Validate ID number format
            if (!data.idNumber?.match(/^\d{8}$/)) {
                validationErrors.push('ID number must be exactly 8 digits');
            }

            // Validate name fields
            if (!data.firstName?.trim() || data.firstName.length < 2 || data.firstName.length > 50) {
                validationErrors.push('First name must be between 2 and 50 characters');
            }
            if (!data.lastName?.trim() || data.lastName.length < 2 || data.lastName.length > 50) {
                validationErrors.push('Last name must be between 2 and 50 characters');
            }

            // Validate date of birth
            const dob = new Date(data.dateOfBirth);
            const today = new Date();
            const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
            if (isNaN(dob.getTime()) || dob > minAge) {
                validationErrors.push('You must be at least 18 years old');
            }

            if (validationErrors.length > 0) {
                throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
            }

            // Process and store files
            const storedFiles = {};
            const storedFileIds = [];
            try {
                for (const [key, fileArray] of Object.entries(files)) {
                    try {
                        const file = fileArray[0];
                        const metadata = await fileStorage.storeFile(file, {
                            userId,
                            documentType: key,
                            uploadDate: new Date()
                        });
                        storedFiles[key] = metadata.filename;
                        console.log('Storing KYC document:', key, metadata.filename);
                        storedFileIds.push(metadata.id);
                    } catch (error) {
                        logger.error(`Error storing ${key} file:`, error);
                        throw new Error(`Failed to store ${key} file: ${error.message}`);
                    }
                }

                // Create new submission
                const newSubmission = {
                    submittedAt: new Date(),
                    documents: storedFiles,
                    personalInfo: {
                        idType: data.idType,
                        idNumber: data.idNumber,
                        dateOfBirth: new Date(data.dateOfBirth),
                        firstName: data.firstName.trim(),
                        lastName: data.lastName.trim(),
                        address: data.address.trim(),
                        city: data.city.trim(),
                        province: data.province.trim(),
                        zipCode: data.zipCode
                    },
                    auditTrail: [{
                        action: 'submitted',
                        details: {
                            timestamp: new Date()
                        },
                        timestamp: new Date()
                    }]
                };

                // Add new submission to the array
                user.kyc.submissions.push(newSubmission);
                user.kyc.currentSubmission = user.kyc.submissions.length - 1;
                // Set KYC status to pending
                // user.kyc.status = 'pending';

                await user.save();

                // --- AI Verification (Python backend) ---
                try {
                    const axios = await import('axios').then(m => m.default || m);
                    const fs = await import('fs').then(m => m.default || m);
                    const path = await import('path').then(m => m.default || m);

                    const selfieWithIdPath = path.join(process.cwd(), 'uploads', storedFiles.selfieWithId);
                    const frontIdPath = path.join(process.cwd(), 'uploads', storedFiles.frontId);

                    console.log('Reading files for AI:', selfieWithIdPath, frontIdPath);
                    console.log('Files exist:', fs.existsSync(selfieWithIdPath), fs.existsSync(frontIdPath));

                    const selfieWithIdBase64 = fs.readFileSync(selfieWithIdPath, { encoding: 'base64' });
                    const frontIdBase64 = fs.readFileSync(frontIdPath, { encoding: 'base64' });

                    console.log('Base64 selfie length:', selfieWithIdBase64.length);
                    console.log('Base64 frontId length:', frontIdBase64.length);

                    // Generate a real JWT for the user
                    const jwt = await import('jsonwebtoken').then(m => m.default || m);
                    const JWT_SECRET = process.env.JWT_SECRET || 'dinarflow_jwt_secret_key_2024_secure_and_unique_key_for_auth';
                    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '1h' });

                    const aiResponse = await axios.post('http://localhost:8000/verify-faces', {
                        selfie_with_id: `data:image/jpeg;base64,${selfieWithIdBase64}`,
                        id_image: `data:image/jpeg;base64,${frontIdBase64}`,
                        personalInfo: newSubmission.personalInfo,
                        documents: storedFiles
                    }, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    // Optionally update KYC status based on AI result
                    if (aiResponse.data && aiResponse.data.match === true) {
                        user.kyc.status = 'verified';
                        await user.save();
                    } else {
                        user.kyc.status = 'pending';
                        await user.save();
                    }
                } catch (err) {
                    console.error('AI verification failed:', err.message);
                }

                // Notify all admins and superadmins of new KYC submission
                try {
                    const notificationService = (await import('./notificationService.js')).default;
                    const User = (await import('../models/User.js')).default;
                    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, notificationsEnabled: true });
                    const submittingUser = await User.findById(userId);
                    const title = 'New KYC Submission';
                    const message = `A new KYC has been submitted by ${submittingUser.displayName || submittingUser.email}.`;
                    for (const admin of admins) {
                        await notificationService.createNotification(
                            admin._id,
                            'alert',
                            title,
                            message,
                            {
                                submittedBy: submittingUser.displayName || submittingUser.email,
                                submittedByEmail: submittingUser.email,
                                userId: submittingUser._id.toString()
                            }
                        );
                    }
                } catch (notifErr) {
                    console.error('Failed to send admin KYC notification:', notifErr);
                }

                // Notify user of KYC approval or rejection (not for pending)
                try {
                    if (user.kyc.status === 'verified' || user.kyc.status === 'rejected') {
                        const notificationService = (await import('./notificationService.js')).default;
                        const title = user.kyc.status === 'verified' ? 'KYC Approved' : 'KYC Declined';
                        const message = user.kyc.status === 'verified'
                            ? 'Your KYC submission has been approved. You now have full access.'
                            : 'Your KYC submission has been declined. Please review your documents and try again.';
                        await notificationService.createNotification(
                            user._id,
                            'alert',
                            title,
                            message,
                            {
                                kycStatus: user.kyc.status,
                                reviewedAt: new Date(),
                                notes: ''
                            }
                        );
                    }
                } catch (notifErr) {
                    console.error('Failed to send user KYC notification:', notifErr);
                }

                return {
                    message: 'KYC documents submitted successfully',
                    // status: 'pending'
                };
            } catch (error) {
                // Clean up stored files if there's an error
                for (const fileId of storedFileIds) {
                    try {
                        await fileStorage.deleteFile(fileId);
                    } catch (deleteError) {
                        logger.error('Error cleaning up file:', deleteError);
                    }
                }
                throw error;
            }
        } catch (error) {
            logger.error('Error submitting KYC:', error);
            throw error;
        }
    }

    async verifyKyc(userId, status, notes) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            if (!['verified', 'rejected'].includes(status)) {
                throw new Error('Invalid KYC status');
            }

            const currentSubmission = user.kyc.submissions[user.kyc.currentSubmission];
            if (!currentSubmission) {
                throw new Error('No active KYC submission found');
            }

            currentSubmission.status = status;
            currentSubmission.verifiedAt = new Date();
            currentSubmission.verificationNotes = notes;

            // Add to audit trail
            currentSubmission.auditTrail.push({
                action: status,
                details: {
                    notes,
                    timestamp: new Date()
                },
                timestamp: new Date()
            });

            await user.save();

            // Notify user of KYC approval or rejection (not for pending)
            try {
                if (status === 'verified' || status === 'rejected') {
                    const notificationService = (await import('./notificationService.js')).default;
                    const title = status === 'verified' ? 'KYC Approved' : 'KYC Declined';
                    const message = status === 'verified'
                        ? 'Your KYC submission has been approved. You now have full access.'
                        : 'Your KYC submission has been declined. Please review your documents and try again.';
                    await notificationService.createNotification(
                        user._id,
                        'alert',
                        title,
                        message,
                        {
                            kycStatus: status,
                            reviewedAt: currentSubmission.verifiedAt,
                            notes: notes || ''
                        }
                    );
                }
            } catch (notifErr) {
                console.error('Failed to send user KYC notification:', notifErr);
            }

            return {
                message: `KYC ${status} successfully`,
                status
            };
        } catch (error) {
            logger.error('Error verifying KYC:', error);
            throw error;
        }
    }

    async getKycStatus(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            if (!user.kyc || user.kyc.currentSubmission === -1) {
                return {
                    status: 'unverified',
                    submissions: []
                };
            }

            const currentSubmission = user.kyc.submissions[user.kyc.currentSubmission];
            return {
                status: currentSubmission?.status || 'unverified',
                submittedAt: currentSubmission?.submittedAt,
                verifiedAt: currentSubmission?.verifiedAt,
                verificationNotes: currentSubmission?.verificationNotes,
                submissions: user.kyc.submissions.map(sub => ({
                    status: sub.status,
                    submittedAt: sub.submittedAt,
                    verifiedAt: sub.verifiedAt,
                    verificationNotes: sub.verificationNotes
                }))
            };
        } catch (error) {
            logger.error('Error getting KYC status:', error);
            throw error;
        }
    }

    async getKycDocuments(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            if (!user.kyc?.documents) {
                return null;
            }

            const documents = {};
            for (const [key, fileId] of Object.entries(user.kyc.documents)) {
                try {
                    const metadata = await fileStorage.getFileDetails(fileId);
                    documents[key] = metadata;
                } catch (error) {
                    logger.error(`Error getting ${key} document:`, error);
                    documents[key] = { error: 'Document not found' };
                }
            }

            return documents;
        } catch (error) {
            logger.error('Error getting KYC documents:', error);
            throw error;
        }
    }

    async getAuditTrail(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            return user.kyc?.auditTrail || [];
        } catch (error) {
            logger.error('Error getting KYC audit trail:', error);
            throw error;
        }
    }

    async createAuditTrail(userId, action, details) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Initialize KYC object if it doesn't exist
            if (!user.kyc) {
                user.kyc = {
                    status: 'unverified',
                    auditTrail: []
                };
            }

            // Initialize audit trail if it doesn't exist
            if (!user.kyc.auditTrail) {
                user.kyc.auditTrail = [];
            }

            user.kyc.auditTrail.push({
                action,
                details: typeof details === 'string' ? { message: details } : details,
                timestamp: new Date()
            });

            await user.save();
        } catch (error) {
            logger.error('Error creating audit trail:', error);
            throw error;
        }
    }
} 