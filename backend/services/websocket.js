import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import process from 'process';
import Message from '../models/Message.js';
import Order from '../models/Order.js';

let io = null;

export const getIO = () => io;

class WebSocketService {
    constructor(server) {
        io = new Server(server, {
            cors: {
                origin: process.env.NODE_ENV === 'production'
                    ? process.env.FRONTEND_URL
                    : ['http://localhost:5174', 'http://localhost:5173'],
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.io = io;
        this.initialize();
    }

    initialize() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    console.log('No token provided for WebSocket connection');
                    return next(new Error('Authentication error'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId);

                if (!user) {
                    console.log('User not found for WebSocket connection:', decoded.userId);
                    return next(new Error('User not found'));
                }

                socket.user = user;
                console.log('WebSocket authentication successful for user:', user.email);
                next();
            } catch (error) {
                console.error('WebSocket authentication error:', error.message);
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', async (socket) => {
            try {
                console.log(`User connected: ${socket.user.email}`);

                // Update user's online status
                await User.findByIdAndUpdate(socket.user._id, {
                    isOnline: true,
                    lastSeen: new Date()
                }, { new: true }).exec();

                // Join user's room
                socket.join(`user:${socket.user._id}`);

                // If user is admin, join admin room
                if (['admin', 'superadmin'].includes(socket.user.role)) {
                    socket.join('admin');
                }

                // Notify admins about user's online status
                this.io.to('admin').emit('user:status', {
                    userId: socket.user._id,
                    isOnline: true,
                    lastSeen: new Date()
                });

                // Handle transaction updates
                socket.on('transaction:update', (data) => {
                    this.emitToUser(socket.user._id, 'transaction:updated', data);
                });

                // Handle balance updates
                socket.on('balance:update', (data) => {
                    this.emitToUser(socket.user._id, 'balance:updated', data);
                });

                // Handle notification updates
                socket.on('notification:update', (data) => {
                    // Emit to both buyer and seller if it's an order notification
                    if (data.type === 'transaction' && data.orderId) {
                        // Get the order to find buyer and seller
                        Order.findById(data.orderId)
                            .then(order => {
                                if (order) {
                                    // Emit to buyer
                                    this.emitToUser(order.buyer.toString(), 'notification:received', {
                                        notification: {
                                            type: data.type,
                                            title: data.title,
                                            message: data.message,
                                            data: data.data,
                                            read: false,
                                            createdAt: new Date()
                                        }
                                    });
                                    // Emit to seller
                                    this.emitToUser(order.seller.toString(), 'notification:received', {
                                        notification: {
                                            type: data.type,
                                            title: data.title,
                                            message: data.message,
                                            data: data.data,
                                            read: false,
                                            createdAt: new Date()
                                        }
                                    });
                                }
                            })
                            .catch(error => {
                                console.error('Error finding order for notification:', error);
                            });
                    } else {
                        // For non-order notifications, emit to the user's room
                        this.emitToUser(socket.user._id, 'notification:received', data);
                    }
                });

                // Handle order room joining
                socket.on('join:room', (orderId) => {
                    console.log(`User ${socket.user.email} joining order room: ${orderId}`);
                    socket.join(orderId);
                });

                // Handle order messages
                socket.on('newMessage', (message) => {
                    console.log('New message received:', message);
                    // Broadcast to the order room
                    this.io.to(message.orderId).emit('newMessage', message);
                });

                // Handle support ticket message updates
                socket.on('support:message', (data) => {
                    // Emit to the ticket owner
                    this.emitToUser(data.ticket.userId, 'support:message:received', data);
                    // Emit to admin room if message is from user
                    if (data.message.type === 'user') {
                        this.emitToRoom('admin', 'support:message:received', data);
                    }
                });

                // Handle disconnect
                socket.on('disconnect', async (reason) => {
                    console.log(`User disconnected: ${socket.user.email}, reason: ${reason}`);

                    try {
                        // Update user's online status
                        await User.findByIdAndUpdate(socket.user._id, {
                            isOnline: false,
                            lastSeen: new Date()
                        }, { new: true }).exec();

                        // Notify admins about user's offline status
                        this.io.to('admin').emit('user:status', {
                            userId: socket.user._id,
                            isOnline: false,
                            lastSeen: new Date()
                        });
                    } catch (error) {
                        console.error('Error updating user status on disconnect:', error);
                    }
                });
            } catch (error) {
                console.error('Error in WebSocket connection handler:', error);
            }
        });
    }

    // Emit to specific user
    emitToUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
    }

    // Emit to all users
    emitToAll(event, data) {
        this.io.emit(event, data);
    }

    // Emit to specific room
    emitToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }
}

export default WebSocketService; 