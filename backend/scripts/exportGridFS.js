import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GridFSBucket } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create export directory if it doesn't exist
const exportDir = path.join(__dirname, '../../exports');
if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
}

async function exportFiles() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get GridFS bucket
        const bucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });

        // Get all files
        const files = await bucket.find({}).toArray();
        console.log(`Found ${files.length} files to export`);

        // Export each file
        for (const file of files) {
            const filePath = path.join(exportDir, file.filename);
            console.log(`Exporting ${file.filename}...`);

            // Create write stream
            const writeStream = fs.createWriteStream(filePath);

            // Create read stream from GridFS
            const readStream = bucket.openDownloadStream(file._id);

            // Pipe the file to disk
            await new Promise((resolve, reject) => {
                readStream.pipe(writeStream)
                    .on('error', reject)
                    .on('finish', resolve);
            });

            console.log(`Successfully exported ${file.filename}`);
        }

        console.log('Export completed successfully');
    } catch (error) {
        console.error('Error exporting files:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the export
exportFiles(); 