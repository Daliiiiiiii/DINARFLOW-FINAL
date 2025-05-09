import User from '../models/User.js';
import fileStorage from './fileStorage.js';
import logger from './logger.js';

class KycService {
    async submitKyc(userId, data, files) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Validate required files
            const requiredFiles = ['frontId', 'backId', 'selfieWithId'];
            const missingFiles = requiredFiles.filter(fileName => !files[fileName]?.[0]);
            if (missingFiles.length > 0) {
                throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
            }

            // Process and store files
            const storedFiles = {};
            for (const [key, fileArray] of Object.entries(files)) {
                try {
                    const file = fileArray[0];
                    const metadata = await fileStorage.storeFile(file, {
                        userId,
                        documentType: key,
                        uploadDate: new Date()
                    });
                    storedFiles[key] = metadata.id;
                } catch (error) {
                    logger.error(`Error storing ${key} file:`, error);
                    throw new Error(`Failed to store ${key} file: ${error.message}`);
                }
            }

            // Update user KYC data
            user.kyc = {
                ...user.kyc,
                status: 'pending',
                documents: storedFiles,
                submittedAt: new Date(),
                data: {
                    ...data,
                    documents: storedFiles
                }
            };
            user.kycStatus = 'pending';

            await user.save();

            // Create audit trail
            await this.createAuditTrail(userId, 'submitted', 'KYC documents submitted for verification');

            return {
                message: 'KYC submitted successfully',
                status: 'pending'
            };
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

            user.kyc.status = status;
            user.kyc.verifiedAt = new Date();
            user.kyc.verificationNotes = notes;
            user.kycStatus = status;

            await user.save();

            // Create audit trail
            await this.createAuditTrail(userId, status, notes || `KYC ${status}`);

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

            return {
                status: user.kyc?.status || 'unverified',
                submittedAt: user.kyc?.submittedAt,
                verifiedAt: user.kyc?.verifiedAt,
                verificationNotes: user.kyc?.verificationNotes
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

    async createAuditTrail(userId, action, notes) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const auditEntry = {
                action,
                notes,
                timestamp: new Date()
            };

            if (!user.kyc.auditTrail) {
                user.kyc.auditTrail = [];
            }

            user.kyc.auditTrail.push(auditEntry);
            await user.save();

            return auditEntry;
        } catch (error) {
            logger.error('Error creating KYC audit trail:', error);
            throw error;
        }
    }
}

export default new KycService(); 