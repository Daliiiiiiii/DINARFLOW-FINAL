import Notification from '../models/Notification.js';
import logger from './logger.js';
import sendEmail from '../utils/email.js';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { getIO } from '../services/websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class NotificationService {
    async createNotification(userId, type, title, message, data = {}) {
        try {
            const notification = new Notification({
                userId,
                type,
                title,
                message,
                data,
                priority: this.getPriorityForType(type)
            });
            await notification.save();
            logger.info(`Created notification for user ${userId}`, { type, title });

            // Send email notification if enabled
            await this.sendEmailNotification(userId, type, title, message, data);

            // Emit WebSocket event for real-time notification
            const io = getIO();
            if (io) {
                logger.info(`Emitting notification to user ${userId}`, { type, title });
                io.to(`user:${userId}`).emit('notification:received', {
                    notification: {
                        _id: notification._id,
                        type,
                        title,
                        message,
                        data,
                        priority: notification.priority,
                        read: false,
                        createdAt: notification.createdAt
                    }
                });
            } else {
                logger.error('WebSocket instance not available for notification');
            }

            return notification;
        } catch (error) {
            logger.error('Error creating notification:', { error, userId, type });
            throw error;
        }
    }

    getPriorityForType(type) {
        switch (type) {
            case 'alert':
                return 'high';
            case 'transaction':
                return 'medium';
            default:
                return 'low';
        }
    }

    async sendEmailNotification(userId, type, title, message, data) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.notificationsEnabled) return;

            const template = this.getEmailTemplateForType(type);
            const context = {
                displayName: user.displayName,
                title,
                message,
                ...data,
                currentYear: new Date().getFullYear()
            };

            await sendEmail({
                to: user.email,
                subject: title,
                html: path.join('templates', template),
                context
            });
        } catch (error) {
            logger.error('Error sending email notification:', { error, userId, type });
        }
    }

    getEmailTemplateForType(type) {
        switch (type) {
            case 'transaction':
                return 'transaction.html';
            case 'alert':
                return 'alert.html';
            default:
                return 'default.html';
        }
    }

    // Transaction notifications
    async notifyTransaction(transactionData) {
        if (!transactionData || !transactionData.type) {
            logger.error('Invalid transaction data for notification:', transactionData);
            return;
        }

        const title = this.getTransactionTitle(transactionData);
        const message = this.getTransactionMessage(transactionData);

        await this.createNotification(
            transactionData.userId,
            'transaction',
            title,
            message,
            {
                transactionId: transactionData.transactionId,
                amount: transactionData.amount,
                currency: transactionData.currency,
                type: transactionData.type,
                subtype: transactionData.subtype,
                recipientName: transactionData.recipientName,
                senderName: transactionData.senderName
            }
        );
    }

    getTransactionTitle(transaction) {
        if (!transaction) return 'Transaction Notification';

        const amount = Math.abs(transaction.amount).toFixed(2);
        const currency = transaction.currency || 'TND';

        switch (transaction.type) {
            case 'transfer':
                return transaction.subtype === 'send'
                    ? `notifications.types.transaction.title.sent`
                    : `notifications.types.transaction.title.received`;
            case 'bank':
                return transaction.subtype === 'deposit'
                    ? `notifications.types.transaction.title.deposited`
                    : `notifications.types.transaction.title.withdrawn`;
            default:
                return `notifications.types.transaction.title.default`;
        }
    }

    getTransactionMessage(transaction) {
        if (!transaction) return 'A transaction has been processed.';

        const amount = Math.abs(transaction.amount).toFixed(2);
        const currency = transaction.currency || 'TND';
        const recipient = transaction.recipientName ? ` to ${transaction.recipientName}` : '';
        const sender = transaction.senderName ? ` from ${transaction.senderName}` : '';

        switch (transaction.type) {
            case 'transfer':
                if (transaction.subtype === 'send') {
                    return `notifications.types.transaction.message.sent`;
                }
                return `notifications.types.transaction.message.received`;
            case 'bank':
                if (transaction.subtype === 'deposit') {
                    return `notifications.types.transaction.message.deposited`;
                }
                return `notifications.types.transaction.message.withdrawn`;
            default:
                return `notifications.types.transaction.message.default`;
        }
    }

    // Security notifications
    async notifySecurityAlert(userId, alertType, details) {
        const title = `notifications.types.security.title.${alertType}`;
        const message = this.getSecurityMessage(alertType, details);

        await this.createNotification(userId, 'alert', title, message, {
            alertType,
            ...details
        });
    }

    getSecurityMessage(alertType, details) {
        switch (alertType) {
            case 'login_attempt':
                return `notifications.types.security.message.login_attempt`;
            case 'password_change':
                return `notifications.types.security.message.password_change`;
            case 'two_factor':
                return `notifications.types.security.message.two_factor`;
            case 'account_locked':
                return `notifications.types.security.message.account_locked`;
            case 'login_success':
                return `notifications.types.security.message.login_success`;
            default:
                return `notifications.types.security.message.default`;
        }
    }

    // System notifications
    async notifySystemUpdate(userId, updateType, details) {
        const title = `notifications.types.system.title.${updateType}`;
        const message = this.getSystemMessage(updateType, details);

        await this.createNotification(userId, 'system', title, message, {
            updateType,
            ...details
        });
    }

    getSystemMessage(updateType, details) {
        switch (updateType) {
            case 'maintenance':
                return `notifications.types.system.message.maintenance`;
            case 'feature':
                return `notifications.types.system.message.feature`;
            case 'update':
                return `notifications.types.system.message.update`;
            default:
                return `notifications.types.system.message.default`;
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
                { read: true },
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
                { userId, read: false },
                { read: true }
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
                read: false
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