import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['user', 'agent'],
        required: true
    },
    status: {
        type: String,
        enum: ['sending', 'delivered', 'read'],
        default: 'delivered'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const supportTicketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        default: '',
        required: false
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'closed'],
        default: 'open'
    },
    messages: [supportMessageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

supportTicketSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;
