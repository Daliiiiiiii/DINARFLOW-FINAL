import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class FileStorageService {
    constructor() {
        this.uploadDir = path.join(__dirname, '..', 'uploads');
        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async storeFile(file, metadata = {}) {
        try {
            // Generate unique filename
            const fileId = uuidv4();
            const fileExt = path.extname(file.originalname).toLowerCase();
            const filename = `${fileId}${fileExt}`;
            const filepath = path.join(this.uploadDir, filename);

            // Check file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                throw new Error('Only JPG, PNG, GIF, and WebP images are allowed.');
            }

            // Process image
            try {
                if (file.mimetype === 'image/gif') {
                    // For GIFs, just move the file without processing
                    if (file.buffer) {
                        await fs.promises.writeFile(filepath, file.buffer);
                    } else if (file.path) {
                        await fs.promises.copyFile(file.path, filepath);
                        // Delete the original file after copying
                        try {
                            await fs.promises.unlink(file.path);
                        } catch (error) {
                            logger.error('Error deleting original file:', error);
                        }
                    }
                } else {
                    // Process other image types with Sharp
                    if (file.buffer) {
                        await sharp(file.buffer)
                            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
                            .toFile(filepath);
                    } else if (file.path) {
                        await sharp(file.path)
                            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
                            .toFile(filepath);

                        // Delete the original file after processing
                        try {
                            await fs.promises.unlink(file.path);
                        } catch (error) {
                            logger.error('Error deleting original file:', error);
                        }
                    }
                }
            } catch (error) {
                logger.error('Error processing image:', error);
                throw new Error('Failed to process image. Please try again with a different file.');
            }

            // Store metadata
            const fileMetadata = {
                id: fileId,
                originalName: file.originalname,
                filename,
                contentType: file.mimetype,
                size: file.size,
                uploadDate: new Date(),
                ...metadata
            };

            const metadataPath = path.join(this.uploadDir, `${fileId}.json`);
            fs.writeFileSync(metadataPath, JSON.stringify(fileMetadata, null, 2));

            return fileMetadata;
        } catch (error) {
            logger.error('Error storing file:', error);
            throw error;
        }
    }

    async getFileStream(fileId) {
        try {
            const metadataPath = path.join(this.uploadDir, `${fileId}.json`);
            if (!fs.existsSync(metadataPath)) {
                throw new Error('File not found');
            }

            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            const filepath = path.join(this.uploadDir, metadata.filename);

            if (!fs.existsSync(filepath)) {
                throw new Error('File not found');
            }

            const stream = fs.createReadStream(filepath);
            return { stream, metadata };
        } catch (error) {
            logger.error('Error getting file stream:', error);
            throw error;
        }
    }

    async deleteFile(fileId) {
        try {
            const metadataPath = path.join(this.uploadDir, `${fileId}.json`);
            if (!fs.existsSync(metadataPath)) {
                throw new Error('File not found');
            }

            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            const filepath = path.join(this.uploadDir, metadata.filename);

            // Delete both file and metadata
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            fs.unlinkSync(metadataPath);
        } catch (error) {
            logger.error('Error deleting file:', error);
            throw error;
        }
    }

    async listFiles() {
        try {
            const files = fs.readdirSync(this.uploadDir)
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const metadata = JSON.parse(fs.readFileSync(path.join(this.uploadDir, file), 'utf8'));
                    return metadata;
                });
            return files;
        } catch (error) {
            logger.error('Error listing files:', error);
            throw error;
        }
    }

    async getFileDetails(fileId) {
        try {
            const metadataPath = path.join(this.uploadDir, `${fileId}.json`);
            if (!fs.existsSync(metadataPath)) {
                throw new Error('File not found');
            }

            return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        } catch (error) {
            logger.error('Error getting file details:', error);
            throw error;
        }
    }
}

export default new FileStorageService(); 