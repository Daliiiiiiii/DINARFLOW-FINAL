import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

const router = express.Router();

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
  body('recipientEmail').isEmail(),
  body('amount').isFloat({ min: 0.01 }),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const { recipientEmail, amount, description } = req.body;
    const sender = await User.findById(req.user._id);
    const recipient = await User.findOne({ email: recipientEmail });

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (sender._id.equals(recipient._id)) {
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    if (sender.walletBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create transaction and update balances
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const reference = `TND${Date.now()}${uuidv4().substring(0, 8)}`;

      // Update sender's balance
      await User.findByIdAndUpdate(sender._id, {
        $inc: { walletBalance: -amount }
      }, { session });

      // Update recipient's balance
      await User.findByIdAndUpdate(recipient._id, {
        $inc: { walletBalance: amount }
      }, { session });

      // Create transaction records
      const senderTransaction = await Transaction.create([{
        userId: sender._id,
        type: 'transfer',
        subtype: 'send',
        amount: -amount,
        currency: 'TND',
        recipientId: recipient._id,
        recipientEmail,
        recipientName: recipient.displayName,
        description,
        reference
      }], { session });

      const recipientTransaction = await Transaction.create([{
        userId: recipient._id,
        type: 'transfer',
        subtype: 'receive',
        amount: amount,
        currency: 'TND',
        senderId: sender._id,
        senderEmail: sender.email,
        senderName: sender.displayName,
        description,
        reference
      }], { session });

      await session.commitTransaction();
      res.json({ transaction: senderTransaction[0] });
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

// Similar routes for crypto transactions...
// Add routes for /crypto/buy, /crypto/sell, and /crypto/transfer

export default router;