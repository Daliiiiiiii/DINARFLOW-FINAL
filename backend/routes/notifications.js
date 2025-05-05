import express from 'express';
import Notification from '../models/Notification.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { validateNotification } from '../middleware/validation.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// Get all notifications for a user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const notifications = await notificationService.getUserNotifications(req.user.id);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

// Get unread notifications count
router.get('/unread/count', authenticateToken, async (req, res) => {
    try {
        const count = await notificationService.getUnreadCount(req.user.id);
        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Error fetching unread count' });
    }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
    try {
        await notificationService.markAsRead(req.params.id, req.user.id);
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error marking notification as read' });
    }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.user.id);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Error marking all notifications as read' });
    }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await notificationService.deleteNotification(req.params.id, req.user.id);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Error deleting notification' });
    }
});

// Admin routes
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const notifications = await notificationService.getAllNotifications();
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching all notifications:', error);
        res.status(500).json({ message: 'Error fetching all notifications' });
    }
});

// Create notification (admin only)
router.post('/admin/create', authenticateToken, isAdmin, validateNotification, async (req, res) => {
    try {
        const notification = await notificationService.createNotification(req.body);
        res.status(201).json(notification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ message: 'Error creating notification' });
    }
});

// Update notification (admin only)
router.put('/admin/:id', authenticateToken, isAdmin, validateNotification, async (req, res) => {
    try {
        const notification = await notificationService.updateNotification(req.params.id, req.body);
        res.json(notification);
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ message: 'Error updating notification' });
    }
});

// Delete notification (admin only)
router.delete('/admin/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await notificationService.deleteNotification(req.params.id);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Error deleting notification' });
    }
});

export default router; 