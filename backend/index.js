import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import WebSocketService from './services/websocket.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import connectDB from './config/database.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import transactionRoutes from './routes/transactions.js';
import kycRoutes from './routes/kyc.js';
import notificationRoutes from './routes/notifications.js';
import fileRoutes from './routes/files.js';
import bankAccountRoutes from './routes/bankAccounts.js';
import adminRoutes from './routes/admin.js';
import testRoutes from './routes/test.js';
import supportRoutes from './routes/support.js';
import walletRoutes from './routes/walletRoutes.js';
import { default as p2pRoutes } from './routes/p2pRoutes.js';
import settingsRoutes from './routes/settings.js';

dotenv.config();

// Debug environment variables
console.log('Environment variables loaded:');
console.log('ETH_RPC_URL:', process.env.ETH_RPC_URL);
console.log('BSC_RPC_URL:', process.env.BSC_RPC_URL);
console.log('TRON_RPC_URL:', process.env.TRON_RPC_URL);
console.log('TON_RPC_URL:', process.env.TON_RPC_URL);
console.log('SOLANA_RPC_URL:', process.env.SOLANA_RPC_URL);
console.log('POLYGON_RPC_URL:', process.env.POLYGON_RPC_URL);
console.log('ARBITRUM_RPC_URL:', process.env.ARBITRUM_RPC_URL);
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '***' : 'undefined');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : 'undefined');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const server = createServer(app);

// Initialize WebSocket
const wsService = new WebSocketService(server);

// Make WebSocket service available in routes
app.set('wsService', wsService);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
      mediaSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS configuration
const allowedOrigins = [
  'http://localhost:5174',
  'http://localhost:5173',
  'https://dinarrflow.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Other middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Static files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test', testRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/p2p', p2pRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// MongoDB connection states
const MONGO_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// MongoDB connection test endpoint
app.get('/test-mongodb', async (req, res) => {
  try {
    // Check connection state
    const currentState = MONGO_STATES[mongoose.connection.readyState] || 'unknown';

    // If not connected, try to connect
    if (currentState !== 'connected') {
      await mongoose.connect('mongodb+srv://Dali:O74MGyE6gQxfNzBg@cluster0.u32xgcm.mongodb.net/', {
        serverSelectionTimeoutMS: 5000, // Faster timeout for testing
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000
      });
    }

    // Get database info
    const db = mongoose.connection;
    const collections = await db.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    res.json({
      status: 'success',
      connection: {
        state: currentState,
        database: db.name,
        host: db.host,
        port: db.port
      },
      collections: collectionNames
    });
  } catch (error) {
    console.error('MongoDB Test Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      connectionState: MONGO_STATES[mongoose.connection.readyState] || 'unknown',
      details: {
        name: error.name,
        code: error.code,
        codeName: error.codeName
      }
    });
  }
});

// Connect to MongoDB
connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token or authentication failed'
    });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'A record with this value already exists'
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MongoDB test: http://localhost:${PORT}/test-mongodb`);
});