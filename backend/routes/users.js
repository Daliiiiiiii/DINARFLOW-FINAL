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

// Get blocked users
router.get('/blocked', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('blockedUsers', 'username email p2pProfile')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform the data to include nickname from p2pProfile
    const blockedUsers = user.blockedUsers.map(blockedUser => ({
      ...blockedUser,
      nickname: blockedUser.p2pProfile?.nickname || null
    }));

    res.json(blockedUsers);
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ message: 'Error fetching blocked users' });
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

// Search users by any identifier (phone, email, or name)
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Clean and format the search query
    const cleanQuery = q.trim();

    // Build search conditions
    const searchConditions = [];

    // Email search
    if (cleanQuery.includes('@')) {
      searchConditions.push({ email: cleanQuery.toLowerCase() });
    }

    // Phone number search
    const cleanNumber = cleanQuery.replace(/\D/g, '');
    if (cleanNumber.length >= 8) {
      const possibleFormats = [
        cleanNumber,                    // Raw number
        `216${cleanNumber}`,           // With 216 prefix
        `+216${cleanNumber}`,          // With +216 prefix
        cleanNumber.slice(-8)          // Last 8 digits
      ];
      searchConditions.push({ phoneNumber: { $in: possibleFormats } });
    }

    // Name search (if query is not an email or phone)
    if (!cleanQuery.includes('@') && !/^\d+$/.test(cleanQuery)) {
      searchConditions.push({ displayName: { $regex: cleanQuery, $options: 'i' } });
    }

    // If no valid search conditions, return empty result
    if (searchConditions.length === 0) {
      return res.json([]);
    }

    // Search for users
    const users = await User.find({
      $or: searchConditions,
      accountStatus: 'active'
    })
      .select('displayName profilePicture email phoneNumber')
      .limit(5);

    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;