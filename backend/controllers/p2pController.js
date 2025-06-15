import User from '../models/User.js';
import P2PProfile from '../models/P2PProfile.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Offer from '../models/Offer.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import { NotificationService } from '../services/notificationService.js';
import path from 'path';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';

const notificationService = new NotificationService();

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
        const allowedMethods = ['bank', 'flouci', 'd17', 'postepay', 'phone_balance', 'tnd_wallet'];
        if (!Array.isArray(paymentMethods) || paymentMethods.some(pm => !pm.id || !allowedMethods.includes(pm.id) || typeof pm.details !== 'object')) {
            return res.status(400).json({ message: 'Invalid payment methods' });
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

// Block user
export const blockUser = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const userId = req.user.id;

        // Prevent self-blocking
        if (targetUserId === userId) {
            return res.status(400).json({ message: 'Cannot block yourself' });
        }

        // Add user to blocked list
        await User.findByIdAndUpdate(userId, {
            $addToSet: { blockedUsers: targetUserId }
        });

        res.json({ message: 'User blocked successfully' });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ message: 'Error blocking user' });
    }
};

// Unblock user
export const unblockUser = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const userId = req.user.id;

        await User.findByIdAndUpdate(userId, {
            $pull: { blockedUsers: targetUserId }
        });

        res.json({ message: 'User unblocked successfully' });
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ message: 'Error unblocking user' });
    }
};

// Report user
export const reportUser = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const { reason, details } = req.body;
        const userId = req.user.id;

        // Prevent self-reporting
        if (targetUserId === userId) {
            return res.status(400).json({ message: 'Cannot report yourself' });
        }

        // Create report
        const report = new Report({
            reporter: userId,
            reportedUser: targetUserId,
            reason,
            details,
            status: 'pending'
        });

        await report.save();

        res.status(201).json({ message: 'User reported successfully' });
    } catch (error) {
        console.error('Error reporting user:', error);
        res.status(500).json({ message: 'Error reporting user' });
    }
};

