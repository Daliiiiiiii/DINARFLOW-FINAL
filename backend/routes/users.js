import express from 'express';
import { body } from 'express-validator';
import { auth, validatePhoneNumber } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import User from '../models/User.js';
import path from 'path';
import fs from 'fs/promises';
import process from 'process';

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', [
  auth,
  body('phoneNumber').custom(async (value, { req }) => {
    if (!value) return true;

    try {
      validatePhoneNumber(value);

      // Check if phone number is already in use by another user
      const existingUser = await User.findOne({
        phoneNumber: value,
        _id: { $ne: req.user._id }
      });

      if (existingUser) {
        throw new Error('You can not use this phone number');
      }

      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  })
], async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { phoneNumber } },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ user });
  } catch (error) {
    // Check for duplicate key error
    if (error.code === 11000 && error.keyPattern?.phoneNumber) {
      return res.status(400).json({ error: 'You can not use this phone number' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Accept privacy policy
router.post('/privacy-policy', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        privacyAccepted: true,
        privacyAcceptedAt: new Date()
      },
      { new: true }
    ).select('-password');

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload profile picture
router.post('/profile-picture', auth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old profile picture if it exists
    const user = await User.findById(req.user._id);
    if (user.profilePicture) {
      const oldPicturePath = path.join(process.cwd(), 'uploads', path.basename(user.profilePicture));
      try {
        await fs.unlink(oldPicturePath);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
      }
    }

    // Store relative path
    const profilePicturePath = `/uploads/${req.file.filename}`;

    // Update user with new profile picture
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: profilePicturePath },
      { new: true }
    ).select('-password');

    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete profile picture
router.delete('/profile-picture', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.profilePicture) {
      return res.status(404).json({ error: 'No profile picture found' });
    }

    // Delete the file
    const picturePath = path.join(process.cwd(), 'uploads', path.basename(user.profilePicture));
    try {
      await fs.unlink(picturePath);
    } catch (error) {
      console.error('Error deleting profile picture:', error);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { profilePicture: "" } },
      { new: true }
    ).select('-password');

    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;