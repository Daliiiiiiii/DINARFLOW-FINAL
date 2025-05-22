import express from 'express';
import Settings from '../models/Settings.js';
import { auth, isSuperAdmin } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Get all limits (any authenticated user)
router.get('/transfer-limits', auth, async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) {
        // Create default settings if not exist
        settings = await Settings.create({});
    }
    // Always return non-zero defaults if not set
    const transferLimits = settings.transferLimits || {};
    const bankTransferLimits = settings.bankTransferLimits || {};
    res.json({
        transferLimits: {
            daily: transferLimits.daily ?? 10000,
            weekly: transferLimits.weekly ?? 50000,
            monthly: transferLimits.monthly ?? 100000,
            perTransaction: transferLimits.perTransaction ?? 5000
        },
        bankTransferLimits: {
            daily: bankTransferLimits.daily ?? 20000,
            weekly: bankTransferLimits.weekly ?? 100000,
            monthly: bankTransferLimits.monthly ?? 200000,
            perTransaction: bankTransferLimits.perTransaction ?? 10000
        }
    });
});

// Update all limits (superadmin only)
router.put('/transfer-limits', auth, isSuperAdmin, async (req, res) => {
    const {
        transferLimits,
        bankTransferLimits
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({});
    }

    if (transferLimits) {
        settings.transferLimits = {
            daily: transferLimits.daily ?? settings.transferLimits.daily,
            weekly: transferLimits.weekly ?? settings.transferLimits.weekly,
            monthly: transferLimits.monthly ?? settings.transferLimits.monthly,
            perTransaction: transferLimits.perTransaction ?? settings.transferLimits.perTransaction
        };
    }

    if (bankTransferLimits) {
        settings.bankTransferLimits = {
            daily: bankTransferLimits.daily ?? settings.bankTransferLimits.daily,
            weekly: bankTransferLimits.weekly ?? settings.bankTransferLimits.weekly,
            monthly: bankTransferLimits.monthly ?? settings.bankTransferLimits.monthly,
            perTransaction: bankTransferLimits.perTransaction ?? settings.bankTransferLimits.perTransaction
        };
    }

    await settings.save();
    res.json({
        transferLimits: settings.transferLimits,
        bankTransferLimits: settings.bankTransferLimits
    });
});

// Reset a user's transaction limits usage (admin only)
router.post('/reset-user-limits/:userId', auth, isSuperAdmin, async (req, res) => {
    const { userId } = req.params;
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Mark all transactions for this user in the current day/week/month as ignoredForLimits
        await Transaction.updateMany({
            userId,
            createdAt: { $gte: startOfDay }
        }, { $set: { ignoredForLimits: true } });
        await Transaction.updateMany({
            userId,
            createdAt: { $gte: startOfWeek }
        }, { $set: { ignoredForLimits: true } });
        await Transaction.updateMany({
            userId,
            createdAt: { $gte: startOfMonth }
        }, { $set: { ignoredForLimits: true } });

        res.json({ success: true, message: 'User transaction limits usage reset for current day, week, and month.' });
    } catch (error) {
        console.error('Error resetting user transaction limits:', error);
        res.status(500).json({ error: 'Failed to reset user transaction limits.' });
    }
});

export default router; 