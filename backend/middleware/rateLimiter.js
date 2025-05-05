import rateLimit from 'express-rate-limit';
import process from 'process';
import { logRateLimit } from '../services/logger.js';

const createRateLimiter = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next, options) => {
            logRateLimit('exceeded', {
                ip: req.ip,
                userId: req.user?.id,
                path: req.originalUrl,
                limit: options.max,
                windowMs: options.windowMs,
                remaining: res.getHeader('X-RateLimit-Remaining'),
                reset: res.getHeader('X-RateLimit-Reset')
            });
            res.status(429).json({
                error: 'Too Many Requests',
                message: options.message
            });
        }
    };

    return rateLimit({
        ...defaultOptions,
        ...options
    });
};

// API rate limiter
export const apiLimiter = createRateLimiter({
    windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 1 * 60 * 1000, // 15 minutes in prod, 1 minute in dev
    max: process.env.NODE_ENV === 'production' ? 100 : 1000 // 100 in prod, 1000 in dev
});

// Auth rate limiter (more strict)
export const authLimiter = createRateLimiter({
    windowMs: process.env.NODE_ENV === 'production' ? 60 * 60 * 1000 : 1 * 60 * 1000, // 1 hour in prod, 1 minute in dev
    max: process.env.NODE_ENV === 'production' ? 5 : 100, // 5 in prod, 100 in dev
    message: 'Too many login attempts, please try again later'
});

// Upload rate limiter
export const uploadLimiter = createRateLimiter({
    windowMs: process.env.NODE_ENV === 'production' ? 60 * 60 * 1000 : 5 * 60 * 1000, // 1 hour in prod, 5 minutes in dev
    max: process.env.NODE_ENV === 'production' ? 10 : 50, // 10 in prod, 50 in dev
    message: 'Upload limit reached, please try again later'
});

export default createRateLimiter;