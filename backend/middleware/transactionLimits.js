import Settings from '../models/Settings.js';
import Transaction from '../models/Transaction.js';

export const checkTransactionLimits = async (req, res, next) => {
    try {
        const { amount, type = 'transfer' } = req.body;
        const userId = req.user._id;

        // Get settings
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(500).json({ error: 'Transaction limits not configured' });
        }

        // Get the appropriate limits based on transaction type
        const limits = type === 'bank' ? settings.bankTransferLimits : settings.transferLimits;

        // Check per transaction limit
        if (amount > limits.perTransaction) {
            return res.status(400).json({
                error: `Amount exceeds per transaction limit of ${limits.perTransaction} TND`
            });
        }

        // Get current date and calculate start of day, week, and month
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get user's transactions for the current period
        const [dailyTotal, weeklyTotal, monthlyTotal] = await Promise.all([
            Transaction.aggregate([
                {
                    $match: {
                        userId,
                        type,
                        createdAt: { $gte: startOfDay },
                        status: { $ne: 'failed' },
                        ignoredForLimits: { $ne: true }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $abs: '$amount' } }
                    }
                }
            ]),
            Transaction.aggregate([
                {
                    $match: {
                        userId,
                        type,
                        createdAt: { $gte: startOfWeek },
                        status: { $ne: 'failed' },
                        ignoredForLimits: { $ne: true }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $abs: '$amount' } }
                    }
                }
            ]),
            Transaction.aggregate([
                {
                    $match: {
                        userId,
                        type,
                        createdAt: { $gte: startOfMonth },
                        status: { $ne: 'failed' },
                        ignoredForLimits: { $ne: true }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $abs: '$amount' } }
                    }
                }
            ])
        ]);

        // Check daily limit
        const dailyAmount = (dailyTotal[0]?.total || 0) + Number(amount);
        if (dailyAmount > limits.daily) {
            return res.status(400).json({
                error: `Amount exceeds daily limit of ${limits.daily} TND`
            });
        }

        // Check weekly limit
        const weeklyAmount = (weeklyTotal[0]?.total || 0) + Number(amount);
        if (weeklyAmount > limits.weekly) {
            return res.status(400).json({
                error: `Amount exceeds weekly limit of ${limits.weekly} TND`
            });
        }

        // Check monthly limit
        const monthlyAmount = (monthlyTotal[0]?.total || 0) + Number(amount);
        if (monthlyAmount > limits.monthly) {
            return res.status(400).json({
                error: `Amount exceeds monthly limit of ${limits.monthly} TND`
            });
        }

        next();
    } catch (error) {
        console.error('Error checking transaction limits:', error);
        res.status(500).json({ error: 'Failed to check transaction limits' });
    }
}; 