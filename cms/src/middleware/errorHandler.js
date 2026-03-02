/**
 * Global Error Handler Middleware
 * @module errorHandler
 * @description Centralized middleware for catching and formatting application errors,
 * ensuring standardized API error responses.
 */
import logger from '../utils/logger.js';
import { error as errorResponse } from '../utils/response.js';

/**
 * Handle errors globally across the CMS service.
 * Logs error details and returns a standardized response structure.
 *
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} _next - Express next function
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Log error for internal tracking
  logger.error('Error encountered', {
    message,
    statusCode,
    errorCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  return errorResponse({
    res,
    message,
    statusCode,
    errorCode,
  });
};

export default errorHandler;
