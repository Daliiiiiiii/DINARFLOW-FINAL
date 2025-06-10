import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: function () {
            return !this.imageUrl; // Content is required only if there's no imageUrl
        },
        trim: true,
        maxlength: 1000
    },
    imageUrl: {
        type: String,
        trim: true
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for efficient querying
messageSchema.index({ orderId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema); 