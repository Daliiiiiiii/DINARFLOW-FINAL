import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import {
    createTicket,
    getUserTickets,
    getTicket,
    addMessage,
    getAllTickets,
    updateTicketStatus,
    addAdminMessage
} from '../controllers/support.js';

const router = express.Router();

// User routes
router.post('/tickets', authenticateToken, createTicket);
router.get('/tickets', authenticateToken, getUserTickets);
router.get('/tickets/:ticketId', authenticateToken, getTicket);
router.post('/tickets/:ticketId/messages', authenticateToken, addMessage);
router.patch('/tickets/:ticketId/status', authenticateToken, updateTicketStatus);

// Admin routes
router.get('/admin/tickets', authenticateToken, isAdmin, getAllTickets);
router.post('/admin/tickets/:ticketId/messages', authenticateToken, isAdmin, addAdminMessage);
router.patch('/admin/tickets/:ticketId/status', authenticateToken, isAdmin, updateTicketStatus);

export default router; 