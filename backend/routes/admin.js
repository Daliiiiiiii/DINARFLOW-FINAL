import express from 'express';
import { auth } from '../middleware/auth.js';
import { body } from 'express-validator';
import { NotificationService } from '../services/notificationService.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { generateTestRIB } from '../utils/bankUtils.js';
import BankAccount from '../models/BankAccount.js';
import KycService from '../services/kycService.js';

const router = express.Router();
const notificationService = new NotificationService();
const kycService = new KycService();

// Admin middleware
const adminAuth = async (req, res, next) => {
    try {
        if (!req.user) {
            console.log('No user found in request');
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!['admin', 'superadmin'].includes(req.user.role)) {
            console.log('User role not authorized:', req.user.role);
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if user account is active
        if (req.user.accountStatus !== 'active') {
            console.log('Admin account not active:', req.user.accountStatus);
            return res.status(403).json({
                error: 'Account not active',
                details: `Account is ${req.user.accountStatus}`
            });
        }

        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get admin dashboard statistics
router.get('/stats', [auth, adminAuth], async (req, res) => {
    try {
        // Get total users
        const totalUsers = await User.countDocuments();

        // Get pending KYC requests
        const pendingKyc = await User.countDocuments({ 'kyc.status': 'pending' });

        // Get active wallets (users with balance > 0)
        const activeWallets = await User.countDocuments({ balance: { $gt: 0 } });

        // Get transaction stats
        const transactions = {
            completed: 0,
            pending: 0,
            failed: 0
        };

        // Format the response
        const stats = {
            totalUsers,
            pendingKyc,
            activeWallets,
            volume24h: 0,
            transactions
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Error fetching admin statistics' });
    }
});

// Get KYC requests for admin dashboard
router.get('/kyc-requests', [auth, adminAuth], async (req, res) => {
    try {
        const { status, search, dateRange, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (status && status !== 'all') {
            query['kyc.status'] = status;
        }
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { 'kyc.personalInfo.idNumber': { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // Add date range filter
        if (dateRange) {
            const now = new Date();
            let startDate;

            switch (dateRange) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setDate(now.getDate() - 30));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                case 'all':
                    // Don't add any date filter
                    break;
                default:
                    // Don't add any date filter
                    break;
            }

            if (startDate) {
                query['kyc.submissions.submittedAt'] = { $gte: startDate };
            }
        }

        // Get total count for pagination
        const total = await User.countDocuments(query);

        // Get KYC requests
        const requests = await User.find(query)
            .select('email kyc profilePicture firstName lastName phoneNumber createdAt')
            .sort({ 'kyc.submissions.submittedAt': -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total counts for each status
        const [pendingCount, verifiedCount, rejectedCount] = await Promise.all([
            User.countDocuments({ 'kyc.status': 'pending' }),
            User.countDocuments({ 'kyc.status': 'verified' }),
            User.countDocuments({ 'kyc.status': 'rejected' })
        ]);

        // Format response
        const formattedRequests = requests.map(user => {
            let current = null;
            let attempt = 1;
            let allAttempts = [];
            const baseUrl = process.env.API_URL || 'http://localhost:3000';

            if (user.kyc && Array.isArray(user.kyc.submissions) && user.kyc.submissions.length > 0) {
                allAttempts = user.kyc.submissions.map(sub => ({
                    submittedAt: sub.submittedAt,
                    personalInfo: sub.personalInfo,
                    documents: sub.documents
                        ? Object.fromEntries(
                            Object.entries(sub.documents).map(([key, val]) =>
                                [key, val && !val.startsWith('http') ? `${baseUrl}/uploads/${val}` : val]
                            )
                        )
                        : {},
                }));

                // Get the most recent submission
                current = user.kyc.submissions[user.kyc.currentSubmission] || user.kyc.submissions[user.kyc.submissions.length - 1];
                attempt = user.kyc.currentSubmission + 1;
            }

            return {
                id: user._id,
                user: `${user.firstName} ${user.lastName}`,
                email: user.email,
                phone: user.phoneNumber,
                profilePicture: user.profilePicture,
                submittedAt: current?.submittedAt,
                status: user.kyc?.status || 'unverified', // Use root level status
                idType: current?.personalInfo?.idType,
                idNumber: current?.personalInfo?.idNumber,
                documents: current?.documents
                    ? Object.fromEntries(
                        Object.entries(current.documents).map(([key, val]) =>
                            [key, val && !val.startsWith('http') ? `${baseUrl}/uploads/${val}` : val]
                        )
                    )
                    : {},
                attempt,
                allAttempts
            };
        });

        res.json({
            requests: formattedRequests,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            statusCounts: {
                pending: pendingCount,
                verified: verifiedCount,
                rejected: rejectedCount,
                total: total
            }
        });
    } catch (error) {
        console.error('Error fetching KYC requests:', error);
        res.status(500).json({ error: 'Error fetching KYC requests' });
    }
});

// Approve KYC request
router.post('/kyc/:userId/approve', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.kyc || !user.kyc.submissions || user.kyc.submissions.length === 0) {
            return res.status(400).json({ error: 'No KYC submissions found' });
        }

        const currentSubmission = user.kyc.submissions[user.kyc.currentSubmission] || user.kyc.submissions[user.kyc.submissions.length - 1];
        if (!currentSubmission) {
            return res.status(400).json({ error: 'Invalid KYC submission' });
        }

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update KYC status at root level only
            user.kyc.status = 'verified';
            currentSubmission.verifiedAt = new Date();
            currentSubmission.reviewedBy = req.user._id;

            // Add to audit trail
            currentSubmission.auditTrail.push({
                action: 'verified',
                details: {
                    reviewedBy: req.user._id,
                    timestamp: new Date()
                },
                timestamp: new Date()
            });

            // Generate a test RIB for the user
            const rib = generateTestRIB(user._id);

            // Create a new bank account for the user
            const bankAccount = await BankAccount.create([{
                userId: user._id,
                name: `${currentSubmission.personalInfo.firstName} ${currentSubmission.personalInfo.lastName}`,
                accountNumber: rib,
                bankName: 'Test Bank'
            }], { session });

            // Associate the bank account with the user
            user.associatedBankAccount = bankAccount[0]._id;

            await user.save({ session });

            await session.commitTransaction();

            res.json({
                message: 'KYC request verified successfully',
                reviewedBy: req.user._id,
                bankAccount: bankAccount[0]
            });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error('Error verifying KYC request:', error);
        res.status(500).json({ error: 'Error verifying KYC request' });
    }
});

// Reject KYC request
router.post('/kyc/:userId/reject', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.kyc || !user.kyc.submissions || user.kyc.submissions.length === 0) {
            return res.status(400).json({ error: 'No KYC submissions found' });
        }

        const currentSubmission = user.kyc.submissions[user.kyc.currentSubmission] || user.kyc.submissions[user.kyc.submissions.length - 1];
        if (!currentSubmission) {
            return res.status(400).json({ error: 'Invalid KYC submission' });
        }

        // Update KYC status at root level only
        user.kyc.status = 'rejected';
        currentSubmission.verifiedAt = new Date();
        currentSubmission.reviewedBy = req.user._id;
        currentSubmission.verificationNotes = req.body.notes || 'KYC verification rejected';

        // Add to audit trail
        currentSubmission.auditTrail.push({
            action: 'rejected',
            details: {
                reviewedBy: req.user._id,
                notes: req.body.notes,
                timestamp: new Date()
            },
            timestamp: new Date()
        });

        await user.save();

        await kycService.verifyKyc(user._id, 'rejected', req.body.notes);

        res.json({
            message: 'KYC request rejected successfully',
            reviewedBy: req.user._id
        });
    } catch (error) {
        console.error('Error rejecting KYC request:', error);
        res.status(500).json({ error: 'Error rejecting KYC request' });
    }
});

// Get users for admin dashboard
router.get('/users', [auth, adminAuth], async (req, res) => {
    try {
        const { accountStatus, search, kycStatus, dateRange, sortBy, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};

        // Account Status filter
        if (accountStatus && accountStatus !== 'all') {
            query.accountStatus = accountStatus;
        }

        // KYC Status filter
        if (kycStatus && kycStatus !== 'all') {
            query['kyc.status'] = kycStatus;
        }

        // Date range filter
        if (dateRange && dateRange !== 'all') {
            const now = new Date();
            let startDate;

            switch (dateRange) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setDate(now.getDate() - 30));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
            }

            if (startDate) {
                query.createdAt = { $gte: startDate };
            }
        }

        // Search filter
        if (search) {
            query.$or = [
                { displayName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { 'kyc.personalInfo.idNumber': { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await User.countDocuments(query);

        // Build sort options
        let sortOptions = {};
        switch (sortBy) {
            case 'oldest':
                sortOptions = { createdAt: 1 };
                break;
            case 'newest':
                sortOptions = { createdAt: -1 };
                break;
            case 'name':
                sortOptions = { displayName: 1 };
                break;
            case 'name-desc':
                sortOptions = { displayName: -1 };
                break;
            default: // newest
                sortOptions = { createdAt: -1 };
        }

        // Get users
        const users = await User.find(query)
            .select('displayName email phoneNumber createdAt accountStatus kyc profilePicture')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Format response
        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.displayName || 'Unnamed User',
            email: user.email,
            phone: user.phoneNumber || 'Not provided',
            accountStatus: user.accountStatus || 'active',
            kycStatus: user.kyc?.status || 'unverified',
            kyc: user.kyc,
            profilePicture: user.profilePicture || null
        }));

        res.json({
            users: formattedUsers,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// Get all users with their online status
router.get('/users/status', [auth, adminAuth], async (req, res) => {
    try {
        const users = await User.find()
            .select('_id email displayName isOnline lastSeen role')
            .sort({ lastSeen: -1 });
        res.json(users);
    } catch (error) {
        console.error('Error fetching user status:', error);
        res.status(500).json({ error: 'Error fetching user status' });
    }
});

// Get single user details for profile
router.get('/users/:userId', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('displayName email phoneNumber createdAt accountStatus kyc profilePicture');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Format response
        let kyc = user.kyc ? (user.kyc.toObject ? user.kyc.toObject() : { ...user.kyc }) : {};
        if (user.kyc && user.kyc.currentSubmission >= 0 && user.kyc.submissions && user.kyc.submissions.length > 0) {
            const current = user.kyc.submissions[user.kyc.currentSubmission];
            kyc.personalInfo = current.personalInfo;
            kyc.documents = current.documents;
        }

        const formattedUser = {
            id: user._id,
            name: user.displayName || 'Unnamed User',
            email: user.email,
            phone: user.phoneNumber || 'Not provided',
            accountStatus: user.accountStatus || 'active',
            kycStatus: user.kyc?.status || 'unverified',
            joinedAt: user.createdAt,
            lastLogin: user.lastLoginAt || user.createdAt,
            kyc,
            profilePicture: user.profilePicture || null
        };

        res.json(formattedUser);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Error fetching user details' });
    }
});

// Create new user
router.post('/users', [auth, adminAuth], async (req, res) => {
    try {
        const { email, password, firstName, lastName, phoneNumber, role = 'user' } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email },
                { phoneNumber }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                error: existingUser.email === email ? 'Email already exists' : 'Phone number already exists'
            });
        }

        // Create new user
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
            phoneNumber,
            role,
            accountStatus: 'active'
        });

        await user.save();

        // Format response
        const formattedUser = {
            id: user._id,
            name: user.displayName,
            email: user.email,
            phone: user.phoneNumber,
            accountStatus: user.accountStatus,
            kycStatus: 'unverified',
            profilePicture: null
        };

        res.status(201).json(formattedUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
});

