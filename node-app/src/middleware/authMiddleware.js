/**
 * Authentication Middleware
 * @module authMiddleware
 * @description Middleware for validating API keys on protected routes within the Node application.
 */
import config from '../config/index.js';

const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = config.apiKey;

    if (!apiKey || apiKey !== expectedKey) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid API key',
        });
    }

    next();
};

export default authMiddleware;
