import mongoose from 'mongoose';

const p2pProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    nickname: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    paymentMethods: [{
        type: String,
        enum: ['bank', 'flouci', 'd17', 'postepay', 'phone_balance', 'western_union', 'moneygram', 'tnd_wallet']
    }],
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
p2pProfileSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('P2PProfile', p2pProfileSchema); 