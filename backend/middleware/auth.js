import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.accountStatus === 'pending_deletion') {
      return res.status(401).json({ error: 'Account pending deletion' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const validatePhoneNumber = (phone) => {
  const cleanPhone = phone.replace(/[\s-]/g, '');
  if (!cleanPhone.startsWith('+216')) {
    throw new Error('Phone number must start with +216');
  }
  const remainingDigits = cleanPhone.slice(4);
  if (!/^\d{8}$/.test(remainingDigits)) {
    throw new Error('Phone number must have exactly 8 digits after +216');
  }
  return cleanPhone;
};

export const checkAccountStatus = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('accountStatus deletionRequestedAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      accountStatus: user.accountStatus,
      deletionRequestedAt: user.deletionRequestedAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Error checking account status' });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

export { auth as authenticateToken };