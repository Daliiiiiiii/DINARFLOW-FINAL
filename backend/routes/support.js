import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';
import {
    createTicket,
    getUserTickets,
    getTicket,
    addMessage,
    getAllTickets,
    updateTicketStatus,
    addAdminMessage,
    uploadTicketImage
} from '../controllers/support.js';

const router = express.Router();

// User routes
router.post('/tickets', authenticateToken, createTicket);
router.get('/tickets', authenticateToken, getUserTickets);
router.get('/tickets/:ticketId', authenticateToken, getTicket);
router.post('/tickets/:ticketId/messages', authenticateToken, addMessage);
router.patch('/tickets/:ticketId/status', authenticateToken, updateTicketStatus);
router.post('/tickets/:ticketId/upload-image', authenticateToken, uploadImage('image'), uploadTicketImage);

// Admin routes
router.get('/admin/tickets', authenticateToken, isAdmin, getAllTickets);
router.post('/admin/tickets/:ticketId/messages', authenticateToken, isAdmin, addAdminMessage);
router.patch('/admin/tickets/:ticketId/status', authenticateToken, isAdmin, updateTicketStatus);

export default router; 