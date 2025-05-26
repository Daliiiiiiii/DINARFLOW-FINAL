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
        enum: ['tnd_wallet', 'bank', 'flouci', 'd17', 'postepay', 'phone_balance', 'western_union', 'moneygram'],
        required: true
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'completed', 'cancelled'],
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

// Remove the strict validation for available amount
// Instead, add a method to adjust limits based on available amount
offerSchema.methods.adjustLimits = function () {
    const availableAmount = this.amount;
    if (availableAmount < this.minAmount) {
        // If available amount is less than minimum, set to inactive instead of cancelling
        this.status = 'inactive';
        return false;
    }
    if (availableAmount < this.maxAmount) {
        // If available amount is less than maximum, adjust maximum down
        this.maxAmount = availableAmount;
    }
    return true;
};

// Add indexes for better query performance
offerSchema.index({ seller: 1, status: 1 });
offerSchema.index({ type: 1, status: 1 });
offerSchema.index({ createdAt: -1 });

const Offer = mongoose.model('Offer', offerSchema);
export default Offer; 