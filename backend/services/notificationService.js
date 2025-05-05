import Notification from '../models/Notification.js';
import logger from './logger.js';

class NotificationService {
    async createNotification(userId, type, title, message, data = {}) {
        try {
            const notification = new Notification({
                userId,
                type,
                title,
                message,
                data
            });
            await notification.save();
            logger.info(`Created notification for user ${userId}`, { type, title });
            return notification;
        } catch (error) {
            logger.error('Error creating notification:', { error, userId, type });
            throw error;
        }
    }

    async getUserNotifications(userId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await Notification.countDocuments({ userId });

            return {
                notifications,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error fetching user notifications:', { error, userId });
            throw error;
        }
    }

    async markAsRead(userId, notificationId) {
        try {
            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, userId },
                { isRead: true },
                { new: true }
            );

            if (!notification) {
                throw new Error('Notification not found');
            }

            logger.info(`Marked notification as read: ${notificationId}`, { userId });
            return notification;
        } catch (error) {
            logger.error('Error marking notification as read:', { error, userId, notificationId });
            throw error;
        }
    }

    async markAllAsRead(userId) {
        try {
            const result = await Notification.updateMany(
                { userId, isRead: false },
                { isRead: true }
            );

            logger.info(`Marked all notifications as read for user ${userId}`, {
                modifiedCount: result.modifiedCount
            });

            return result;
        } catch (error) {
            logger.error('Error marking all notifications as read:', { error, userId });
            throw error;
        }
    }

    async getUnreadCount(userId) {
        try {
            const count = await Notification.countDocuments({
                userId,
                isRead: false
            });

            return count;
        } catch (error) {
            logger.error('Error getting unread count:', { error, userId });
            throw error;
        }
    }

    async deleteNotification(userId, notificationId) {
        try {
            const notification = await Notification.findOneAndDelete({
                _id: notificationId,
                userId
            });

            if (!notification) {
                throw new Error('Notification not found');
            }

            logger.info(`Deleted notification: ${notificationId}`, { userId });
            return notification;
        } catch (error) {
            logger.error('Error deleting notification:', { error, userId, notificationId });
            throw error;
        }
    }
}

const notificationService = new NotificationService();
export default notificationService; 