import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import crypto from 'crypto';
import logger from './logger.js';
import sharp from 'sharp';

class FileStorageService {
    constructor() {
        this.bucket = null;
        this.bucketName = 'uploads';

        // Image validation settings
        this.imageSettings = {
            profile: {
                minWidth: 200,
                minHeight: 200,
                maxWidth: 800,
                maxHeight: 800,
                aspectRatio: 1, // Square
                quality: 85,
                format: 'jpeg',
                crop: true, // Enable cropping for profile pictures
                preview: {
                    width: 200,
                    height: 200,
                    quality: 70
                }
            },
            kyc: {
                minWidth: 800,
                minHeight: 600,
                maxWidth: 2000,
                maxHeight: 2000,
                quality: 90,
                format: 'jpeg',
                crop: false,
                preview: {
                    width: 400,
                    height: 300,
                    quality: 75
                }
            },
            general: {
                minWidth: 100,
                minHeight: 100,
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 80,
                format: 'jpeg',
                crop: false,
                preview: {
                    width: 300,
                    height: 300,
                    quality: 70
                }
            }
        };

        this.maxFileSize = 5 * 1024 * 1024; // 5MB

        // Initialize bucket when connection is ready
        if (mongoose.connection.readyState === 1) {
            this.initializeBucket();
        } else {
            mongoose.connection.once('connected', () => {
                this.initializeBucket();
            });
        }
    }

    initializeBucket() {
        try {
            this.bucket = new GridFSBucket(mongoose.connection.db, {
                bucketName: this.bucketName
            });
            logger.info('GridFS bucket initialized');
        } catch (error) {
            logger.error('Error initializing GridFS bucket:', error);
            throw error;
        }
    }

