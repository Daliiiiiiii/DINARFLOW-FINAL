import mongoose from 'mongoose';

const kycSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documents: [{
        type: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            required: true
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    comment: {
        type: String
    },
    verifiedAt: {
        type: Date
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for faster queries
kycSchema.index({ userId: 1 });
kycSchema.index({ status: 1 });
kycSchema.index({ createdAt: -1 });

const Kyc = mongoose.model('Kyc', kycSchema);

export default Kyc; 