import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import BankAccount from '../models/BankAccount.js';

const router = express.Router();

// Get all bank accounts for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const accounts = await BankAccount.find({ userId: req.user._id })
            .sort({ isDefault: -1, lastUsed: -1 });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bank accounts' });
    }
});

// Add a new bank account
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, accountNumber, bankName, isDefault } = req.body;

        // If setting as default, unset other defaults
        if (isDefault) {
            await BankAccount.updateMany(
                { userId: req.user._id, isDefault: true },
                { isDefault: false }
            );
        }

        const account = new BankAccount({
            userId: req.user._id,
            name,
            accountNumber,
            bankName,
            isDefault
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
        const { name, accountNumber, bankName, isDefault } = req.body;
        const account = await BankAccount.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!account) {
            return res.status(404).json({ message: 'Bank account not found' });
        }

        // If setting as default, unset other defaults
        if (isDefault && !account.isDefault) {
            await BankAccount.updateMany(
                { userId: req.user._id, isDefault: true },
                { isDefault: false }
            );
        }

        account.name = name;
        account.accountNumber = accountNumber;
        account.bankName = bankName;
        account.isDefault = isDefault;
        account.lastUsed = new Date();

        await account.save();
        res.json(account);
    } catch (error) {
        res.status(400).json({ message: 'Error updating bank account' });
    }
});

// Delete a bank account
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const account = await BankAccount.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!account) {
            return res.status(404).json({ message: 'Bank account not found' });
        }

        res.json({ message: 'Bank account deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Error deleting bank account' });
    }
});

// Toggle default status
router.patch('/:id/toggle-default', authenticateToken, async (req, res) => {
    try {
        const account = await BankAccount.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!account) {
            return res.status(404).json({ message: 'Bank account not found' });
        }

        // If setting as default, unset other defaults
        if (!account.isDefault) {
            await BankAccount.updateMany(
                { userId: req.user._id, isDefault: true },
                { isDefault: false }
            );
        }

        account.isDefault = !account.isDefault;
        await account.save();

        res.json(account);
    } catch (error) {
        res.status(400).json({ message: 'Error toggling default status' });
    }
});

export default router; 