    async generatePreview(image, settings) {
        try {
            let previewImage = image.clone();

            // Handle cropping for profile pictures
            if (settings.crop) {
                const metadata = await previewImage.metadata();
                const size = Math.min(metadata.width, metadata.height);
                const left = Math.floor((metadata.width - size) / 2);
                const top = Math.floor((metadata.height - size) / 2);

                previewImage = previewImage
                    .extract({ left, top, width: size, height: size });
            }

            // Generate preview
            const previewBuffer = await previewImage
                .resize(settings.preview.width, settings.preview.height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: settings.preview.quality })
                .toBuffer();

            return previewBuffer;
        } catch (error) {
            logger.error('Error generating preview:', error);
            throw error;
        }
    }

    validateFile(file, type = 'general') {
        // Check file size
        if (file.size > this.maxFileSize) {
            throw new Error(`File size exceeds limit of ${this.maxFileSize / 1024 / 1024}MB`);
        }

        // Check if it's an image
        if (!file.mimetype.startsWith('image/')) {
            throw new Error('Only image files are allowed');
        }

        // Validate image
        return this.validateImage(file, type);
    }

    async validateImage(file, type = 'general') {
        try {
            const settings = this.imageSettings[type] || this.imageSettings.general;
            const image = sharp(file.buffer);
            const metadata = await image.metadata();

            // Check image dimensions
            if (metadata.width < settings.minWidth || metadata.height < settings.minHeight) {
                throw new Error(`Image dimensions too small. Minimum ${settings.minWidth}x${settings.minHeight} pixels required.`);
            }

            // Process image based on type
            let processedImage = image;

            // Handle cropping for profile pictures
            if (type === 'profile' && settings.crop) {
                const size = Math.min(metadata.width, metadata.height);
                const left = Math.floor((metadata.width - size) / 2);
                const top = Math.floor((metadata.height - size) / 2);

                processedImage = processedImage
                    .extract({ left, top, width: size, height: size })
                    .resize(settings.maxWidth, settings.maxHeight, {
                        fit: 'cover',
                        position: 'center'
                    });
            } else {
                // Regular resize for other types
                processedImage = processedImage.resize(settings.maxWidth, settings.maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            // Convert to specified format
            if (settings.format === 'jpeg') {
                processedImage = processedImage.jpeg({ quality: settings.quality });
            } else if (settings.format === 'png') {
                processedImage = processedImage.png({ quality: settings.quality });
            }

            // Generate preview
            const previewBuffer = await this.generatePreview(image, settings);

            // Add metadata
            const optimizedBuffer = await processedImage
                .withMetadata()
                .toBuffer();

            logger.info('Image processed successfully', {
                type,
                originalSize: file.size,
                processedSize: optimizedBuffer.length,
                previewSize: previewBuffer.length,
                dimensions: `${metadata.width}x${metadata.height}`,
                format: metadata.format,
                cropped: type === 'profile' && settings.crop
            });

            return {
                main: optimizedBuffer,
                preview: previewBuffer
            };
        } catch (error) {
            logger.error('Image validation failed:', error);
            throw new Error(`Invalid image file: ${error.message}`);
        }
    }

    async storeFile(file, metadata = {}, type = 'general') {
        if (!this.bucket) {
            throw new Error('GridFS bucket not initialized');
        }

        try {
            // Validate and process image
            const { main: processedBuffer, preview: previewBuffer } = await this.validateFile(file, type);

            // Store main image
            const mainFile = await new Promise((resolve, reject) => {
                const uploadStream = this.bucket.openUploadStream(file.originalname, {
                    metadata: {
                        ...metadata,
                        contentType: file.mimetype,
                        uploadDate: new Date(),
                        size: processedBuffer.length,
                        originalSize: file.size,
                        type,
                        dimensions: metadata.dimensions,
                        cropped: type === 'profile'
                    }
                });

                uploadStream.on('error', (error) => {
                    logger.error('Error uploading file:', error);
                    reject(error);
                });

                uploadStream.on('finish', () => {
                    logger.info('File uploaded successfully', {
                        fileId: uploadStream.id,
                        filename: file.originalname,
                        type,
                        size: processedBuffer.length,
                        cropped: type === 'profile'
                    });
                    resolve({
                        fileId: uploadStream.id,
                        filename: file.originalname
                    });
                });

                uploadStream.end(processedBuffer);
            });

            // Store preview
            const previewFile = await new Promise((resolve, reject) => {
                const previewStream = this.bucket.openUploadStream(`preview_${file.originalname}`, {
                    metadata: {
                        ...metadata,
                        contentType: 'image/jpeg',
                        uploadDate: new Date(),
                        size: previewBuffer.length,
                        type: `${type}_preview`,
                        isPreview: true,
                        originalFileId: mainFile.fileId
                    }
                });

                previewStream.on('error', (error) => {
                    logger.error('Error uploading preview:', error);
                    reject(error);
                });

                previewStream.on('finish', () => {
                    logger.info('Preview uploaded successfully', {
                        previewId: previewStream.id,
                        originalFileId: mainFile.fileId
                    });
                    resolve({
                        previewId: previewStream.id,
                        originalFileId: mainFile.fileId
                    });
                });

                previewStream.end(previewBuffer);
            });

            return {
                ...mainFile,
                previewId: previewFile.previewId
            };
        } catch (error) {
            logger.error('File storage error:', error);
            throw error;
        }
    }

    async getFileStream(fileId, preview = false) {
        if (!this.bucket) {
            throw new Error('GridFS bucket not initialized');
        }

        try {
            const file = await this.bucket.find({ _id: fileId }).next();
            if (!file) {
                throw new Error('File not found');
            }

            // If requesting preview, find the preview file
            if (preview) {
                const previewFile = await this.bucket.find({
                    'metadata.originalFileId': fileId,
                    'metadata.isPreview': true
                }).next();

                if (!previewFile) {
                    throw new Error('Preview not found');
                }

                const stream = this.bucket.openDownloadStream(previewFile._id);
                return {
                    stream,
                    metadata: {
                        filename: previewFile.filename,
                        contentType: previewFile.contentType,
                        uploadDate: previewFile.uploadDate,
                        size: previewFile.length,
                        type: previewFile.metadata?.type,
                        isPreview: true
                    }
                };
            }

            const stream = this.bucket.openDownloadStream(fileId);
            return {
                stream,
                metadata: {
                    filename: file.filename,
                    contentType: file.contentType,
                    uploadDate: file.uploadDate,
                    size: file.length,
                    type: file.metadata?.type,
                    dimensions: file.metadata?.dimensions,
                    cropped: file.metadata?.cropped,
                    previewId: file.metadata?.previewId
                }
            };
        } catch (error) {
            logger.error('Error getting file stream:', error);
            throw error;
        }
    }

    async deleteFile(fileId) {
        if (!this.bucket) {
            throw new Error('GridFS bucket not initialized');
        }

        try {
            // Find and delete preview if exists
            const preview = await this.bucket.find({
                'metadata.originalFileId': fileId,
                'metadata.isPreview': true
            }).next();

            if (preview) {
                await this.bucket.delete(preview._id);
                logger.info('Preview deleted:', preview._id);
            }

            // Delete main file
            await this.bucket.delete(fileId);
            logger.info('File deleted:', fileId);
        } catch (error) {
            logger.error('Error deleting file:', error);
            throw error;
        }
    }

    async listFiles() {
        if (!this.bucket) {
            throw new Error('GridFS bucket not initialized');
        }

        try {
            const files = await this.bucket.find().toArray();
            return files.map(file => ({
                id: file._id,
                filename: file.filename,
                contentType: file.contentType,
                uploadDate: file.uploadDate,
                length: file.length,
                metadata: file.metadata
            }));
        } catch (error) {
            logger.error('Error listing files:', error);
            throw error;
        }
    }

    async getFileDetails(fileId) {
        if (!this.bucket) {
            throw new Error('GridFS bucket not initialized');
        }

        try {
            const file = await this.bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
            if (!file || file.length === 0) {
                throw new Error('File not found');
            }

            return {
                id: file[0]._id,
                filename: file[0].filename,
                contentType: file[0].contentType,
                uploadDate: file[0].uploadDate,
                length: file[0].length,
                metadata: file[0].metadata
            };
        } catch (error) {
            logger.error('Error getting file details:', error);
            throw error;
        }
    }
}

const fileStorage = new FileStorageService();
export default fileStorage; 