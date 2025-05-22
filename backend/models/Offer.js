import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['buy', 'sell'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethods: [{
        type: String,
        enum: ['bank', 'flouci', 'd17', 'postepay'],
        required: true
    }],
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    minAmount: {
        type: Number,
        required: true,
        min: 0
    },
    maxAmount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
offerSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Ensure maxAmount is greater than minAmount
offerSchema.pre('save', function (next) {
    if (this.maxAmount <= this.minAmount) {
        next(new Error('Maximum amount must be greater than minimum amount'));
    }
    next();
});

// Ensure availableAmount is between minAmount and maxAmount
offerSchema.pre('save', function (next) {
    if (this.amount < this.minAmount || this.amount > this.maxAmount) {
        next(new Error('Available amount must be between minimum and maximum amounts'));
    }
    next();
});

// Add indexes for better query performance
offerSchema.index({ seller: 1, status: 1 });
offerSchema.index({ type: 1, status: 1 });
offerSchema.index({ createdAt: -1 });

const Offer = mongoose.model('Offer', offerSchema);
export default Offer; 