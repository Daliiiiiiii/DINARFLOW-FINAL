import express from 'express';
import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import logger from '../services/logger.js';

const router = express.Router();

// Get file by filename
router.get('/:filename', async (req, res) => {
    try {
        const bucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });

        const files = await bucket.find({ filename: req.params.filename }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = files[0];
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);

        const downloadStream = bucket.openDownloadStream(file._id);
        downloadStream.pipe(res);

        downloadStream.on('error', (error) => {
            logger.error('Error streaming file:', error);
            res.status(500).json({ error: 'Error streaming file' });
        });
    } catch (error) {
        logger.error('Error accessing file:', error);
        res.status(500).json({ error: 'Error accessing file' });
    }
});

export default router; 