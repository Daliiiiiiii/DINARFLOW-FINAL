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