import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { checkTransactionLimits } from '../middleware/transactionLimits.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { NotificationService } from '../services/notificationService.js';
import BankAccount from '../models/BankAccount.js';
import Wallet from '../models/Wallet.js';

const router = express.Router();
const notificationService = new NotificationService();

// Get user's transactions
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.query; // Get the optional type query parameter

    // Fetch the user's wallet to get their address
    const userWallet = await Wallet.findOne({ userId });
    if (!userWallet) {
      // If no wallet is found, return an empty array of transactions
      return res.json({ transactions: [] });
    }
    const userAddress = userWallet.address; // Assuming EVM address is the main address for filtering received

    let filter = {
      $or: [
        { userId: userId }, // Transactions where the user is the sender
        { 'metadata.toAddress': userAddress } // Transactions where the user's EVM address is the recipient
        // Note: This assumes the main wallet address is used for receiving on EVM chains.
        // For other networks, a more complex filter might be needed based on network-specific addresses.
        // For now, focusing on the main EVM address as a starting point.
      ]
    };

    // If a type is specified, add it to the filter
    // Note: This type filter will apply to both sent and received transactions.
    // If you only want to filter sent/received, you might need a different approach.
    if (type) {
      filter.$and = [{ type: type }];
    }

    // Add a small delay to allow for potential database replication/indexing lag
    await new Promise(resolve => setTimeout(resolve, 50));

    // Explicitly disable caching for this query and sort by creation date descending
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .lean(); // Return plain JavaScript objects

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer TND
router.post('/transfer', [
  auth,
  body('recipient').custom(async (value, { req }) => {
    console.log('Validating recipient:', value);
    if (!value) {
      throw new Error('Recipient is required');
    }

    // Clean and format the recipient value
    const cleanValue = value.toString().trim();

    // Find recipient with more flexible matching
    const recipientUser = await User.findOne({
      $or: [
        { email: cleanValue.toLowerCase() },
        { phoneNumber: { $regex: `^\\+?216?${cleanValue.replace(/\D/g, '')}$` } },
        { displayName: { $regex: `^${cleanValue}$`, $options: 'i' } }
      ],
      accountStatus: 'active'
    }).select('_id email displayName phoneNumber walletBalance accountStatus');

    if (!recipientUser) {
      console.log('Recipient not found:', {
        searchValue: cleanValue,
        searchType: cleanValue.includes('@') ? 'email' :
          /^\d+$/.test(cleanValue) ? 'phone' : 'name'
      });
      throw new Error('Recipient not found or account is not active');
    }

    console.log('Found recipient:', {
      id: recipientUser._id,
      name: recipientUser.displayName,
      email: recipientUser.email,
      phone: recipientUser.phoneNumber,
      status: recipientUser.accountStatus
    });

    // Store the found user in the request for later use
    req.recipientUser = recipientUser;
    return true;
  }),
  body('amount').custom((value) => {
    console.log('Validating amount:', value);
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error('Amount must be a valid number');
    }
    if (num < 1) {
      throw new Error('Amount must be at least 1 TND');
    }
    return true;
  }),
  body('description').optional().trim(),
  body('sendFrom').optional().isIn(['wallet', 'bank'])
], checkTransactionLimits, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    console.log('Transfer request body:', req.body);
    const { amount, description, sendFrom = 'wallet' } = req.body;

    // Get sender with fresh data
    const sender = await User.findById(req.user._id).session(session);
    if (!sender) {
      throw new Error('Sender not found');
    }

    console.log('Sender:', {
      id: sender._id,
      balance: sender.walletBalance,
      amount: amount
    });

    // Use the recipient user from validation
    const recipientUser = req.recipientUser;
    console.log('Recipient search result:', recipientUser ? {
      id: recipientUser._id,
      name: recipientUser.displayName,
      email: recipientUser.email,
      status: recipientUser.accountStatus
    } : 'Not found');

    if (sender._id.equals(recipientUser._id)) {
      throw new Error('Cannot transfer to yourself');
    }

    // Check balance with fresh data
    if (sender.walletBalance < amount) {
      console.log('Insufficient balance:', {
        currentBalance: sender.walletBalance,
        transferAmount: amount
      });
      throw new Error('Insufficient balance');
    }

    if (sendFrom === 'bank') {
      // --- BANK TO BANK ---
      const senderBank = await BankAccount.findOne({ userId: sender._id }).session(session);
      if (!senderBank) throw new Error('Sender does not have a bank account');
      if (senderBank.balance < amount) throw new Error('Insufficient bank account balance');
      const recipientBank = await BankAccount.findOne({ userId: recipientUser._id }).session(session);
      if (!recipientBank) throw new Error('Recipient does not have a bank account');
      senderBank.balance -= amount;
      recipientBank.balance += amount;
      await senderBank.save({ session });
      await recipientBank.save({ session });
      const senderReference = `BANK${Date.now()}${uuidv4().substring(0, 8)}`;
      const recipientReference = `BANK${Date.now()}${uuidv4().substring(0, 8)}`;
      const senderTransaction = await Transaction.create([{
        userId: sender._id,
        type: 'transfer',
        subtype: 'send',
        amount: -Math.abs(amount),
        currency: 'TND',
        recipientId: recipientUser._id,
        recipientEmail: recipientUser.email,
        recipientPhone: recipientUser.phoneNumber,
        recipientName: recipientUser.displayName,
        description,
        reference: senderReference,
        metadata: { bankAccountId: senderBank._id }
      }], { session });
      const recipientTransaction = await Transaction.create([{
        userId: recipientUser._id,
        type: 'transfer',
        subtype: 'receive',
        amount: Math.abs(amount),
        currency: 'TND',
        senderId: sender._id,
        senderEmail: sender.email,
        senderPhone: sender.phoneNumber,
        senderName: sender.displayName,
        description,
        reference: recipientReference,
        metadata: { bankAccountId: recipientBank._id }
      }], { session });
      await session.commitTransaction();
      res.json({
        transaction: senderTransaction[0],
        recipient: {
          id: recipientUser._id,
          name: recipientUser.displayName,
          email: recipientUser.email,
          bankBalance: recipientBank.balance
        },
        newBankBalance: senderBank.balance
      });
      return;
    }

    // Generate unique references for each transaction
    const senderReference = `TND${Date.now()}${uuidv4().substring(0, 8)}`;
    const recipientReference = `TND${Date.now()}${uuidv4().substring(0, 8)}`;

    // Update sender's balance
    const updatedSender = await User.findByIdAndUpdate(
      sender._id,
      { $inc: { walletBalance: -amount } },
      { session, new: true }
    );

    if (!updatedSender || updatedSender.walletBalance < 0) {
      throw new Error('Failed to update sender balance');
    }

    // Update recipient's balance
    const updatedRecipient = await User.findByIdAndUpdate(
      recipientUser._id,
      { $inc: { walletBalance: amount } },
      { session, new: true }
    );

    if (!updatedRecipient) {
      throw new Error('Failed to update recipient balance');
    }

    // Create transaction records
    const senderTransaction = await Transaction.create([{
      userId: sender._id,
      type: 'transfer',
      subtype: 'send',
      amount: -Math.abs(amount),
      currency: 'TND',
      recipientId: recipientUser._id,
      recipientEmail: recipientUser.email,
      recipientPhone: recipientUser.phoneNumber,
      recipientName: recipientUser.displayName,
      description,
      reference: senderReference
    }], { session });

    const recipientTransaction = await Transaction.create([{
      userId: recipientUser._id,
      type: 'transfer',
      subtype: 'receive',
      amount: Math.abs(amount),
      currency: 'TND',
      senderId: sender._id,
      senderEmail: sender.email,
      senderPhone: sender.phoneNumber,
      senderName: sender.displayName,
      description,
      reference: recipientReference
    }], { session });

    // Commit the transaction
    await session.commitTransaction();

    // Send response immediately after committing transaction
    res.json({
      transaction: senderTransaction[0],
      recipient: {
        id: recipientUser._id,
        name: recipientUser.displayName,
        email: recipientUser.email,
        walletBalance: updatedRecipient.walletBalance
      },
      newBalance: updatedSender.walletBalance
    });

    // Emit WebSocket events for real-time balance updates
    console.log('[DEBUG] Emitting balance update to sender:', {
      userId: sender._id,
      walletBalance: updatedSender.walletBalance
    });
    req.app.get('wsService').emitToUser(sender._id, 'balance:updated', {
      userId: sender._id,
      walletBalance: updatedSender.walletBalance
    });

    console.log('[DEBUG] Emitting balance update to recipient:', {
      userId: recipientUser._id,
      walletBalance: updatedRecipient.walletBalance
    });
    req.app.get('wsService').emitToUser(recipientUser._id, 'balance:updated', {
      userId: recipientUser._id,
      walletBalance: updatedRecipient.walletBalance
    });

    // Fire-and-forget notifications (do not await, log errors)
    notificationService.notifyTransaction({
      userId: sender._id,
      type: 'transfer',
      subtype: 'send',
      amount: -amount,
      currency: 'TND',
      recipientName: recipientUser.displayName,
      description,
      reference: senderReference
    }).catch(err => console.error('Notification error (sender):', err));

    notificationService.notifyTransaction({
      userId: recipientUser._id,
      type: 'transfer',
      subtype: 'receive',
      amount: amount,
      currency: 'TND',
      description,
      reference: recipientReference
    }).catch(err => console.error('Notification error (recipient):', err));

  } catch (error) {
    // Abort the transaction on any error
    await session.abortTransaction();
    console.error('Transfer error:', error);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// Bank transfer
router.post('/bank', [
  auth,
  body('amount').isFloat({ min: 1 }),
  body('type').isIn(['deposit', 'withdrawal']),
  body('description').optional().trim()
], checkTransactionLimits, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, type, description } = req.body;
    const user = await User.findById(req.user._id).populate('associatedBankAccount');

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify user has an associated bank account
    if (!user.associatedBankAccount) {
      await session.abortTransaction();
      return res.status(403).json({ error: 'No bank account associated with user' });
    }

    const bankAccount = user.associatedBankAccount;

    // For withdrawals, check if user has sufficient wallet balance
    if (type === 'withdrawal' && user.walletBalance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    // For deposits, check if bank account has sufficient balance
    if (type === 'deposit' && bankAccount.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Insufficient bank account balance' });
    }

    const reference = `BANK${Date.now()}${uuidv4().substring(0, 8)}`;

    // Update user's wallet balance
    const walletBalanceUpdate = type === 'deposit' ? amount : -amount;
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { walletBalance: walletBalanceUpdate } },
      { session, new: true }
    );

    // Update bank account balance
    const bankBalanceUpdate = type === 'deposit' ? -amount : amount;
    const updatedBankAccount = await BankAccount.findByIdAndUpdate(
      bankAccount._id,
      {
        $inc: { balance: bankBalanceUpdate },
        lastUsed: new Date()
      },
      { session, new: true }
    );

    // Create transaction record
    const transaction = await Transaction.create([{
      userId: user._id,
      type: 'bank',
      subtype: type,
      amount: walletBalanceUpdate,
      currency: 'TND',
      description,
      reference,
      status: 'completed',
      metadata: {
        bankAccountId: bankAccount._id,
        bankBalance: updatedBankAccount.balance
      }
    }], { session });

    await session.commitTransaction();

    // Send notification
    await notificationService.notifyTransaction({
      userId: user._id,
      type: 'bank',
      subtype: type,
      amount: walletBalanceUpdate,
      currency: 'TND',
      description,
      reference,
      transactionId: transaction[0]._id
    });

    // Emit WebSocket events for real-time balance updates
    req.app.get('wsService').emitToUser(user._id, 'balance:updated', {
      userId: user._id,
      walletBalance: updatedUser.walletBalance,
      bankBalance: updatedBankAccount.balance
    });

    res.json({
      transaction: transaction[0],
      newWalletBalance: updatedUser.walletBalance,
      newBankBalance: updatedBankAccount.balance
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error('Bank transfer error:', error);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// Get transaction limits usage
router.get('/limits-usage', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Helper to aggregate usage for a type
    const aggregateUsage = async (type) => {
      const [daily, weekly, monthly] = await Promise.all([
        Transaction.aggregate([
          { $match: { userId, type, createdAt: { $gte: startOfDay }, status: { $ne: 'failed' }, ignoredForLimits: { $ne: true } } },
          { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
        ]),
        Transaction.aggregate([
          { $match: { userId, type, createdAt: { $gte: startOfWeek }, status: { $ne: 'failed' }, ignoredForLimits: { $ne: true } } },
          { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
        ]),
        Transaction.aggregate([
          { $match: { userId, type, createdAt: { $gte: startOfMonth }, status: { $ne: 'failed' }, ignoredForLimits: { $ne: true } } },
          { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
        ])
      ]);
      return {
        daily: daily[0]?.total || 0,
        weekly: weekly[0]?.total || 0,
        monthly: monthly[0]?.total || 0
      };
    };

    const transferUsage = await aggregateUsage('transfer');
    const bankUsage = await aggregateUsage('bank');

    res.json({
      transfer: transferUsage,
      bank: bankUsage
    });
  } catch (error) {
    console.error('Error getting transaction limits usage:', error);
    res.status(500).json({ error: 'Failed to get transaction limits usage' });
  }
});

export default router;