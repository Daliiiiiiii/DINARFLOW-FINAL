import mongoose from 'mongoose';

const kycAuditSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: ['submission', 'verification', 'rejection', 'update', 'deletion']
    },
    previousStatus: {
        type: String,
        enum: ['pending', 'in_progress', 'verified', 'rejected']
    },
    newStatus: {
        type: String,
        enum: ['pending', 'in_progress', 'verified', 'rejected']
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reason: String,
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
kycAuditSchema.index({ userId: 1, createdAt: -1 });
kycAuditSchema.index({ action: 1, createdAt: -1 });

const KycAudit = mongoose.model('KycAudit', kycAuditSchema);

export default KycAudit; 