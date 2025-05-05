import express from 'express';
import { auth, isAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { createKyc, getKyc, updateKycStatus, deleteKyc } from '../services/kycService.js';
import logger from '../services/logger.js';
import User from '../models/User.js';
import fileStorage from '../services/fileStorage.js';

const router = express.Router();

// Get KYC status for current user
router.get('/status', auth, async (req, res) => {
  try {
    const kyc = await getKyc(req.user.id);
    res.json(kyc);
  } catch (error) {
    logger.error('Error getting KYC status:', { error, userId: req.user.id });
    res.status(500).json({ message: 'Error getting KYC status' });
  }
});

// Submit KYC documents
router.post('/submit', auth, upload.array('documents', 5), async (req, res) => {
  try {
    const documents = req.files.map(file => ({
      type: file.fieldname,
      url: file.path,
      filename: file.filename
    }));

    const kyc = await createKyc({
      userId: req.user.id,
      documents,
      status: 'pending'
    });

    logger.info('KYC submission created', { kycId: kyc._id, userId: req.user.id });
    res.status(201).json(kyc);
  } catch (error) {
    logger.error('Error submitting KYC:', { error, userId: req.user.id });
    res.status(500).json({ message: 'Error submitting KYC documents' });
  }
});

// Admin routes
router.get('/admin/pending', auth, isAdmin, async (req, res) => {
  try {
    const pendingKyc = await getKyc({ status: 'pending' });
    res.json(pendingKyc);
  } catch (error) {
    logger.error('Error getting pending KYC:', { error, adminId: req.user.id });
    res.status(500).json({ message: 'Error getting pending KYC requests' });
  }
});

router.patch('/admin/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status, comment } = req.body;
    const kyc = await updateKycStatus(req.params.id, status, comment);

    logger.info('KYC status updated', {
      kycId: kyc._id,
      status,
      adminId: req.user.id
    });

    res.json(kyc);
  } catch (error) {
    logger.error('Error updating KYC status:', {
      error,
      kycId: req.params.id,
      adminId: req.user.id
    });
    res.status(500).json({ message: 'Error updating KYC status' });
  }
});

router.delete('/admin/:id', auth, isAdmin, async (req, res) => {
  try {
    await deleteKyc(req.params.id);
    logger.info('KYC deleted', { kycId: req.params.id, adminId: req.user.id });
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting KYC:', { error, kycId: req.params.id, adminId: req.user.id });
    res.status(500).json({ message: 'Error deleting KYC' });
  }
});

// Get pending KYC users
router.get('/admin/pending', auth, isAdmin, async (req, res, next) => {
  try {
    const users = await User.find({ kycStatus: 'in_progress' });
    res.json({ users });
  } catch (error) {
    logger.error('Error fetching pending KYC users', { error: error.message });
    next(error);
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

// Verify KYC documents
router.post('/verify', auth, upload.fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), async (req, res) => {
  try {
    const { idType, idNumber, dateOfBirth } = req.body;

    // Basic validation
    if (!idType || !idNumber || !dateOfBirth) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!req.files?.idFront?.[0] || !req.files?.idBack?.[0] || !req.files?.selfie?.[0]) {
      return res.status(400).json({ error: 'Missing required files' });
    }

    // Store files in GridFS
    const [idFrontFile, idBackFile, selfieFile] = await Promise.all([
      fileStorage.storeFile(req.files.idFront[0], { userId: req.user._id, type: 'id_front' }),
      fileStorage.storeFile(req.files.idBack[0], { userId: req.user._id, type: 'id_back' }),
      fileStorage.storeFile(req.files.selfie[0], { userId: req.user._id, type: 'selfie' })
    ]);

    // Create KYC document records
    const documents = [
      {
        type: 'id_front',
        url: idFrontFile.fileId,
        filename: req.files.idFront[0].originalname
      },
      {
        type: 'id_back',
        url: idBackFile.fileId,
        filename: req.files.idBack[0].originalname
      },
      {
        type: 'selfie',
        url: selfieFile.fileId,
        filename: req.files.selfie[0].originalname
      }
    ];

    // Create KYC record
    const kyc = await createKyc({
      userId: req.user._id,
      documents,
      status: 'pending'
    });

    // Update user's KYC data
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'kycStatus': 'in_progress',
          'kycData.idType': idType,
          'kycData.idNumber': idNumber,
          'kycData.dateOfBirth': new Date(dateOfBirth),
          'kycData.idFrontUrl': idFrontFile.fileId,
          'kycData.idBackUrl': idBackFile.fileId,
          'kycData.selfieUrl': selfieFile.fileId
        }
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info('KYC verification submitted', {
      userId: req.user._id,
      kycId: kyc._id
    });

    res.json({
      message: 'KYC verification submitted successfully',
      user,
      kycData: user.kycData
    });
  } catch (error) {
    logger.error('Error in KYC verification:', { error, userId: req.user._id });
    res.status(500).json({ error: 'Failed to process KYC verification' });
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