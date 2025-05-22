import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    total: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['bank', 'flouci', 'd17', 'postepay'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'completed', 'cancelled', 'disputed'],
        default: 'pending'
    },
    paymentProof: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    paidAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    disputedAt: Date
});

// Update the updatedAt timestamp before saving
orderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Add indexes for better query performance
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ offer: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order; 