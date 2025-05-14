import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { NotificationService } from '../services/notificationService.js';

const router = express.Router();
const notificationService = new NotificationService();

// Get user's transactions
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        { userId: req.user._id },
        { recipientId: req.user._id },
        { senderId: req.user._id }
      ]
    }).sort({ createdAt: -1 });

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
  body('description').optional().trim()
], async (req, res) => {
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
    const { amount, description } = req.body;

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
    req.app.get('wsService').emitToUser(sender._id, 'balance:updated', {
      userId: sender._id,
      walletBalance: updatedSender.walletBalance
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
  body('bankAccountId').isMongoId(),
  body('type').isIn(['deposit', 'withdrawal']),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const { amount, bankAccountId, type, description } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For withdrawals, check if user has sufficient balance
    if (type === 'withdrawal' && user.walletBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const reference = `BANK${Date.now()}${uuidv4().substring(0, 8)}`;

      // Update user's balance
      const balanceUpdate = type === 'deposit' ? amount : -amount;
      await User.findByIdAndUpdate(user._id, {
        $inc: { walletBalance: balanceUpdate }
      }, { session });

      // Create transaction record
      const transaction = await Transaction.create([{
        userId: user._id,
        type: 'bank',
        subtype: type,
        amount: balanceUpdate,
        currency: 'TND',
        description,
        reference,
        status: 'completed',
        metadata: {
          bankAccountId
        }
      }], { session });

      await session.commitTransaction();

      // Send notification
      await notificationService.notifyTransaction({
        userId: user._id,
        type: 'bank',
        subtype: type,
        amount: balanceUpdate,
        currency: 'TND',
        description,
        reference
      });

      res.json({ transaction: transaction[0] });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;