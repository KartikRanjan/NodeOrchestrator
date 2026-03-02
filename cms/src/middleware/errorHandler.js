import logger from '../utils/logger.js';

/**
 * Centralized error-handling middleware.
 *
 * Catches errors forwarded via next(err) from controllers.
 * Logs the error and returns a consistent JSON response.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    logger.error('Unhandled error', {
        statusCode,
        message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
    });

    res.status(statusCode).json({
        error: statusCode >= 500 ? 'Internal Server Error' : message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

export default errorHandler;
