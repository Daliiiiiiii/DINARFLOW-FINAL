import express from 'express';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import fileStorage from '../services/fileStorage.js';
import logger from '../services/logger.js';
import KycService from '../services/kycService.js';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const kycService = new KycService();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPG and PNG are allowed.'));
    }
    cb(null, true);
  }
});

// Rate limiting middleware
const kycLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'Too many KYC submissions from this IP, please try again after 24 hours'
});

const fileUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 file uploads per hour
  message: 'Too many file uploads from this IP, please try again later'
});

// Validation middleware
const validateKycSubmission = [
  body('idType')
    .isIn(['national_id', 'passport', 'driving_license'])
    .withMessage('Invalid ID type'),
  body('idNumber')
    .matches(/^\d{8}$/)
    .withMessage('ID number must be exactly 8 digits'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Invalid date of birth')
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      if (dob > minAge) {
        throw new Error('You must be at least 18 years old');
      }
      return true;
    }),
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('province')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Province must be between 2 and 50 characters'),
  body('zipCode')
    .matches(/^\d{4}$/)
    .withMessage('Zip code must be exactly 4 digits')
];

// User KYC routes
router.post('/submit', [
  auth,
  kycLimiter,
  fileUploadLimiter,
  upload.fields([
    { name: 'frontId', maxCount: 1 },
    { name: 'backId', maxCount: 1 },
    { name: 'selfieWithId', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]),
  validateKycSubmission
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }

    const userId = req.user._id;
    const formData = req.body;
    const files = req.files;

    logger.info('Processing KYC submission', { userId });

    const result = await kycService.submitKyc(userId, formData, files);
    res.json(result);
  } catch (error) {
    logger.error('Error submitting KYC:', { error, userId: req.user._id });
    res.status(500).json({
      error: 'Error submitting KYC',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ kyc: user.kyc });
  } catch (error) {
    logger.error('Error fetching KYC status:', { error, userId: req.user._id });
    res.status(500).json({ error: 'Error fetching KYC status' });
  }
});

export default router;