import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    // Check for token in Authorization header
    let token = req.header('Authorization')?.replace('Bearer ', '');

    // If no token in header, check cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.userId) {
        console.log('Invalid token payload - no userId');
        return res.status(401).json({ error: 'Invalid token' });
      }

      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        console.log('User not found for token:', decoded.userId);
        return res.status(401).json({ error: 'User not found' });
      }

      // Check if user account is active
      if (user.accountStatus !== 'active') {
        console.log('User account not active:', user.accountStatus);
        return res.status(403).json({
          error: 'Account not active',
          details: `Account is ${user.accountStatus}`
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const validatePhoneNumber = (phone) => {
  const cleanPhone = phone.replace(/[\s-]/g, '');

  // Handle different formats
  if (cleanPhone.startsWith('+216')) {
    const remainingDigits = cleanPhone.slice(4);
    if (!/^\d{8}$/.test(remainingDigits)) {
      throw new Error('Phone number must have exactly 8 digits after +216');
    }
    return cleanPhone;
  } else if (cleanPhone.startsWith('216')) {
    const remainingDigits = cleanPhone.slice(3);
    if (!/^\d{8}$/.test(remainingDigits)) {
      throw new Error('Phone number must have exactly 8 digits after 216');
    }
    return `+${cleanPhone}`;
  } else if (/^\d{8}$/.test(cleanPhone)) {
    return `+216${cleanPhone}`;
  }

  throw new Error('Invalid phone number format. Must be either +216XXXXXXXX, 216XXXXXXXX, or XXXXXXXX');
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

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin status' });
  }
};

export const isSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Superadmin access required' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking superadmin status' });
  }
};

export { auth as authenticateToken };