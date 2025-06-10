import winston from 'winston';
import process from 'process';

const { combine, timestamp, printf, colorize } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let meta = '';
    if (Object.keys(metadata).length > 0) {
        meta = `\n\tMetadata: ${JSON.stringify(metadata, null, 2)}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}${meta}`;
});

// Create logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        // Console transport with colors in development
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp(),
                logFormat
            )
        }),
        // File transport for all logs
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Separate file for error logs
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Separate file for rate limit logs
        new winston.transports.File({
            filename: 'logs/rate-limits.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: combine(
                timestamp(),
                printf(({ level, message, timestamp, ...metadata }) => {
                    return `${timestamp} [${level.toUpperCase()}] RATE LIMIT: ${message}\n\tMetadata: ${JSON.stringify(metadata, null, 2)}`;
                })
            )
        })
    ]
});

// Create a stream object for Morgan
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id
        };

        if (res.statusCode >= 400) {
            logger.warn(message, logData);
        } else {
            logger.info(message, logData);
        }
    });

    next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
    logger.error('Unhandled error', {
        error: {
            message: err.message,
            stack: err.stack
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            body: req.body,
            userId: req.user?.id
        }
    });

    next(err);
};

// Rate limit logging helper
const logRateLimit = (type, data) => {
    const transport = logger.transports.find(t => t.filename === 'logs/rate-limits.log');
    if (transport) {
        transport.write({
            level: type === 'exceeded' ? 'warn' : 'error',
            message: `Rate limit ${type}`,
            ...data
        });
    }
};

export { logger as default, requestLogger, errorLogger, logRateLimit }; 