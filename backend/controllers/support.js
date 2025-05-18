import SupportTicket from '../models/support.js';

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

        // Emit WebSocket event
        const wsService = req.app.get('wsService');
        // Emit to the ticket owner
        wsService.emitToUser(ticket.userId, 'support:message:received', {
            ticket,
            message: newMessage
        });
        // Emit to admin room
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

        const ticket = await SupportTicket.findOne({
            _id: ticketId,
            userId
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (!['open', 'in-progress', 'closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        ticket.status = status;
        await ticket.save();
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

        // Emit WebSocket event
        const wsService = req.app.get('wsService');
        // Emit to the ticket owner
        wsService.emitToUser(ticket.userId, 'support:message:received', {
            ticket,
            message: newMessage
        });
        // Emit to admin room
        wsService.emitToRoom('admin', 'support:message:received', {
            ticket,
            message: newMessage
        });

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error adding message', error: error.message });
    }
}; 