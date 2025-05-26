import User from '../models/User.js';
import P2PProfile from '../models/P2PProfile.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Offer from '../models/Offer.js';
import Message from '../models/Message.js';

// Get P2P profile
export const getProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const profile = await P2PProfile.findOne({ userId })
            .populate('userId', 'username email')
            .lean();

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Get user stats
        const stats = await calculateUserStats(userId);

        // Get user badges
        const badges = await calculateUserBadges(userId);

        // Get reviews if viewing other user's profile
        const reviews = userId !== req.user.id ? await Review.find({ targetUser: userId })
            .populate('user', 'username')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean() : [];

        // Get recent orders if viewing other user's profile
        const orders = userId !== req.user.id ? await Order.find({
            $or: [{ buyer: userId }, { seller: userId }]
        })
            .populate('buyer', 'username')
            .populate('seller', 'username')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean() : [];

        res.json({
            ...profile,
            stats,
            badges,
            reviews,
            orders
        });
    } catch (error) {
        console.error('Error fetching P2P profile:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

// Update P2P profile
export const updateProfile = async (req, res) => {
    try {
        const { nickname, paymentMethods } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!nickname || !paymentMethods) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Update or create profile
        const profile = await P2PProfile.findOneAndUpdate(
            { userId },
            { nickname, paymentMethods },
            { new: true, upsert: true }
        );

        res.json(profile);
    } catch (error) {
        console.error('Error updating P2P profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

// Get offers
export const getOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ status: 'active' })
            .populate('seller', 'username')
            .sort({ createdAt: -1 })
            .lean();
        res.json(offers);
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ message: 'Error fetching offers' });
    }
};

// Create offer
export const createOffer = async (req, res) => {
    try {
        const { type, amount, price, paymentMethods, minAmount, maxAmount, description } = req.body;
        const seller = req.user.id;

        const offer = new Offer({
            seller,
            type,
            amount,
            price,
            paymentMethods,
            minAmount,
            maxAmount,
            description
        });

        await offer.save();
        res.status(201).json(offer);
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ message: 'Error creating offer' });
    }
};

// Update offer
export const updateOffer = async (req, res) => {
    try {
        const { offerId } = req.params;
        const { amount, price, paymentMethods, minAmount, maxAmount, description, status } = req.body;
        const seller = req.user.id;

        const offer = await Offer.findOneAndUpdate(
            { _id: offerId, seller },
            { amount, price, paymentMethods, minAmount, maxAmount, description, status },
            { new: true }
        );

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        res.json(offer);
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({ message: 'Error updating offer' });
    }
};

// Delete offer
export const deleteOffer = async (req, res) => {
    try {
        const { offerId } = req.params;
        const seller = req.user.id;

        const offer = await Offer.findOneAndDelete({ _id: offerId, seller });

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ message: 'Error deleting offer' });
    }
};

// Get orders
export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{ buyer: req.user.id }, { seller: req.user.id }]
        })
            .populate('buyer', 'username')
            .populate('seller', 'username')
            .populate('offer')
            .sort({ createdAt: -1 })
            .lean();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

// Create order
export const createOrder = async (req, res) => {
    try {
        const { offerId, amount, paymentMethod } = req.body;
        const buyer = req.user.id;

        const offer = await Offer.findById(offerId);
        if (!offer || offer.status !== 'active') {
            return res.status(404).json({ message: 'Offer not found or not active' });
        }

        if (amount < offer.minAmount || amount > offer.maxAmount) {
            return res.status(400).json({ message: 'Amount must be between minimum and maximum amounts' });
        }

        if (!offer.paymentMethods.includes(paymentMethod)) {
            return res.status(400).json({ message: 'Invalid payment method' });
        }

        const order = new Order({
            offer: offerId,
            buyer,
            seller: offer.seller,
            amount,
            price: offer.price,
            total: amount * offer.price,
            paymentMethod
        });

        await order.save();
        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
};

// Update order
export const updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, paymentProof } = req.body;
        const userId = req.user.id;

        const order = await Order.findOne({
            _id: orderId,
            $or: [{ buyer: userId }, { seller: userId }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (status) {
            order.status = status;
            if (status === 'paid') order.paidAt = Date.now();
            if (status === 'completed') order.completedAt = Date.now();
            if (status === 'cancelled') order.cancelledAt = Date.now();
            if (status === 'disputed') order.disputedAt = Date.now();
        }

        if (paymentProof) {
            order.paymentProof = paymentProof;
        }

        await order.save();
        res.json(order);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Error updating order' });
    }
};

// Get reviews
export const getReviews = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await Review.find({ targetUser: userId })
            .populate('user', 'username')
            .populate('order')
            .sort({ createdAt: -1 })
            .lean();
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
};

