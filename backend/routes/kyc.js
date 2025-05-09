import express from 'express';
import { auth, isAdmin } from '../middleware/auth.js';
import { uploadKyc } from '../middleware/upload.js';
import logger from '../services/logger.js';
import User from '../models/User.js';
import fileStorage from '../services/fileStorage.js';
import KycService from '../services/kycService.js';
import multer from 'multer';
import fs from 'fs';

const router = express.Router();

// Get KYC status for current user
router.get('/status', auth, async (req, res) => {
  try {
    const status = await KycService.getKycStatus(req.user._id);
    res.json(status);
  } catch (error) {
    logger.error('Error getting KYC status:', { error, userId: req.user._id });
    res.status(500).json({ error: error.message || 'Error getting KYC status' });
  }
});

// Submit KYC
router.post('/submit', auth, async (req, res) => {
  try {
    // Log the request for debugging
    logger.info('KYC submission request received');

    // Handle the file upload
    uploadKyc(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        logger.error('Multer error during KYC upload:', { error: err });
        return res.status(400).json({
          error: 'File upload error',
          details: err.message
        });
      } else if (err) {
        // An unknown error occurred
        logger.error('Unknown error during KYC upload:', { error: err });
        return res.status(500).json({
          error: 'File upload failed',
          details: err.message
        });
      }

      try {
        // Validate files
        if (!req.files) {
          return res.status(400).json({ error: 'No files uploaded' });
        }

        const requiredFiles = ['frontId', 'backId', 'selfieWithId'];
        const missingFiles = requiredFiles.filter(fileName => !req.files[fileName]?.[0]);

        if (missingFiles.length > 0) {
          return res.status(400).json({
            error: `Missing required files: ${missingFiles.join(', ')}`
          });
        }

        // Process the submission
        const result = await KycService.submitKyc(req.user._id, req.body, req.files);
        res.status(200).json(result);
      } catch (error) {
        logger.error('Error processing KYC submission:', {
          error: error.message,
          stack: error.stack,
          userId: req.user._id
        });

        // Clean up uploaded files in case of error
        if (req.files) {
          try {
            await Promise.all(
              Object.values(req.files).flat().map(file =>
                fs.unlink(file.path).catch(err =>
                  logger.error('Error cleaning up file:', { file: file.path, error: err })
                )
              )
            );
          } catch (cleanupError) {
            logger.error('Error during file cleanup:', cleanupError);
          }
        }

        // Send appropriate error response
        if (error.message.includes('file size')) {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes('file type')) {
          return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: error.message || 'Failed to submit KYC' });
      }
    });
  } catch (error) {
    logger.error('Unexpected error in KYC submission:', {
      error: error.message,
      stack: error.stack,
      userId: req.user._id
    });
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Get KYC documents
router.get('/documents', auth, async (req, res) => {
  try {
    const documents = await KycService.getKycDocuments(req.user._id);
    res.json(documents);
  } catch (error) {
    logger.error('Error getting KYC documents:', error);
    res.status(500).json({ error: error.message || 'Failed to get KYC documents' });
  }
});

// Get KYC audit trail
router.get('/audit', auth, async (req, res) => {
  try {
    const auditTrail = await KycService.getAuditTrail(req.user._id);
    res.json(auditTrail);
  } catch (error) {
    logger.error('Error getting KYC audit trail:', error);
    res.status(500).json({ error: error.message || 'Failed to get KYC audit trail' });
  }
});

// Admin routes
router.get('/admin/pending', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ kycStatus: 'pending' }).select('email displayName firstName lastName kycStatus kycData');
    res.json({ users });
  } catch (error) {
    logger.error('Error fetching pending KYC users', { error: error.message });
    res.status(500).json({ message: 'Error fetching pending KYC users' });
  }
});

router.post('/verify/:userId', auth, isAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const result = await KycService.verifyKyc(req.params.userId, status, notes);
    res.json(result);
  } catch (error) {
    logger.error('Error verifying KYC:', error);
    res.status(500).json({ error: error.message || 'Failed to verify KYC' });
  }
});

router.delete('/admin/:userId', auth, isAdmin, async (req, res) => {
  try {
    await KycService.deleteKycData(req.params.userId);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting KYC data:', { error, adminId: req.user._id });
    res.status(500).json({ error: 'Failed to delete KYC data' });
  }
});

// Get KYC document
router.get('/documents/:fileId', auth, async (req, res, next) => {
  try {
    const { stream, metadata } = await fileStorage.getFileStream(req.params.fileId);
    res.set('Content-Type', metadata.contentType);
    stream.pipe(res);
  } catch (error) {
    logger.error('Error fetching KYC document', {
      fileId: req.params.fileId,
      error: error.message
    });
    next(error);
  }
});

// Get KYC audit trail for a user
router.get('/audit/:userId', auth, isAdmin, async (req, res) => {
  try {
    const audit = await KycService.getKycAudit(req.params.userId);
    res.status(200).json({ audit });
  } catch (error) {
    logger.error('Error fetching KYC audit:', { error, adminId: req.user._id });
    res.status(500).json({ error: 'Failed to fetch KYC audit' });
  }
});

// Get all stored files (admin only)
router.get('/admin/files', auth, isAdmin, async (req, res) => {
  try {
    const files = await fileStorage.listFiles();
    res.json(files);
  } catch (error) {
    logger.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Get file details (admin only)
router.get('/admin/files/:fileId', auth, isAdmin, async (req, res) => {
  try {
    const file = await fileStorage.getFileDetails(req.params.fileId);
    res.json(file);
  } catch (error) {
    logger.error('Error getting file details:', error);
    res.status(500).json({ error: 'Failed to get file details' });
  }
});

// Delete file (admin only)
router.delete('/admin/files/:fileId', auth, isAdmin, async (req, res) => {
  try {
    await fileStorage.deleteFile(req.params.fileId);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;