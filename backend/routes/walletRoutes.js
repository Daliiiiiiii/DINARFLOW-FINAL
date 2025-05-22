import express from 'express';
import {
    createWallet,
    getWallet,
    sendUSDT,
    freezeWallet,
    unfreezeWallet,
    topUpWallet
} from '../controllers/walletController.js';
import { auth as authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.post('/create', authenticate, isAdmin, createWallet);
router.post('/freeze/:userId', authenticate, isAdmin, freezeWallet);
router.post('/unfreeze/:userId', authenticate, isAdmin, unfreezeWallet);

// User routes
router.get('/', authenticate, getWallet);
router.post('/send', authenticate, sendUSDT);
router.post('/top-up', authenticate, topUpWallet);

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('Wallet route error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        details: err.details || {}
    });
});

export default router; 