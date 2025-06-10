import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import BankAccount from '../models/BankAccount.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// Note: Bank accounts cannot be deleted as they are tied to KYC verification.
// Only admins can manage bank accounts through the admin interface.

// Get a single bank account by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching bank account:', {
            accountId: req.params.id,
            userId: req.user._id,
            userEmail: req.user.email
        });

        const account = await BankAccount.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!account) {
            console.log('Bank account not found:', {
                accountId: req.params.id,
                userId: req.user._id
            });
            return res.status(404).json({
                message: 'Bank account not found',
                details: {
                    accountId: req.params.id,
                    userId: req.user._id
                }
            });
        }

        console.log('Found bank account:', {
            accountId: account._id,
            userId: account.userId,
            accountNumber: account.accountNumber
        });
        res.json({ bankAccount: account });
    } catch (error) {
        console.error('Error fetching bank account:', {
            error: error.message,
            stack: error.stack,
            accountId: req.params.id,
            userId: req.user._id
        });
        res.status(500).json({
            message: 'Error fetching bank account',
            error: error.message
        });
    }
});

// Get all bank accounts for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const accounts = await BankAccount.find({ userId: req.user._id })
            .sort({ lastUsed: -1 });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bank accounts' });
    }
});

// Add a new bank account
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, accountNumber, bankName } = req.body;

        // Check if user already has a bank account
        const existingAccount = await BankAccount.findOne({ userId: req.user._id });
        if (existingAccount) {
            return res.status(400).json({ message: 'User already has a bank account' });
        }

        const account = new BankAccount({
            userId: req.user._id,
            name,
            accountNumber,
            bankName
        });

        await account.save();
        res.status(201).json(account);
    } catch (error) {
        res.status(400).json({ message: 'Error creating bank account' });
    }
});

// Update a bank account
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, accountNumber, bankName } = req.body;
        const account = await BankAccount.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!account) {
            return res.status(404).json({ message: 'Bank account not found' });
        }

        account.name = name;
        account.accountNumber = accountNumber;
        account.bankName = bankName;
        account.lastUsed = new Date();

        await account.save();
        res.json(account);
    } catch (error) {
        res.status(400).json({ message: 'Error updating bank account' });
    }
});

export default router; 