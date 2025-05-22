import walletService from '../services/walletService.js';
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

export const createWallet = async (req, res) => {
    try {
        const { userId } = req.body; // Get userId from request body instead of req.user

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Check if user already has a wallet
        const existingWallet = await Wallet.findOne({ userId });
        if (existingWallet) {
            return res.status(400).json({ error: 'User already has a wallet' });
        }

        const wallet = await walletService.createWallet(userId);
        res.status(201).json(wallet);
    } catch (error) {
        console.error('Error in createWallet:', error);

        // Handle specific errors
        if (error.message === 'Database connection error. Please try again later.') {
            return res.status(503).json({ error: error.message });
        }
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to create wallet' });
    }
};

export const getWallet = async (req, res) => {
    try {
        const { userId } = req.user;
        const wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        // Get balances for all networks
        const balances = await Promise.all(
            wallet.networks.map(async (network) => {
                const balance = await walletService.getBalance(network.network, network.address);
                return {
                    network: network.network,
                    address: network.address,
                    balance,
                    isActive: network.isActive
                };
            })
        );

        res.json({
            address: wallet.address,
            networks: balances,
            isFrozen: wallet.isFrozen
        });
    } catch (error) {
        console.error('Error in getWallet:', error);
        res.status(500).json({ error: 'Failed to get wallet' });
    }
};

export const sendUSDT = async (req, res) => {
    try {
        const { userId } = req.user;
        const { network, toAddress, amount } = req.body;

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        if (wallet.isFrozen) {
            return res.status(403).json({ error: 'Wallet is frozen' });
        }

        const networkConfig = wallet.networks.find(n => n.network === network);
        if (!networkConfig || !networkConfig.isActive) {
            return res.status(400).json({ error: 'Invalid or inactive network' });
        }

        const txHash = await walletService.sendUSDT(
            network,
            networkConfig.address,
            toAddress,
            amount,
            wallet.privateKey
        );

        res.json({ txHash });
    } catch (error) {
        console.error('Error in sendUSDT:', error);
        res.status(500).json({ error: 'Failed to send USDT' });
    }
};

// Admin only endpoints
export const freezeWallet = async (req, res) => {
    try {
        const { userId } = req.params;
        await walletService.freezeWallet(userId);
        res.json({ message: 'Wallet frozen successfully' });
    } catch (error) {
        console.error('Error in freezeWallet:', error);
        res.status(500).json({ error: 'Failed to freeze wallet' });
    }
};

export const unfreezeWallet = async (req, res) => {
    try {
        const { userId } = req.params;
        await walletService.unfreezeWallet(userId);
        res.json({ message: 'Wallet unfrozen successfully' });
    } catch (error) {
        console.error('Error in unfreezeWallet:', error);
        res.status(500).json({ error: 'Failed to unfreeze wallet' });
    }
};

export const topUpWallet = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amount, cardDetails } = req.body;
        const userId = req.user._id;

        // Validate amount
        if (!amount || amount < 1 || amount > 1000) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Amount must be between 1 and 1000 TND' });
        }

        // Process card payment (in a real app, you would integrate with a payment processor)
        // For now, we'll simulate a successful payment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update user's wallet balance
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { walletBalance: amount } },
            { session, new: true }
        );

        // Create transaction record
        const transaction = await Transaction.create([{
            userId,
            type: 'transfer',
            subtype: 'deposit',
            amount,
            currency: 'TND',
            status: 'completed',
            description: 'Wallet top-up',
            reference: `TOP${Date.now()}${Math.random().toString(36).substring(2, 8)}`
        }], { session });

        await session.commitTransaction();

        // Emit WebSocket event for real-time balance update
        req.app.get('wsService').emitToUser(userId, 'balance:updated', {
            userId,
            walletBalance: updatedUser.walletBalance
        });

        res.json({
            success: true,
            newBalance: updatedUser.walletBalance,
            transaction: transaction[0]
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error('Top-up error:', error);
        res.status(500).json({ error: 'Failed to process top-up' });
    } finally {
        session.endSession();
    }
}; 