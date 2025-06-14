import walletService from '../services/walletService.js';
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import notificationService from '../services/notificationService.js';

export const createWallet = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Check if user already has a wallet
        const existingWallet = await Wallet.findOne({ userId });
        if (existingWallet) {
            return res.status(400).json({ error: 'User already has a wallet' });
        }

        const wallet = await walletService.createWallet(userId);
        // Send real-time notification
        await notificationService.createNotification(
            userId,
            'system',
            'Wallet Created',
            'Your wallet has been created successfully.'
        );
        res.status(201).json(wallet);
    } catch (error) {
        console.error('Error in createWallet:', error);

        if (error.message === 'Database connection error. Please try again later.') {
            return res.status(503).json({ error: error.message });
        }
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Failed to connect to Hardhat')) {
            return res.status(503).json({ error: 'Hardhat connection failed. Please ensure Hardhat node is running.' });
        }

        res.status(500).json({ error: 'Failed to create wallet' });
    }
};

export const getWallet = async (req, res) => {
    try {
        const { userId, network } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        console.log('[DEBUG] Fetching wallet for user:', userId);
        console.time('findWallet');
        const wallet = await Wallet.findOne({ userId });
        console.timeEnd('findWallet');

        if (!wallet) {
            console.log('[DEBUG] Wallet not found for user:', userId);
            return res.status(404).json({ error: 'Wallet not found' });
        }

        console.log('[DEBUG] Found wallet:', wallet.address);
        let networks = wallet.networks;

        // Always fetch fresh balances
        if (network) {
            // Only fetch the selected network
            const selected = wallet.networks.find(n => n.network === network);
            if (!selected) {
                console.log('[DEBUG] Network not found:', network);
                return res.status(404).json({ error: 'Network not found in wallet' });
            }
            try {
                console.log('[DEBUG] Fetching balance for network:', network);
                const balance = await walletService.getBalance(selected.network, selected.address);
                console.log('[DEBUG] Balance fetched:', balance);
                networks = [{
                    ...selected.toObject(),
                    balance: parseFloat(balance).toFixed(6)
                }];
            } catch (error) {
                console.error('[DEBUG] Error fetching balance for network:', network, error);
                networks = [{
                    ...selected.toObject(),
                    balance: '0',
                    error: 'Failed to fetch balance'
                }];
            }
        } else {
            // Fetch all networks
            console.log('[DEBUG] Fetching balances for all networks');
            networks = await Promise.all(
                wallet.networks.map(async (network) => {
                    try {
                        const balance = await walletService.getBalance(network.network, network.address);
                        console.log('[DEBUG] Balance for', network.network, ':', balance);
                        return {
                            ...network.toObject(),
                            balance: parseFloat(balance).toFixed(6)
                        };
                    } catch (error) {
                        console.error('[DEBUG] Error fetching balance for network:', network.network, error);
                        return {
                            ...network.toObject(),
                            balance: '0',
                            error: 'Failed to fetch balance'
                        };
                    }
                })
            );
        }

        const response = {
            address: wallet.address,
            networks,
            isFrozen: wallet.isFrozen,
            globalUsdtBalance: wallet.globalUsdtBalance
        };
        console.log('[DEBUG] Sending wallet response:', response);
        res.json(response);
    } catch (error) {
        console.error('[DEBUG] Error in getWallet:', error);
        if (error.message.includes('Web3 not initialized')) {
            return res.status(503).json({ error: 'Hardhat connection failed. Please ensure Hardhat node is running.' });
        }
        res.status(500).json({ error: 'Failed to get wallet' });
    }
};

export const sendUSDT = async (req, res) => {
    try {
        console.log('sendUSDT request received:', {
            user: req.user,
            body: req.body,
            headers: req.headers
        });

        const userId = req.user._id;
        const { network, toAddress, amount } = req.body;

        if (!network || !toAddress || !amount) {
            console.log('Missing required fields:', { network, toAddress, amount });
            return res.status(400).json({ error: 'Network, recipient address, and amount are required' });
        }

        console.log('Finding wallet for user:', userId);
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            console.log('Wallet not found for user:', userId);
            return res.status(404).json({ error: 'Wallet not found' });
        }

        if (wallet.isFrozen) {
            console.log('Wallet is frozen for user:', userId);
            return res.status(403).json({ error: 'Wallet is frozen' });
        }

        const networkConfig = wallet.networks.find(n => n.network === network);
        if (!networkConfig || !networkConfig.isActive) {
            console.log('Invalid or inactive network:', { network, networkConfig });
            return res.status(400).json({ error: 'Invalid or inactive network' });
        }

        // Validate amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            console.log('Invalid amount:', amount);
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Check if user has enough balance in their global USDT balance
        const globalBalance = parseFloat(wallet.globalUsdtBalance || '0');
        if (globalBalance < amountNum) {
            console.log('Insufficient global balance:', { globalBalance, amount: amountNum });
            return res.status(400).json({ error: 'Insufficient USDT balance' });
        }

        console.log('Sending USDT with params:', {
            userId,
            network,
            toAddress,
            amount: amountNum,
            walletAddress: wallet.address
        });

        const result = await walletService.sendUSDT(
            userId,
            network,
            toAddress,
            amountNum,
            wallet.address
        );

        console.log('USDT sent successfully:', result);

        // Fetch the updated wallet data
        const updatedWallet = await Wallet.findOne({ userId });
        console.log('Updated wallet data:', updatedWallet);

        res.json({
            success: true,
            transaction: result.transaction,
            message: 'USDT transfer successful',
            wallet: {
                address: updatedWallet.address,
                networks: updatedWallet.networks,
                globalUsdtBalance: updatedWallet.globalUsdtBalance,
                isFrozen: updatedWallet.isFrozen
            }
        });
    } catch (error) {
        console.error('Error in sendUSDT:', error);
        if (error.message.includes('insufficient funds')) {
            return res.status(400).json({ error: 'Insufficient funds for transfer' });
        }
        res.status(500).json({ error: error.message || 'Failed to send USDT' });
    }
};

