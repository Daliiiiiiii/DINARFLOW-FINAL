import { logger } from '../services/logger.js';

export const errorHandler = (err, req, res) => {
    // Log the error with detailed information
    logger.error('Unhandled error', {
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
            code: err.code
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            query: req.query,
            body: req.body,
            headers: req.headers,
            userId: req.user?.id
        }
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.errors
        });
    }

    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        if (err.code === 11000) {
            return res.status(409).json({
                error: 'Duplicate Key Error',
                message: 'A record with this key already exists'
            });
        }
        return res.status(500).json({
            error: 'Database Error',
            message: 'An error occurred while accessing the database'
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Authentication Error',
            message: 'Invalid token provided'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Authentication Error',
            message: 'Token has expired'
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500
        ? 'An unexpected error occurred'
        : err.message;

    res.status(statusCode).json({
        error: err.name || 'Internal Server Error',
        message
    });
}; 