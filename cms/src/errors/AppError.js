/**
 * Custom Application Error
 * @class AppError
 * @extends Error
 * @description Standardized error class for application-specific exceptions,
 * supporting HTTP status codes and semantic error identifiers.
 */
class AppError extends Error {
  /**
   * Create an AppError
   * @param {Object} params - Error parameters
   * @param {string} params.message - Error message
   * @param {number} [params.statusCode=500] - HTTP status code
   * @param {string} [params.errorCode='INTERNAL_ERROR'] - Application-specific error code
   */
  constructor({ message, statusCode = 500, errorCode = 'INTERNAL_ERROR' }) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
