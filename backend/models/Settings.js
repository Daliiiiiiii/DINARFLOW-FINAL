import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    transferLimits: {
        daily: { type: Number, default: 10000 },
        weekly: { type: Number, default: 50000 },
        monthly: { type: Number, default: 100000 },
        perTransaction: { type: Number, default: 5000 }
    },
    bankTransferLimits: {
        daily: { type: Number, default: 20000 },
        weekly: { type: Number, default: 100000 },
        monthly: { type: Number, default: 200000 },
        perTransaction: { type: Number, default: 10000 }
    }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings; 