import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true
    },
    bankName: {
        type: String,
        required: true,
        trim: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    lastUsed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
bankAccountSchema.index({ userId: 1 });

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

export default BankAccount; 