// Modify getOffers to exclude blocked users
export const getOffers = async (req, res) => {
    try {
        console.log('Fetching offers...');
        const { type } = req.query;
        const userId = req.user.id;

        // Get user's blocked users
        const user = await User.findById(userId);
        const blockedUsers = user?.blockedUsers || [];

        // Get users who have blocked the current user
        const usersWhoBlockedMe = await User.find({
            blockedUsers: userId
        }).select('_id');

        const blockedByUsers = usersWhoBlockedMe.map(user => user._id);

        // Build query based on type and blocked users
        const query = {
            seller: {
                $nin: [...blockedUsers, ...blockedByUsers]
            }
        };
        if (type) {
            query.type = type;
        }

        // If requesting own offers, do not filter by status
        if (req.query.my === 'true') {
            query.seller = userId;
        } else {
            query.status = 'active';
        }

        const offers = await Offer.find(query)
            .populate({
                path: 'seller',
                select: 'username displayName',
                populate: {
                    path: 'p2pProfile',
                    select: 'nickname profilePicture'
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        console.log('Raw offers data:', JSON.stringify(offers, null, 2));

        // Transform the data to make it easier to access
        const transformedOffers = offers.map(offer => {
            const transformed = {
                ...offer,
                seller: {
                    ...offer.seller,
                    nickname: offer.seller?.p2pProfile?.nickname || offer.seller?.displayName || offer.seller?.username || 'Unknown User',
                    profilePicture: offer.seller?.p2pProfile?.profilePicture || null
                }
            };
            console.log('Transformed offer:', JSON.stringify(transformed, null, 2));
            return transformed;
        });

        res.json(transformedOffers);
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

        // Populate seller data before sending response
        const populatedOffer = await Offer.findById(offer._id)
            .populate({
                path: 'seller',
                select: 'username displayName',
                populate: {
                    path: 'p2pProfile',
                    select: 'nickname'
                }
            })
            .lean();

        // Transform the data to match the format expected by the frontend
        const transformedOffer = {
            ...populatedOffer,
            seller: {
                ...populatedOffer.seller,
                nickname: populatedOffer.seller?.p2pProfile?.nickname || populatedOffer.seller?.displayName || populatedOffer.seller?.username || 'Unknown User'
            }
        };

        res.status(201).json(transformedOffer);
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

        // If trying to activate, check for existing active offer of same type
        if (status === 'active') {
            const offerToActivate = await Offer.findById(offerId);
            if (offerToActivate) {
                const existingActiveOffer = await Offer.findOne({
                    seller,
                    type: offerToActivate.type,
                    status: 'active',
                    _id: { $ne: offerId }
                });
                if (existingActiveOffer) {
                    return res.status(400).json({ message: 'You already have an active offer of this type. Please deactivate it first.' });
                }
            }
        }

        const offer = await Offer.findOneAndUpdate(
            { _id: offerId, seller },
            { amount, price, paymentMethods, minAmount, maxAmount, description, status },
            { new: true }
        );

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Populate seller data before sending response
        const populatedOffer = await Offer.findById(offer._id)
            .populate({
                path: 'seller',
                select: 'username displayName',
                populate: {
                    path: 'p2pProfile',
                    select: 'nickname'
                }
            })
            .lean();

        // Transform the data to match the format expected by the frontend
        const transformedOffer = {
            ...populatedOffer,
            seller: {
                ...populatedOffer.seller,
                nickname: populatedOffer.seller?.p2pProfile?.nickname || populatedOffer.seller?.displayName || populatedOffer.seller?.username || 'Unknown User'
            }
        };

        res.json(transformedOffer);
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
            .populate({
                path: 'buyer',
                select: 'username displayName',
                populate: {
                    path: 'p2pProfile',
                    select: 'nickname'
                }
            })
            .populate({
                path: 'seller',
                select: 'username displayName',
                populate: {
                    path: 'p2pProfile',
                    select: 'nickname'
                }
            })
            .populate('offer')
            .sort({ createdAt: -1 })
            .lean();

        // Transform the data to include nicknames
        const transformedOrders = orders.map(order => ({
            ...order,
            buyer: {
                ...order.buyer,
                nickname: order.buyer?.p2pProfile?.nickname || order.buyer?.username || 'Unknown Buyer'
            },
            seller: {
                ...order.seller,
                nickname: order.seller?.p2pProfile?.nickname || order.seller?.username || 'Unknown Seller'
            }
        }));

        res.json(transformedOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

// Create order
export const createOrder = async (req, res) => {
    try {
        const { offerId, amount, paymentMethod, type, price } = req.body;

        // Validate required fields
        if (!offerId || !amount || !paymentMethod || !type || !price) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get the offer
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Calculate total
        const total = amount * price;

        // Create the order
        const order = new Order({
            offer: offerId,
            amount,
            price,
            total,
            paymentMethod,
            type,
            seller: offer.seller,
            buyer: req.user.id,
            status: 'pending'
        });

        await order.save();

        // Get WebSocket service
        const wsService = req.app.get('wsService');

        // Send notification to the seller
        await notificationService.createNotification(
            offer.seller,
            'transaction',
            'New Order Created',
            `A new order has been created for ${amount} USDT`,
            {
                orderId: order._id,
                amount,
                type: 'new_order'
            }
        );

        // Send notification to the buyer
        await notificationService.createNotification(
            req.user.id,
            'transaction',
            'Order Created',
            `You have created a new order for ${amount} USDT`,
            {
                orderId: order._id,
                amount,
                type: 'new_order'
            }
        );

        // Emit socket events to both parties
        if (wsService) {
            const sellerNotification = {
                type: 'transaction',
                title: 'New Order Created',
                message: `A new order has been created for ${amount} USDT`,
                data: {
                    orderId: order._id,
                    amount,
                    type: 'new_order'
                },
                read: false,
                createdAt: new Date()
            };

            const buyerNotification = {
                type: 'transaction',
                title: 'Order Created',
                message: `You have created a new order for ${amount} USDT`,
                data: {
                    orderId: order._id,
                    amount,
                    type: 'new_order'
                },
                read: false,
                createdAt: new Date()
            };

            // Emit to seller
            wsService.io.to(`user:${offer.seller}`).emit('notification:received', { notification: sellerNotification });
            // Emit to buyer
            wsService.io.to(`user:${req.user.id}`).emit('notification:received', { notification: buyerNotification });
        }

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
        }).populate('offer');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (status) {
            order.status = status;
            if (status === 'paid') order.paidAt = Date.now();
            if (status === 'completed') {
                order.completedAt = Date.now();
                // Update the offer's available amount when order is completed
                if (order.offer) {
                    const newAmount = order.offer.amount - order.amount;
                    await Offer.findByIdAndUpdate(order.offer._id, {
                        amount: newAmount,
                        // If the new amount is less than minAmount, set status to inactive
                        status: newAmount < order.offer.minAmount ? 'inactive' : 'active'
                    });
                }
            }
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
            order.seller.toString() !== req.user.id &&
            !['admin', 'superadmin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to view these messages' });
        }

        const messages = await Message.find({ orderId })
            .populate({
                path: 'sender',
                select: 'username role'
            })
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
        const { content, imageUrl } = req.body;

        // Check if user has access to this order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Allow admins and superadmins to send messages
        if (order.buyer.toString() !== req.user.id &&
            order.seller.toString() !== req.user.id &&
            !['admin', 'superadmin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to send messages for this order' });
        }

        // Create message
        const message = new Message({
            orderId,
            sender: req.user.id,
            content,
            imageUrl
        });

        await message.save();

        // Populate sender info
        await message.populate({
            path: 'sender',
            select: 'username role'
        });

        // Send notification to the other party
        const recipientId = req.user.id === order.buyer.toString() ? order.seller : order.buyer;
        await notificationService.createNotification(
            recipientId,
            'transaction',
            'New Message in Order',
            `You have a new message in order #${orderId.slice(-6)}`,
            {
                orderId,
                messageId: message._id,
                senderId: req.user.id
            }
        );

        // Emit socket event for real-time updates
        const wsService = req.app.get('wsService');
        if (wsService) {
            console.log('Emitting new message to room:', `order:${orderId}`);
            // Emit to the order room with proper message format
            wsService.io.to(`order:${orderId}`).emit('newMessage', {
                ...message.toObject(),
                orderId,
                sender: {
                    _id: req.user.id,
                    username: req.user.username,
                    role: req.user.role
                }
            });
        }

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
        const { nickname, paymentMethods } = req.body;
        const userId = req.user.id;

        // Check if user already has a profile
        const existingProfile = await P2PProfile.findOne({ userId });

        if (existingProfile) {
            return res.status(400).json({ message: 'User already has a P2P profile' });
        }

        // Validate payment methods
        const allowedMethods = ['bank', 'flouci', 'd17', 'postepay', 'phone_balance', 'tnd_wallet'];
        if (!Array.isArray(paymentMethods) || paymentMethods.some(pm => !pm.id || !allowedMethods.includes(pm.id) || typeof pm.details !== 'object')) {
            return res.status(400).json({ message: 'Invalid payment methods' });
        }

        // Create new profile
        const profile = new P2PProfile({
            userId,
            nickname,
            paymentMethods
        });

        await profile.save();

        // Update user with profile reference
        await User.findByIdAndUpdate(userId, { p2pProfile: profile._id });

        res.status(201).json(profile);
    } catch (error) {
        console.error('Error creating P2P profile:', error);
        res.status(500).json({ message: 'Error creating profile' });
    }
};

// Upload chat image
export const uploadChatImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Store relative path
        const imageUrl = `/uploads/${req.file.filename}`;

        res.json({ url: imageUrl });
    } catch (error) {
        console.error('Error uploading chat image:', error);
        res.status(500).json({ message: 'Error uploading image' });
    }
};

