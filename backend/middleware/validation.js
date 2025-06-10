import { body } from 'express-validator';

export const validateNotification = [
    body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isString()
        .withMessage('Title must be a string')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),

    body('message')
        .notEmpty()
        .withMessage('Message is required')
        .isString()
        .withMessage('Message must be a string')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Message must be between 10 and 1000 characters'),

    body('type')
        .notEmpty()
        .withMessage('Type is required')
        .isString()
        .withMessage('Type must be a string')
        .isIn(['info', 'warning', 'error', 'success'])
        .withMessage('Invalid notification type'),

    body('userId')
        .optional()
        .isMongoId()
        .withMessage('Invalid user ID format'),

    body('isRead')
        .optional()
        .isBoolean()
        .withMessage('isRead must be a boolean'),

    body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object')
]; 