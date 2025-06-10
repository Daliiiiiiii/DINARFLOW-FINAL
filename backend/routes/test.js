import express from 'express';
import { auth } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';
import { UAParser } from 'ua-parser-js';
import { format } from 'date-fns';
import axios from 'axios';

const router = express.Router();
const notificationService = new NotificationService();

// Test welcome notification
router.post('/notifications/welcome', auth, async (req, res) => {
    try {
        const userData = {
            displayName: req.user.displayName || 'User',
            email: 'dalileroi123@gmail.com',
            setupUrl: 'https://dinarflow.com/setup',
            supportUrl: 'https://dinarflow.com/support',
            privacyUrl: 'https://dinarflow.com/privacy',
            termsUrl: 'https://dinarflow.com/terms',
            currentYear: new Date().getFullYear()
        };

        await notificationService.createNotification(
            req.user._id,
            'welcome',
            'Welcome to DinarFlow!',
            'Thank you for joining DinarFlow. We\'re excited to have you on board!',
            userData
        );

        res.json({ message: 'Welcome notification sent' });
    } catch (error) {
        console.error('Test welcome notification error:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

// Test transaction notification
router.post('/notifications/transaction', auth, async (req, res) => {
    try {
        const transactionData = {
            type: 'transfer',
            subtype: 'send',
            amount: 100,
            currency: 'TND',
            recipientName: 'Test User',
            description: 'Test transaction',
            reference: 'TEST123',
            date: new Date().toISOString()
        };

        await notificationService.notifyTransaction(req.user._id, transactionData);

        res.json({ message: 'Transaction notification sent' });
    } catch (error) {
        console.error('Test transaction notification error:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

// Test security alert
router.post('/notifications/security', auth, async (req, res) => {
    try {
        // Parse user-agent for readable device/browser
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const parser = new UAParser(userAgent);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const device = `${browser.name || 'Unknown Browser'} ${browser.version || ''} on ${os.name || 'Unknown OS'} ${os.version || ''}`.trim();

        // Get real client IP (handle proxies)
        let ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '127.0.0.1';
        if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
        if (ip === '::1') ip = '127.0.0.1';

        // Geolocate IP
        let location = 'Unknown';
        try {
            const geo = await axios.get(`http://ip-api.com/json/${ip}`);
            if (geo.data && geo.data.status === 'success') {
                location = `${geo.data.city || ''}, ${geo.data.country || ''}`.replace(/^, /, '');
            }
        } catch (e) { }

        // Format timestamp
        const timestamp = format(new Date(), 'PPpp'); // e.g., May 11, 2025, 5:01 PM

        const securityData = {
            type: 'login_attempt',
            device,
            location,
            ip,
            timestamp,
            secureAccountUrl: 'https://dinarflow.com/security',
            learnMoreUrl: 'https://dinarflow.com/security/learn-more',
            supportUrl: 'https://dinarflow.com/support',
            privacyUrl: 'https://dinarflow.com/privacy',
            termsUrl: 'https://dinarflow.com/terms',
            currentYear: new Date().getFullYear()
        };

        await notificationService.notifySecurityAlert(req.user._id, securityData.type, securityData);

        res.json({ message: 'Security alert sent' });
    } catch (error) {
        console.error('Test security alert error:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

// Test system update
router.post('/notifications/system', auth, async (req, res) => {
    try {
        const systemData = {
            type: 'feature',
            featureName: 'Test Feature',
            message: 'This is a test system update notification',
            date: new Date().toISOString()
        };

        await notificationService.notifySystemUpdate(req.user._id, systemData.type, systemData);

        res.json({ message: 'System update notification sent' });
    } catch (error) {
        console.error('Test system update error:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

// Test password reset
router.post('/notifications/password-reset', auth, async (req, res) => {
    try {
        const resetData = {
            resetToken: 'test-token-123',
            resetUrl: 'https://dinarflow.com/reset-password?token=test-token-123',
            expiryHours: 24
        };

        await notificationService.createNotification(
            req.user._id,
            'password_reset',
            'Password Reset Request',
            'You have requested to reset your password. Click the link below to proceed.',
            resetData
        );

        res.json({ message: 'Password reset notification sent' });
    } catch (error) {
        console.error('Test password reset notification error:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

// Test verification email
router.post('/notifications/verification', auth, async (req, res) => {
    try {
        const verificationData = {
            verificationToken: 'test-verification-token-123',
            verificationUrl: 'https://dinarflow.com/verify-email?token=test-verification-token-123',
            expiryHours: 24
        };

        await notificationService.createNotification(
            req.user._id,
            'verification',
            'Verify Your Email',
            'Please verify your email address to complete your registration.',
            verificationData
        );

        res.json({ message: 'Verification notification sent' });
    } catch (error) {
        console.error('Test verification notification error:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

export default router; 