// Upload P2P profile picture
export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.user.id;
        let profile = await P2PProfile.findOne({ userId });

        // Create profile if it doesn't exist
        if (!profile) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            profile = new P2PProfile({
                userId,
                nickname: user.displayName || user.username || 'User',
                paymentMethods: [] // Initialize with empty array, Mongoose will handle the validation
            });
            await profile.save();

            // Update user with profile reference
            await User.findByIdAndUpdate(userId, { p2pProfile: profile._id });
        }

        // Delete old profile picture if it exists
        if (profile.profilePicture) {
            const oldPicturePath = path.join(process.cwd(), 'uploads', path.basename(profile.profilePicture));
            try {
                await fs.unlink(oldPicturePath);
            } catch (error) {
                console.error('Error deleting old profile picture:', error);
            }
        }

        // Store relative path
        const profilePicturePath = `/uploads/${req.file.filename}`;

        // Update profile with new picture URL
        profile.profilePicture = profilePicturePath;
        await profile.save();

        res.json({
            message: 'Profile picture uploaded successfully',
            profilePicture: profilePicturePath
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Error uploading profile picture' });
    }
};

// Delete P2P profile picture
export const deleteProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await P2PProfile.findOne({ userId });

        if (!profile) {
            return res.status(404).json({ message: 'P2P profile not found' });
        }

        // Remove the profile picture
        profile.profilePicture = null;
        await profile.save();

        res.json({ message: 'Profile picture removed successfully' });
    } catch (error) {
        console.error('Error removing profile picture:', error);
        res.status(500).json({ message: 'Error removing profile picture' });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update order status
        order.status = status;
        await order.save();

        // Get WebSocket service
        const wsService = req.app.get('wsService');

        // Send notifications based on status
        if (status === 'paid') {
            // Notify seller when buyer marks as paid
            await notificationService.createNotification(
                order.seller,
                'transaction',
                'Payment Received',
                `Buyer has marked order #${orderId.slice(-6)} as paid`,
                {
                    orderId,
                    status,
                    type: 'payment_received'
                }
            );

            // Emit socket event
            if (wsService) {
                wsService.io.to(`user:${order.seller}`).emit('notification:received', {
                    notification: {
                        type: 'transaction',
                        title: 'Payment Received',
                        message: `Buyer has marked order #${orderId.slice(-6)} as paid`,
                        data: {
                            orderId,
                            status,
                            type: 'payment_received'
                        },
                        read: false,
                        createdAt: new Date()
                    }
                });
            }
        } else {
            // Notify both parties for completed/cancelled/disputed
            const notificationPromises = [
                notificationService.createNotification(
                    order.buyer,
                    'transaction',
                    `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    `Order #${orderId.slice(-6)} has been ${status}`,
                    {
                        orderId,
                        status,
                        type: `order_${status}`
                    }
                ),
                notificationService.createNotification(
                    order.seller,
                    'transaction',
                    `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    `Order #${orderId.slice(-6)} has been ${status}`,
                    {
                        orderId,
                        status,
                        type: `order_${status}`
                    }
                )
            ];
            await Promise.all(notificationPromises);

            // Emit socket events to both parties
            if (wsService) {
                const notification = {
                    type: 'transaction',
                    title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    message: `Order #${orderId.slice(-6)} has been ${status}`,
                    data: {
                        orderId,
                        status,
                        type: `order_${status}`
                    },
                    read: false,
                    createdAt: new Date()
                };

                // Emit to buyer
                wsService.io.to(`user:${order.buyer}`).emit('notification:received', { notification });
                // Emit to seller
                wsService.io.to(`user:${order.seller}`).emit('notification:received', { notification });
            }
        }

        // Also emit order status change to the order room
        if (wsService) {
            wsService.io.to(orderId).emit('orderStatusChanged', { orderId, status });
        }

        res.json(order);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status' });
    }
};

