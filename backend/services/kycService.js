import User from '../models/User.js';
import KycAudit from '../models/KycAudit.js';
import fileStorage from './fileStorage.js';
import logger from './logger.js';
import sharp from 'sharp';
import { validate } from 'jsonschema';
import Kyc from '../models/Kyc.js';

const KYC_SCHEMA = {
    type: 'object',
    required: ['idType', 'idNumber', 'dateOfBirth', 'nationality', 'occupation'],
    properties: {
        idType: {
            type: 'string',
            enum: ['passport', 'national_id', 'drivers_license']
        },
        idNumber: {
            type: 'string',
            pattern: '^[A-Za-z0-9-]+$'
        },
        dateOfBirth: {
            type: 'string',
            format: 'date'
        },
        nationality: {
            type: 'string',
            minLength: 2,
            maxLength: 3
        },
        occupation: {
            type: 'string',
            minLength: 2
        }
    }
};

class KycService {
    async submitKyc(userId, kycData, files) {
        try {
            // Validate KYC data
            const validation = validate(kycData, KYC_SCHEMA);
            if (!validation.valid) {
                throw new Error(`Invalid KYC data: ${validation.errors.map(e => e.message).join(', ')}`);
            }

            // Validate and process files
            const processedFiles = await this.processFiles(files);

            // Store files in GridFS
            const storedFiles = await Promise.all([
                fileStorage.storeFile(processedFiles.idFront, { userId, type: 'id_front' }),
                fileStorage.storeFile(processedFiles.idBack, { userId, type: 'id_back' }),
                fileStorage.storeFile(processedFiles.selfie, { userId, type: 'selfie' })
            ]);

            // Update user KYC data
            const user = await User.findByIdAndUpdate(
                userId,
                {
                    kycStatus: 'in_progress',
                    kycData: {
                        ...kycData,
                        idFrontUrl: storedFiles[0].fileId,
                        idBackUrl: storedFiles[1].fileId,
                        selfieUrl: storedFiles[2].fileId
                    }
                },
                { new: true }
            );

            // Create audit trail
            await KycAudit.create({
                userId,
                action: 'submission',
                previousStatus: 'pending',
                newStatus: 'in_progress',
                metadata: {
                    idType: kycData.idType,
                    fileHashes: storedFiles.map(f => f.fileHash)
                }
            });

            logger.info('KYC submission successful', { userId });
            return user;
        } catch (error) {
            logger.error('KYC submission failed', { userId, error: error.message });
            throw error;
        }
    }

    async processFiles(files) {
        const processedFiles = {};

        for (const [key, file] of Object.entries(files)) {
            // Basic image validation
            const image = sharp(file.buffer);
            const metadata = await image.metadata();

            // Check image quality
            if (metadata.width < 800 || metadata.height < 600) {
                throw new Error(`${key} image resolution too low`);
            }

            // Convert to consistent format and optimize
            processedFiles[key] = {
                ...file,
                buffer: await image
                    .resize(1200, 800, { fit: 'inside' })
                    .jpeg({ quality: 80 })
                    .toBuffer()
            };
        }

        return processedFiles;
    }

    async verifyKyc(userId, adminId, status, reason = '') {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const previousStatus = user.kycStatus;

            // Update user status
            user.kycStatus = status;
            user.kycVerified = status === 'verified';
            await user.save();

            // Create audit trail
            await KycAudit.create({
                userId,
                action: status === 'verified' ? 'verification' : 'rejection',
                previousStatus,
                newStatus: status,
                verifiedBy: adminId,
                reason
            });

            logger.info('KYC status updated', { userId, status, adminId });
            return user;
        } catch (error) {
            logger.error('KYC verification failed', { userId, error: error.message });
            throw error;
        }
    }

    async deleteKycData(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            // Delete stored files
            if (user.kycData) {
                await Promise.all([
                    fileStorage.deleteFile(user.kycData.idFrontUrl),
                    fileStorage.deleteFile(user.kycData.idBackUrl),
                    fileStorage.deleteFile(user.kycData.selfieUrl)
                ]);
            }

            // Update user
            user.kycData = null;
            user.kycStatus = 'pending';
            user.kycVerified = false;
            await user.save();

            // Create audit trail
            await KycAudit.create({
                userId,
                action: 'deletion',
                previousStatus: user.kycStatus,
                newStatus: 'pending'
            });

            logger.info('KYC data deleted', { userId });
            return user;
        } catch (error) {
            logger.error('KYC data deletion failed', { userId, error: error.message });
            throw error;
        }
    }

    async getKycAudit(userId) {
        try {
            return await KycAudit.find({ userId })
                .sort({ createdAt: -1 })
                .populate('verifiedBy', 'displayName email');
        } catch (error) {
            logger.error('Failed to fetch KYC audit', { userId, error: error.message });
            throw error;
        }
    }
}

export default new KycService();

export const createKyc = async (data) => {
    try {
        // Create KYC record
        const kyc = await Kyc.create(data);

        // Update user's KYC status
        await User.findByIdAndUpdate(data.userId, {
            kycStatus: 'in_progress'
        });

        logger.info('KYC created and user status updated', {
            kycId: kyc._id,
            userId: data.userId
        });

        return kyc;
    } catch (error) {
        logger.error('Error creating KYC:', error);
        throw error;
    }
};

export const getKyc = async (query) => {
    try {
        return await Kyc.find(query);
    } catch (error) {
        logger.error('Error getting KYC:', error);
        throw error;
    }
};

export const updateKycStatus = async (kycId, status, comment) => {
    try {
        const kyc = await Kyc.findById(kycId);
        if (!kyc) {
            throw new Error('KYC record not found');
        }

        // Update KYC status
        kyc.status = status;
        kyc.comment = comment;
        kyc.verifiedAt = new Date();
        await kyc.save();

        // Update user's KYC status
        const userStatus = status === 'approved' ? 'verified' :
            status === 'rejected' ? 'rejected' : 'in_progress';

        await User.findByIdAndUpdate(kyc.userId, {
            kycStatus: userStatus,
            kycVerified: status === 'approved'
        });

        logger.info('KYC status updated', {
            kycId: kyc._id,
            status,
            userId: kyc.userId
        });

        return kyc;
    } catch (error) {
        logger.error('Error updating KYC status:', error);
        throw error;
    }
};

export const deleteKyc = async (kycId) => {
    try {
        const kyc = await Kyc.findById(kycId);
        if (!kyc) {
            throw new Error('KYC record not found');
        }

        // Update user's KYC status to pending
        await User.findByIdAndUpdate(kyc.userId, {
            kycStatus: 'pending',
            kycVerified: false
        });

        await Kyc.findByIdAndDelete(kycId);

        logger.info('KYC deleted and user status reset', {
            kycId,
            userId: kyc.userId
        });
    } catch (error) {
        logger.error('Error deleting KYC:', error);
        throw error;
    }
}; 