// Create review
export const createReview = async (req, res) => {
    try {
        const { orderId, rating, comment, type } = req.body;
        const user = req.user.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Determine target user based on order and review type
        const targetUser = type === 'buy' ? order.seller : order.buyer;

        const review = new Review({
            order: orderId,
            user,
            targetUser,
            rating,
            comment,
            type
        });

        await review.save();
        res.status(201).json(review);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Error creating review' });
    }
};

// Get order details
export const getOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .populate('buyer', 'username email')
            .populate('seller', 'username email')
            .populate('offer')
            .lean();

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is authorized to view this order
        if (order.buyer._id.toString() !== req.user.id &&
            order.seller._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Error fetching order' });
    }
};

// Get order messages
export const getOrderMessages = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Check if user has access to this order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.buyer.toString() !== req.user.id &&
            order.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view these messages' });
        }

        const messages = await Message.find({ orderId })
            .populate('sender', 'username')
            .sort({ createdAt: 1 })
            .lean();

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

// Create order message
export const createOrderMessage = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { content } = req.body;

        // Check if user has access to this order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.buyer.toString() !== req.user.id &&
            order.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to send messages for this order' });
        }

        // Create message
        const message = new Message({
            orderId,
            sender: req.user.id,
            content
        });

        await message.save();

        // Populate sender info
        await message.populate('sender', 'username');

        // Emit socket event for real-time updates
        req.app.get('io').to(orderId).emit('newMessage', message);

        res.status(201).json(message);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ message: 'Error creating message' });
    }
};

// Helper function to calculate user stats
async function calculateUserStats(userId) {
    try {
        const orders = await Order.find({
            $or: [{ buyer: userId }, { seller: userId }],
            status: 'completed'
        });

        const totalOrders = orders.length;
        const totalVolume = orders.reduce((sum, order) => sum + order.amount, 0);

        // Calculate completion rate
        const allOrders = await Order.find({
            $or: [{ buyer: userId }, { seller: userId }]
        });
        const completionRate = allOrders.length > 0
            ? (totalOrders / allOrders.length * 100)
            : 0;

        // Calculate average response time
        const responseTimes = orders.map(order => {
            const responseTime = order.updatedAt - order.createdAt;
            return responseTime / (1000 * 60); // Convert to minutes
        });
        const avgResponseTime = responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : 0;

        return {
            totalOrders,
            totalVolume,
            completionRate: Math.round(completionRate),
            avgResponseTime: `${avgResponseTime} min`
        };
    } catch (error) {
        console.error('Error calculating user stats:', error);
        return {
            totalOrders: 0,
            totalVolume: 0,
            completionRate: 0,
            avgResponseTime: '0 min'
        };
    }
}

// Helper function to calculate user badges
async function calculateUserBadges(userId) {
    try {
        const badges = [];
        const stats = await calculateUserStats(userId);

        // Verified Seller badge
        if (stats.totalOrders >= 50 && stats.completionRate >= 95) {
            badges.push({
                name: 'Verified Seller',
                icon: 'Shield',
                color: 'blue'
            });
        }

        // Quick Response badge
        if (stats.avgResponseTime <= 5) {
            badges.push({
                name: 'Quick Response',
                icon: 'Clock',
                color: 'green'
            });
        }

        // Top Rated badge
        const reviews = await Review.find({ targetUser: userId });
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;
        if (avgRating >= 4.5 && reviews.length >= 10) {
            badges.push({
                name: 'Top Rated',
                icon: 'Star',
                color: 'yellow'
            });
        }

        return badges;
    } catch (error) {
        console.error('Error calculating user badges:', error);
        return [];
    }
}

// @desc    Create P2P Profile
// @route   POST /api/p2p/profile
// @access  Private
export const createProfile = async (req, res) => {
    try {
        const { nickname, paymentMethods, bankDetails, mobileMoney } = req.body;
        const userId = req.user.id;

        // Check if user already has a profile
        const existingProfile = await P2PProfile.findOne({ userId });

        if (existingProfile) {
            return res.status(400).json({ message: 'User already has a P2P profile' });
        }

        // Create new profile
        const profile = new P2PProfile({
            userId,
            nickname,
            paymentMethods,
            bankDetails,
            mobileMoney
        });

        const createdProfile = await profile.save();
        res.status(201).json(createdProfile);
    } catch (error) {
        console.error('Error creating P2P profile:', error);
        res.status(500).json({ message: 'Error creating profile' });
    }
}; 