// Get all disputes (admin only)
export const getDisputes = async (req, res) => {
    try {
        // Check if user is admin
        if (!['admin', 'superadmin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const disputes = await Order.find({ status: 'disputed' })
            .populate({
                path: 'buyer',
                select: 'username',
                populate: {
                    path: 'p2pProfile',
                    select: 'nickname'
                }
            })
            .populate({
                path: 'seller',
                select: 'username',
                populate: {
                    path: 'p2pProfile',
                    select: 'nickname'
                }
            })
            .populate('offer', 'currency')
            .sort({ disputedAt: -1 })
            .lean();

        // Transform to include nickname fallback
        const transformedDisputes = disputes.map(dispute => ({
            ...dispute,
            buyer: {
                ...dispute.buyer,
                username: dispute.buyer?.p2pProfile?.nickname || dispute.buyer?.username || 'Unknown Buyer'
            },
            seller: {
                ...dispute.seller,
                username: dispute.seller?.p2pProfile?.nickname || dispute.seller?.username || 'Unknown Seller'
            }
        }));

        res.json(transformedDisputes);
    } catch (error) {
        console.error('Error fetching disputes:', error);
        res.status(500).json({ message: 'Error fetching disputes' });
    }
};

// Resolve a dispute (admin only)
export const resolveDispute = async (req, res) => {
    try {
        // Check if user is admin
        if (!['admin', 'superadmin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { orderId } = req.params;
        const { resolution } = req.body;

        if (!['refund_buyer', 'release_seller'].includes(resolution)) {
            return res.status(400).json({ message: 'Invalid resolution type' });
        }

        const order = await Order.findById(orderId)
            .populate('buyer', 'walletBalance')
            .populate('seller', 'walletBalance');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'disputed') {
            return res.status(400).json({ message: 'Order is not in dispute' });
        }

        // Handle the resolution
        if (resolution === 'refund_buyer') {
            // Refund the buyer
            await User.findByIdAndUpdate(order.buyer._id, {
                $inc: { walletBalance: order.total }
            });
            order.status = 'cancelled';
            order.cancelledAt = Date.now();
        } else {
            // Release funds to seller
            await User.findByIdAndUpdate(order.seller._id, {
                $inc: { walletBalance: order.total }
            });
            order.status = 'completed';
            order.completedAt = Date.now();
        }

        await order.save();

        // Notify both parties
        await notificationService.createNotification(
            order.buyer._id,
            'alert',
            'Dispute Resolved',
            `Your dispute for order #${order._id} has been resolved. ${resolution === 'refund_buyer' ? 'You have been refunded.' : 'The seller has received the funds.'}`,
            { orderId: order._id }
        );

        await notificationService.createNotification(
            order.seller._id,
            'alert',
            'Dispute Resolved',
            `The dispute for order #${order._id} has been resolved. ${resolution === 'refund_buyer' ? 'The buyer has been refunded.' : 'You have received the funds.'}`,
            { orderId: order._id }
        );

        // Real-time notification via socket
        const wsService = req.app.get('wsService');
        if (wsService) {
            const notification = {
                type: 'dispute_resolved',
                title: 'Dispute Resolved',
                message: `Order #${order._id.toString().slice(-6)} dispute resolved: ${resolution === 'refund_buyer' ? 'Buyer refunded' : 'Released to seller'}`,
                data: { orderId: order._id, resolution }
            };
            wsService.io.to(`user:${order.buyer._id}`).emit('notification:received', { notification });
            wsService.io.to(`user:${order.seller._id}`).emit('notification:received', { notification });
        }

        res.json({ message: 'Dispute resolved successfully' });
    } catch (error) {
        console.error('Error resolving dispute:', error);
        res.status(500).json({ message: 'Error resolving dispute' });
    }
};

// Create a dispute for an order
export const createDispute = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason, details } = req.body;
        const userId = req.user.id;

        // Find the order
        const order = await Order.findById(orderId)
            .populate('buyer', 'username')
            .populate('seller', 'username');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is part of the order
        if (order.buyer._id.toString() !== userId && order.seller._id.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to dispute this order' });
        }

        // Check if order can be disputed
        if (!['pending', 'paid'].includes(order.status)) {
            return res.status(400).json({ message: 'This order cannot be disputed' });
        }

        // Update order status and add dispute details
        order.status = 'disputed';
        order.disputedAt = Date.now();
        order.disputeReason = reason;
        order.disputeDetails = details;
        order.disputedBy = userId;

        await order.save();

        // Notify both parties
        await notificationService.createNotification(
            order.buyer._id,
            'alert',
            'Order Disputed',
            `Order #${order._id.toString().slice(-6)} has been disputed`,
            { orderId: order._id }
        );

        await notificationService.createNotification(
            order.seller._id,
            'alert',
            'Order Disputed',
            `Order #${order._id.toString().slice(-6)} has been disputed`,
            { orderId: order._id }
        );

        // Notify admins
        const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } });
        for (const admin of admins) {
            await notificationService.createNotification(
                admin._id,
                'alert',
                'New Dispute Filed',
                `A new dispute has been filed for order #${order._id.toString().slice(-6)}`,
                { orderId: order._id }
            );
        }

        res.json({ message: 'Dispute created successfully', order });
    } catch (error) {
        console.error('Error creating dispute:', error);
        res.status(500).json({ message: 'Error creating dispute' });
    }
};

