/**
 * Authentication Middleware
 * @module authMiddleware
 * @description Middleware for validating API keys on protected routes.
 * Ensures that only authorized node applications can access CMS orchestration endpoints.
 */
import config from '../config/index.js';
import AppError from '../errors/AppError.js';

/**
 * Validates the API key provided in the request headers.
 * Throws an AppError if the key is missing or invalid.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = config.apiKey;

  if (!apiKey || apiKey !== expectedKey) {
    return next(
      new AppError({
        message: 'Missing or invalid API key',
        statusCode: 401,
        errorCode: 'UNAUTHORIZED',
      }),
    );
  }

  next();
};

export default authMiddleware;