// Admin only endpoints
export const freezeWallet = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        await walletService.freezeWallet(userId);
        // Send real-time notification
        await notificationService.createNotification(
            userId,
            'system',
            'Wallet Frozen',
            'Your wallet has been frozen by an administrator.'
        );
        res.json({ message: 'Wallet frozen successfully' });
    } catch (error) {
        console.error('Error in freezeWallet:', error);
        if (error.message === 'Wallet not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to freeze wallet' });
    }
};

export const unfreezeWallet = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        await walletService.unfreezeWallet(userId);
        // Send real-time notification
        await notificationService.createNotification(
            userId,
            'system',
            'Wallet Unfrozen',
            'Your wallet has been unfrozen by an administrator.'
        );
        res.json({ message: 'Wallet unfrozen successfully' });
    } catch (error) {
        console.error('Error in unfreezeWallet:', error);
        if (error.message === 'Wallet not found') {
            return res.status(404).json({ error: error.message });
        }
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
            reference: `TOP${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
            metadata: {
                cardDetails: {
                    number: cardDetails.number,
                    name: cardDetails.name,
                    expiry: cardDetails.expiry
                }
            }
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

export const mintInitialUSDT = async (req, res) => {
    try {
        const userId = req.user._id;
        const { network } = req.body;

        if (!network) {
            return res.status(400).json({ error: 'Network is required' });
        }

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const networkConfig = wallet.networks.find(n => n.network === network);
        if (!networkConfig) {
            return res.status(400).json({ error: 'Invalid network' });
        }

        await walletService.mintInitialUSDT(network, networkConfig.address);

        // Fetch updated wallet data
        const updatedWallet = await Wallet.findOne({ userId });

        res.json({
            message: 'Initial USDT minted successfully',
            globalBalance: updatedWallet.globalUsdtBalance,
            networkBalance: networkConfig.balance
        });
    } catch (error) {
        console.error('Error in mintInitialUSDT:', error);
        res.status(500).json({ error: error.message || 'Failed to mint initial USDT' });
    }
};

export const bridgeUSDT = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fromNetwork, toNetwork, amount } = req.body;

        if (!fromNetwork || !toNetwork || !amount) {
            return res.status(400).json({ error: 'Source network, target network, and amount are required' });
        }

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        if (wallet.isFrozen) {
            return res.status(403).json({ error: 'Wallet is frozen' });
        }

        // Validate networks
        const fromNetworkConfig = wallet.networks.find(n => n.network === fromNetwork);
        const toNetworkConfig = wallet.networks.find(n => n.network === toNetwork);

        if (!fromNetworkConfig || !toNetworkConfig) {
            return res.status(400).json({ error: 'Invalid network configuration' });
        }

        if (!fromNetworkConfig.isActive || !toNetworkConfig.isActive) {
            return res.status(400).json({ error: 'One or both networks are inactive' });
        }

        // Validate amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const result = await walletService.bridgeUSDT(fromNetwork, toNetwork, amount, userId);

        res.json({
            message: 'USDT bridge successful',
            ...result
        });
    } catch (error) {
        console.error('Error in bridgeUSDT:', error);
        if (error.message.includes('Insufficient')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to bridge USDT' });
    }
};

export const mintTestUSDT = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { network } = req.body;

        if (!network) {
            return res.status(400).json({ error: 'Network is required' });
        }

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const networkConfig = wallet.networks.find(n => n.network === network);
        if (!networkConfig) {
            return res.status(400).json({ error: 'Invalid network' });
        }

        const result = await walletService.mintTestUSDT(network, networkConfig.address);

        // Fetch updated wallet data
        const updatedWallet = await Wallet.findOne({ userId });

        res.json({
            message: 'Test USDT minted successfully',
            txHash: result.txHash,
            blockNumber: result.blockNumber,
            globalBalance: updatedWallet.globalUsdtBalance,
            networkBalance: networkConfig.balance
        });
    } catch (error) {
        console.error('Error in mintTestUSDT:', error);
        res.status(500).json({ error: error.message || 'Failed to mint test USDT' });
    }
}; 