// Suspend user account
router.post('/users/:userId/suspend', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update account status to suspended
        user.accountStatus = 'suspended';
        await user.save();

        res.json({
            message: 'Account suspended successfully',
            status: 'suspended'
        });
    } catch (error) {
        console.error('Error suspending account:', error);
        res.status(500).json({ error: 'Error suspending account' });
    }
});

// Unsuspend user account
router.post('/users/:userId/unsuspend', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update account status to active
        user.accountStatus = 'active';
        await user.save();

        res.json({
            message: 'Account unsuspended successfully',
            status: 'active'
        });
    } catch (error) {
        console.error('Error unsuspending account:', error);
        res.status(500).json({ error: 'Error unsuspending account' });
    }
});

// Send system update notification
router.post('/notifications/system-update', [
    auth,
    adminAuth,
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('type').isIn(['feature', 'maintenance', 'update']).withMessage('Invalid notification type'),
    body('featureName').optional().isString(),
    body('featureDetails').optional().isString(),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('duration').optional().isString()
], async (req, res) => {
    try {
        const {
            title,
            message,
            type,
            featureName,
            featureDetails,
            date,
            duration
        } = req.body;

        // Get all users
        const users = await User.find({ notificationsEnabled: true });

        // Send notification to each user
        const notificationPromises = users.map(user =>
            notificationService.notifySystemUpdate({
                userId: user._id,
                type,
                title,
                message,
                featureName,
                featureDetails,
                date,
                duration
            })
        );

        await Promise.all(notificationPromises);

        res.json({
            message: 'System update notification sent successfully',
            recipients: users.length
        });
    } catch (error) {
        console.error('Send system update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Send security alert to all users
router.post('/notifications/security-alert', [
    auth,
    adminAuth,
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('type').isIn(['security', 'warning', 'alert']).withMessage('Invalid notification type'),
    body('severity').isIn(['low', 'medium', 'high']).withMessage('Invalid severity level')
], async (req, res) => {
    try {
        const { title, message, type, severity } = req.body;

        // Get all users
        const users = await User.find({ notificationsEnabled: true });

        // Send notification to each user
        const notificationPromises = users.map(user =>
            notificationService.notifySecurityAlert({
                userId: user._id,
                type,
                title,
                message,
                severity,
                metadata: {
                    isSystemAlert: true
                }
            })
        );

        await Promise.all(notificationPromises);

        res.json({
            message: 'Security alert sent successfully',
            recipients: users.length
        });
    } catch (error) {
        console.error('Send security alert error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Generate RIB for verified users without bank accounts
router.post('/users/:userId/generate-rib', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('Current user state:', {
            userId: user._id,
            hasAssociatedBankAccount: !!user.associatedBankAccount,
            associatedBankAccountId: user.associatedBankAccount
        });

        // Check if user has an associated bank account AND verify it exists
        if (user.associatedBankAccount) {
            const existingBankAccount = await BankAccount.findById(user.associatedBankAccount);
            if (existingBankAccount) {
                return res.status(400).json({ error: 'User already has a bank account' });
            }
            // If bank account doesn't exist, clear the stale reference
            user.associatedBankAccount = null;
            user.bankAccount = null;
            await user.save();
        }

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Get user's name from KYC submission or use display name
            const currentSubmission = user.kyc?.submissions?.[user.kyc?.currentSubmission];
            const userName = currentSubmission?.personalInfo
                ? `${currentSubmission.personalInfo.firstName} ${currentSubmission.personalInfo.lastName}`
                : user.displayName;

            // Generate a test RIB for the user
            const rib = generateTestRIB(user._id);

            // Create a new bank account for the user
            const bankAccount = await BankAccount.create([{
                userId: user._id,
                name: userName,
                accountNumber: rib,
                bankName: 'Test Bank'
            }], { session });

            console.log('Created bank account:', {
                bankAccountId: bankAccount[0]._id,
                userId: user._id
            });

            // Associate the bank account with the user (both fields)
            user.associatedBankAccount = bankAccount[0]._id;
            user.bankAccount = {
                bankName: bankAccount[0].bankName,
                accountNumber: bankAccount[0].accountNumber
            };
            await user.save({ session });

            console.log('Updated user with bank account:', {
                userId: user._id,
                associatedBankAccountId: user.associatedBankAccount,
                bankAccount: user.bankAccount
            });

            await session.commitTransaction();

            // Fetch the updated user to ensure we have the latest data
            const updatedUser = await User.findById(user._id).populate('associatedBankAccount');

            console.log('Final user state:', {
                userId: updatedUser._id,
                hasAssociatedBankAccount: !!updatedUser.associatedBankAccount,
                associatedBankAccountId: updatedUser.associatedBankAccount,
                bankAccount: updatedUser.bankAccount
            });

            res.json({
                message: 'RIB generated successfully',
                bankAccount: bankAccount[0],
                user: updatedUser
            });
        } catch (error) {
            console.error('Transaction error:', error);
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error('Error generating RIB:', error);
        res.status(500).json({ error: 'Error generating RIB' });
    }
});

// Batch generate RIBs for all verified users without bank accounts
router.post('/users/generate-ribs', [auth, adminAuth], async (req, res) => {
    try {
        // Find all verified users without bank accounts
        const users = await User.find({
            'kyc.status': 'verified',
            associatedBankAccount: null
        });

        if (users.length === 0) {
            return res.json({
                message: 'No verified users found without bank accounts',
                generated: 0
            });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Process users in batches to avoid overwhelming the database
        const batchSize = 10;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);

            await Promise.all(batch.map(async (user) => {
                const session = await mongoose.startSession();
                session.startTransaction();

                try {
                    // Get user's name from KYC submission
                    const currentSubmission = user.kyc.submissions[user.kyc.currentSubmission];
                    const userName = currentSubmission?.personalInfo
                        ? `${currentSubmission.personalInfo.firstName} ${currentSubmission.personalInfo.lastName}`
                        : user.displayName;

                    // Generate a test RIB for the user
                    const rib = generateTestRIB(user._id);

                    // Create a new bank account for the user
                    const bankAccount = await BankAccount.create([{
                        userId: user._id,
                        name: userName,
                        accountNumber: rib,
                        bankName: 'Test Bank'
                    }], { session });

                    // Associate the bank account with the user
                    user.associatedBankAccount = bankAccount[0]._id;
                    await user.save({ session });

                    await session.commitTransaction();
                    results.success++;
                } catch (error) {
                    await session.abortTransaction();
                    results.failed++;
                    results.errors.push({
                        userId: user._id,
                        error: error.message
                    });
                } finally {
                    session.endSession();
                }
            }));
        }

        res.json({
            message: 'RIB generation completed',
            total: users.length,
            success: results.success,
            failed: results.failed,
            errors: results.errors
        });
    } catch (error) {
        console.error('Error batch generating RIBs:', error);
        res.status(500).json({ error: 'Error batch generating RIBs' });
    }
});

export default router; 