/**
 * Rate Limiter Middleware
 * @module rateLimiter
 * @description Configures rate limiting to prevent abuse on CMS endpoints.
 */
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_WINDOW_MS, API_RATE_LIMIT, UPLOAD_RATE_LIMIT } from '../constants/index.js';

/**
 * General API rate limiter — applies to all /api routes.
 */
export const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: API_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
    },
});

/**
 * Stricter limiter for file uploads — expensive operation.
 */
export const uploadLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: UPLOAD_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many upload requests, please try again later.',
        error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    },
});