// Process automatic payment for P2P order
export const processAutomaticPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        // Find the order
        const order = await Order.findById(orderId)
            .populate('buyer', 'username email')
            .populate('seller', 'username email')
            .populate('offer');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify the user is the buyer
        if (order.buyer._id.toString() !== userId) {
            return res.status(403).json({ message: 'Only the buyer can process automatic payment' });
        }

        // Verify the order is pending
        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Order is not in pending status' });
        }

        // Verify payment method is TND wallet
        if (order.paymentMethod !== 'tnd_wallet') {
            return res.status(400).json({ message: 'Invalid payment method for automatic processing' });
        }

        // Get buyer's wallet
        const buyerWallet = await Wallet.findOne({ userId: order.buyer._id });
        if (!buyerWallet) {
            return res.status(404).json({ message: 'Buyer wallet not found' });
        }

        // Get seller's wallet
        const sellerWallet = await Wallet.findOne({ userId: order.seller._id });
        if (!sellerWallet) {
            return res.status(404).json({ message: 'Seller wallet not found' });
        }

        // Verify seller has enough USDT
        if (parseFloat(sellerWallet.globalUsdtBalance || '0') < order.amount) {
            return res.status(400).json({ message: 'Seller has insufficient USDT balance' });
        }

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Transfer TND from buyer to seller
            const tndTransfer = await Transaction.create([{
                userId: order.buyer._id,
                type: 'transfer',
                subtype: 'send',
                amount: -order.total,
                currency: 'TND',
                status: 'completed',
                description: `P2P trade for ${order.amount} USDT`,
                reference: `TND-P2P-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }], { session });

            // Update buyer's TND balance
            const buyerUser = await User.findById(order.buyer._id);
            buyerUser.walletBalance = (parseFloat(buyerUser.walletBalance || '0') - order.total).toFixed(2);
            await buyerUser.save({ session });

            // Update seller's TND balance
            const sellerUser = await User.findById(order.seller._id);
            sellerUser.walletBalance = (parseFloat(sellerUser.walletBalance || '0') + order.total).toFixed(2);
            await sellerUser.save({ session });

            // 2. Transfer USDT from seller to buyer
            // Update seller's USDT balance
            sellerWallet.globalUsdtBalance = (parseFloat(sellerWallet.globalUsdtBalance || '0') - order.amount).toFixed(6);
            await sellerWallet.save({ session });

            // Update buyer's USDT balance
            buyerWallet.globalUsdtBalance = (parseFloat(buyerWallet.globalUsdtBalance || '0') + order.amount).toFixed(6);
            await buyerWallet.save({ session });

            // Create USDT transaction records
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substr(2, 9);

            await Transaction.create([{
                userId: order.seller._id,
                type: 'crypto',
                subtype: 'send',
                amount: -order.amount,
                currency: 'USDT',
                status: 'completed',
                reference: `USDT-SEND-${timestamp}-${randomStr}`,
                metadata: {
                    network: 'ethereum',
                    fee: 0,
                    fromAddress: sellerWallet.address,
                    toAddress: buyerWallet.address
                }
            }, {
                userId: order.buyer._id,
                type: 'crypto',
                subtype: 'receive',
                amount: order.amount,
                currency: 'USDT',
                status: 'completed',
                reference: `USDT-RECV-${timestamp}-${randomStr}`,
                metadata: {
                    network: 'ethereum',
                    fee: 0,
                    fromAddress: sellerWallet.address,
                    toAddress: buyerWallet.address
                }
            }], { session });

            // 3. Update order status to completed
            order.status = 'completed';
            order.completedAt = Date.now();
            await order.save({ session });

            // Commit the transaction
            await session.commitTransaction();

            // Get WebSocket service
            const wsService = req.app.get('wsService');

            // Send notifications
            await notificationService.createNotification(
                order.buyer._id,
                'transaction',
                'Order Completed',
                `Your order for ${order.amount} USDT has been completed`,
                {
                    orderId: order._id,
                    amount: order.amount,
                    type: 'order_completed'
                }
            );

            await notificationService.createNotification(
                order.seller._id,
                'transaction',
                'Order Completed',
                `Order for ${order.amount} USDT has been completed`,
                {
                    orderId: order._id,
                    amount: order.amount,
                    type: 'order_completed'
                }
            );

            // Emit socket events
            if (wsService) {
                wsService.io.to(`user:${order.buyer._id}`).emit('balance:updated', {
                    userId: order.buyer._id,
                    walletBalance: buyerUser.walletBalance,
                    usdtBalance: buyerWallet.globalUsdtBalance
                });

                wsService.io.to(`user:${order.seller._id}`).emit('balance:updated', {
                    userId: order.seller._id,
                    walletBalance: sellerUser.walletBalance,
                    usdtBalance: sellerWallet.globalUsdtBalance
                });
            }

            res.json({
                message: 'Payment processed successfully',
                order,
                buyerBalance: {
                    tnd: buyerUser.walletBalance,
                    usdt: buyerWallet.globalUsdtBalance
                },
                sellerBalance: {
                    tnd: sellerUser.walletBalance,
                    usdt: sellerWallet.globalUsdtBalance
                }
            });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error('Error processing automatic payment:', error);
        res.status(500).json({ message: error.message || 'Error processing payment' });
    }
}; 