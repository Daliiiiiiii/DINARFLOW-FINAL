import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import process from 'process';
import dotenv from 'dotenv';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

dotenv.config();

async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    const backupFile = path.join(backupDir, `${timestamp}.json.gz`);

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create write stream with gzip compression
        const writeStream = fs.createWriteStream(backupFile);
        const gzip = createGzip();

        // Start backup process
        console.log('Starting backup process...');

        // Export data from collections
        const collections = {
            users: await User.find({}),
            transactions: await Transaction.find({})
        };

        // Write data to file
        const data = JSON.stringify(collections, null, 2);
        await pipeline(
            async function* () {
                yield data;
            },
            gzip,
            writeStream
        );

        console.log('Backup completed successfully');

        // Keep only the last 5 backups
        const files = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.json.gz'))
            .sort((a, b) => {
                return fs.statSync(path.join(backupDir, b)).mtime.getTime() -
                    fs.statSync(path.join(backupDir, a)).mtime.getTime();
            });

        if (files.length > 5) {
            for (const file of files.slice(5)) {
                fs.unlinkSync(path.join(backupDir, file));
            }
        }

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');

        process.exit(0);
    } catch (error) {
        console.error('Backup failed:', error);
        process.exit(1);
    }
}

// Run backup
createBackup(); 