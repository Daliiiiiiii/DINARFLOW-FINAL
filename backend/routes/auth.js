import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { validatePhoneNumber, auth } from '../middleware/auth.js';
import process from 'process';
import { authLimiter } from '../middleware/rateLimiter.js';
import authController from '../controllers/authController.js';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/email.js';

const router = express.Router();

// Password complexity validation
const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/\d/)
  .withMessage('Password must contain at least one number')
  .matches(/[a-z]/)
  .withMessage('Password must contain at least one lowercase letter')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[!@#$%^&*]/)
  .withMessage('Password must contain at least one special character');

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  passwordValidation,
  body('firstName').trim().notEmpty().isLength({ min: 2, max: 25 }),
  body('lastName').trim().notEmpty().isLength({ min: 2, max: 25 }),
  body('displayName').trim().notEmpty(),
  body('phoneNumber').custom(value => {
    try {
      validatePhoneNumber(value);
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }),
], authController.register);

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], authController.login);

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ message: 'Logged out successfully' });
});

// Check account status
router.post('/check-status', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified
    });
  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// Validate token and get user info
router.get('/validate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('associatedBankAccount');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Allow suspended users to validate
    // if (user.accountStatus === 'suspended') {
    //   return res.status(403).json({ error: 'Account suspended' });
    // }

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        walletBalance: user.walletBalance,
        bankBalance: user.associatedBankAccount?.balance || 0,
        isVerified: user.kyc?.status === 'verified',
        kyc: user.kyc || { status: 'unverified' },
        emailVerified: user.emailVerified,
        profilePicture: user.profilePicture,
        role: user.role,
        associatedBankAccount: user.associatedBankAccount || null,
        accountStatus: user.accountStatus // Include accountStatus in response
      }
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Update password
router.put('/update-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[!@#$%^&*]/)
    .withMessage('Password must contain at least one special character')
], authController.updatePassword);

// Check if email is available
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ available: false, error: 'Email is required' });
    }
    const user = await User.findOne({ email });
    res.json({ available: !user });
  } catch (error) {
    res.status(500).json({ available: false, error: 'Server error' });
  }
});

// Verify email
router.post('/verify-email', authController.verifyEmail);

// Resend verification code
router.post('/resend-verification', authController.resendVerification);

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], authController.forgotPassword);

// Verify reset code
router.post('/verify-reset-code', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }).isNumeric()
], authController.verifyResetCode);

// Reset password
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }).isNumeric(),
  passwordValidation
], authController.resetPassword);

// Validate reset token
router.post('/validate-reset-token', authController.validateResetToken);

export default router;