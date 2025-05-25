import express from 'express';
import {
    createWallet,
    getWallet,
    sendUSDT,
    freezeWallet,
    unfreezeWallet,
    topUpWallet,
    mintInitialUSDT,
    bridgeUSDT,
    mintTestUSDT
} from '../controllers/walletController.js';
import { auth as authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.post('/create', authenticate, isAdmin, createWallet);

// User routes
router.get('/', authenticate, getWallet);
router.post('/send', authenticate, sendUSDT);
router.post('/mint-initial', authenticate, mintInitialUSDT);
router.post('/mint-test/:userId', mintTestUSDT);

// Admin only endpoints
router.post('/freeze/:userId', authenticate, isAdmin, freezeWallet);
router.post('/unfreeze/:userId', authenticate, isAdmin, unfreezeWallet);
router.post('/topup', authenticate, topUpWallet);

// New route for USDT bridging
router.post('/bridge', authenticate, bridgeUSDT);

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('Wallet route error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        details: err.details || {}
    });
});

export default router; 