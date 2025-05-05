import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import process from 'process';

class WebSocketService {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.NODE_ENV === 'production'
                    ? process.env.FRONTEND_URL
                    : 'http://localhost:5173',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.initialize();
    }

    initialize() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId);

                if (!user) {
                    return next(new Error('User not found'));
                }

                socket.user = user;
                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`User connected: ${socket.user.email}`);

            // Join user's room
            socket.join(`user:${socket.user._id}`);

            // Handle transaction updates
            socket.on('transaction:update', (data) => {
                this.emitToUser(socket.user._id, 'transaction:updated', data);
            });

            // Handle balance updates
            socket.on('balance:update', (data) => {
                this.emitToUser(socket.user._id, 'balance:updated', data);
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.user.email}`);
            });
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