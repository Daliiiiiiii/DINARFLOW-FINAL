import express from 'express';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateNotification } from '../middleware/validation.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching notifications' });
    }
});

// Get unread notifications count
router.get('/unread/count', authenticateToken, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user._id,
            read: false
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching unread notifications count' });
    }
});

// Mark notification as read
router.patch('/:notificationId/read', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.notificationId, userId: req.user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Error marking notification as read' });
    }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, read: false },
            { read: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Error marking all notifications as read' });
    }
});

// Delete a notification
router.delete('/:notificationId', authenticateToken, async (req, res) => {
    try {
        const notification = await notificationService.deleteNotification(
            req.user._id,
            req.params.notificationId
        );
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete all notifications
router.delete('/', authenticateToken, async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.user._id });
        res.json({ message: 'All notifications deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting notifications' });
    }
});

export default router; 