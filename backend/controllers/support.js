import SupportTicket from '../models/Support.js';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';

// Create a new support ticket
export const createTicket = async (req, res) => {
    try {
        const { subject } = req.body;
        const userId = req.user.id;

        const newTicket = new SupportTicket({
            userId,
            subject,
            messages: [{
                userId,
                content: req.body.message,
                type: 'user'
            }]
        });

        await newTicket.save();

        // Notify all admins and superadmins
        const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, notificationsEnabled: true });
        await Promise.all(admins.map(admin =>
            notificationService.createNotification(
                admin._id,
                'system',
                'New Support Ticket',
                `A new support ticket was created: ${subject}`,
                { ticketId: newTicket._id, subject }
            )
        ));

        // Emit WebSocket event to admin room
        const wsService = req.app.get('wsService');
        wsService.emitToRoom('admin', 'support:message:received', {
            ticket: newTicket,
            message: newTicket.messages[0]
        });

        res.status(201).json(newTicket);
    } catch (error) {
        res.status(500).json({ message: 'Error creating ticket', error: error.message });
    }
};

// Get all tickets for the current user
export const getUserTickets = async (req, res) => {
    try {
        const userId = req.user.id;
        const tickets = await SupportTicket.find({ userId })
            .sort({ updatedAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tickets', error: error.message });
    }
};

// Get a specific ticket
export const getTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user.id;

        const ticket = await SupportTicket.findOne({
            _id: ticketId,
            userId
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching ticket', error: error.message });
    }
};

// Add a message to a ticket
export const addMessage = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const ticket = await SupportTicket.findOne({
            _id: ticketId,
            userId
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.status === 'closed') {
            return res.status(400).json({ message: 'Cannot add message to closed ticket' });
        }

        const newMessage = {
            userId,
            content,
            type: 'user',
            timestamp: new Date()
        };

        ticket.messages.push(newMessage);
        await ticket.save();

        // Notify all admins and superadmins
        const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, notificationsEnabled: true });
        await Promise.all(admins.map(admin =>
            notificationService.createNotification(
                admin._id,
                'system',
                'New Support Message',
                `A new message was sent in ticket: ${ticket.subject}`,
                { ticketId: ticket._id, subject: ticket.subject, message: content }
            )
        ));

        // Emit WebSocket event
        const wsService = req.app.get('wsService');
        wsService.emitToUser(ticket.userId, 'support:message:received', {
            ticket,
            message: newMessage
        });
        wsService.emitToRoom('admin', 'support:message:received', {
            ticket,
            message: newMessage
        });

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error adding message', error: error.message });
    }
};

// Get all tickets (admin only)
export const getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find()
            .sort({ updatedAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all tickets', error: error.message });
    }
};

// Update ticket status
export const updateTicketStatus = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

        // For admin routes, don't check userId
        const query = isAdmin ? { _id: ticketId } : { _id: ticketId, userId };
        const ticket = await SupportTicket.findOne(query);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (!['open', 'in-progress', 'closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        ticket.status = status;
        await ticket.save();

        // Emit WebSocket event
        const wsService = req.app.get('wsService');
        // Emit to the ticket owner
        wsService.emitToUser(ticket.userId, 'support:message:received', {
            ticket,
            message: { type: 'system', content: `Ticket status updated to ${status}` }
        });
        // Emit to admin room
        wsService.emitToRoom('admin', 'support:message:received', {
            ticket,
            message: { type: 'system', content: `Ticket status updated to ${status}` }
        });

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error updating ticket status', error: error.message });
    }
};

// Add a message to a ticket (admin only)
export const addAdminMessage = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { content } = req.body;
        const adminId = req.user.id;

        const ticket = await SupportTicket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.status === 'closed') {
            return res.status(400).json({ message: 'Cannot add message to closed ticket' });
        }

        const newMessage = {
            userId: adminId,
            content,
            type: 'agent',
            timestamp: new Date()
        };

        ticket.messages.push(newMessage);
        await ticket.save();

        // Notify the ticket owner (user) about the admin reply
        await notificationService.createNotification(
            ticket.userId,
            'system',
            'Support Replied',
            content,
            { ticketId: ticket._id, subject: ticket.subject }
        );

        // Emit WebSocket event
        const wsService = req.app.get('wsService');
        wsService.emitToUser(ticket.userId, 'support:message:received', {
            ticket,
            message: newMessage
        });
        wsService.emitToRoom('admin', 'support:message:received', {
            ticket,
            message: newMessage
        });

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error adding message', error: error.message });
    }
};

export const uploadTicketImage = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const ticket = await SupportTicket.findOne({ _id: ticketId, userId });
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        if (ticket.status === 'closed') {
            return res.status(400).json({ message: 'Cannot add image to closed ticket' });
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        const newMessage = {
            userId,
            content: imageUrl,
            type: 'user',
            timestamp: new Date()
        };
        ticket.messages.push(newMessage);
        await ticket.save();
        // Emit WebSocket event
        const wsService = req.app.get('wsService');
        wsService.emitToUser(ticket.userId, 'support:message:received', {
            ticket,
            message: newMessage
        });
        wsService.emitToRoom('admin', 'support:message:received', {
            ticket,
            message: newMessage
        });
        res.json({ ticket, message: newMessage });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
}; 
