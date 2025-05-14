import Notification from '../models/Notification.js';
import logger from './logger.js';
import sendEmail from '../utils/email.js';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

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
                return 'transaction-notification.html';
            case 'alert':
                return 'alert-notification.html';
            default:
                return 'system-notification.html';
        }
    }

    // Transaction notifications
    async notifyTransaction(userId, transaction) {
        const title = this.getTransactionTitle(transaction);
        const message = this.getTransactionMessage(transaction);

        await this.createNotification(userId, 'transaction', title, message, {
            transactionId: transaction._id,
            amount: transaction.amount,
            currency: transaction.currency,
            type: transaction.type,
            subtype: transaction.subtype
        });
    }

    getTransactionTitle(transaction) {
        switch (transaction.type) {
            case 'transfer':
                return transaction.subtype === 'send'
                    ? 'Money Sent Successfully'
                    : 'Money Received';
            case 'bank':
                return transaction.subtype === 'deposit'
                    ? 'Bank Deposit Successful'
                    : 'Bank Withdrawal Successful';
            default:
                return 'Transaction Completed';
        }
    }

    getTransactionMessage(transaction) {
        const amount = Math.abs(transaction.amount).toFixed(2);
        const currency = transaction.currency;

        switch (transaction.type) {
            case 'transfer':
                return transaction.subtype === 'send'
                    ? `You have successfully sent ${amount} ${currency} to ${transaction.recipientName}`
                    : `You have received ${amount} ${currency} from ${transaction.senderName}`;
            case 'bank':
                return transaction.subtype === 'deposit'
                    ? `Your bank deposit of ${amount} ${currency} has been processed successfully`
                    : `Your bank withdrawal of ${amount} ${currency} has been processed successfully`;
            default:
                return `Transaction of ${amount} ${currency} has been completed`;
        }
    }

    // Security notifications
    async notifySecurityAlert(userId, alertType, details) {
        const title = 'Security Alert';
        const message = this.getSecurityMessage(alertType, details);

        await this.createNotification(userId, 'alert', title, message, {
            alertType,
            ...details
        });
    }

    getSecurityMessage(alertType, details) {
        switch (alertType) {
            case 'login_attempt':
                return `New login attempt from ${details.location} using ${details.device}`;
            case 'password_change':
                return 'Your password has been changed successfully';
            case 'two_factor':
                return 'Two-factor authentication has been ' + (details.enabled ? 'enabled' : 'disabled');
            case 'account_locked':
                return 'Your account has been temporarily locked due to multiple failed login attempts';
            case 'login_success':
                return 'A successful login was detected on your account';
            default:
                return details?.message || 'Security alert: ' + alertType;
        }
    }

    // System notifications
    async notifySystemUpdate(userId, updateType, details) {
        const title = 'System Update';
        const message = this.getSystemMessage(updateType, details);

        await this.createNotification(userId, 'system', title, message, {
            updateType,
            ...details
        });
    }

    getSystemMessage(updateType, details) {
        switch (updateType) {
            case 'maintenance':
                return `Scheduled maintenance on ${details.date}: ${details.message}`;
            case 'feature':
                return `New feature available: ${details.featureName}`;
            case 'update':
                return `System update: ${details.message}`;
            default:
                return details.message;
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