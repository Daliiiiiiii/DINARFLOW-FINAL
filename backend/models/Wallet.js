import mongoose from 'mongoose';

const networkSchema = new mongoose.Schema({
    network: {
        type: String,
        required: true,
        enum: ['ethereum', 'bsc', 'tron', 'ton', 'solana', 'polygon', 'arbitrum']
    },
    address: {
        type: String,
        required: true
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
        required: false
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

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet; 