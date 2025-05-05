import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['transfer', 'crypto', 'crypto_transfer']
  },
  subtype: {
    type: String,
    required: true,
    enum: ['send', 'receive', 'buy', 'sell']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    enum: ['TND', 'CRYPTO']
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipientEmail: String,
  recipientName: String,
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderEmail: String,
  senderName: String,
  description: String,
  status: {
    type: String,
    default: 'completed',
    enum: ['pending', 'completed', 'failed']
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  // New fields for Supabase migration
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  error: {
    code: String,
    message: String
  },
  processedAt: Date,
  confirmedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  tags: [String],
  attachments: [{
    url: String,
    type: String,
    size: Number,
    name: String
  }]
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ recipientId: 1 });
transactionSchema.index({ senderId: 1 });
transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ type: 1, subtype: 1 });
transactionSchema.index({ tags: 1 });

// Virtual field for transaction amount with currency
transactionSchema.virtual('formattedAmount').get(function () {
  return `${this.amount} ${this.currency}`;
});

// Pre-save middleware to generate reference if not provided
transactionSchema.pre('save', function (next) {
  if (!this.reference) {
    this.reference = `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method to check if transaction can be cancelled
transactionSchema.methods.canBeCancelled = function () {
  return this.status === 'pending' && !this.cancelledAt;
};

// Method to cancel transaction
transactionSchema.methods.cancel = async function (reason) {
  if (!this.canBeCancelled()) {
    throw new Error('Transaction cannot be cancelled');
  }
  this.status = 'failed';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  await this.save();
};

// Static method to get transactions by date range
transactionSchema.statics.getByDateRange = async function (userId, startDate, endDate) {
  return this.find({
    userId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;