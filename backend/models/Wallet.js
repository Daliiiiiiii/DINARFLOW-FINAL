import mongoose from 'mongoose';

const networkSchema = new mongoose.Schema({
    network: {
        type: String,
        required: true,
        enum: [
            'ethereum',
            'bsc',
            'polygon',
            'arbitrum',
            'tron',
            'ton',
            'solana'
        ]
    },
    address: {
        type: String,
        required: true
    },
    balance: {
        type: String,
        default: '0'
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: {
        type: String,
        required: true,
        unique: true
    },
    privateKey: {
        type: String,
        required: true
    },
    networks: [networkSchema],
    globalUsdtBalance: {
        type: String,
        default: '0'
    },
    isFrozen: {
        type: Boolean,
        default: false
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
walletSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Create indexes
walletSchema.index({ userId: 1 });
walletSchema.index({ address: 1 });
walletSchema.index({ 'networks.network': 1, 'networks.address': 1 });

export default mongoose.model('Wallet', walletSchema); 