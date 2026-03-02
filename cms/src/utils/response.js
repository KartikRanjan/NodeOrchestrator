/**
 * API Response Utility
 * @module response
 * @description Standardizes the structure of all API responses, ensuring consistency
 * across success and error paths.
 */

/**
 * Send a success response
 * @param {Object} params - Response parameters
 * @param {Object} params.res - Express response object
 * @param {Object} [params.data={}] - Response data
 * @param {string} [params.message='Operation successful'] - Success message
 * @param {number} [params.statusCode=200] - HTTP status code
 */
export const success = ({ res, data = {}, message = 'Operation successful', statusCode = 200 }) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send an error response (used primarily by the global error handler)
 * @param {Object} params - Error parameters
 * @param {Object} params.res - Express response object
 * @param {string} [params.message='An unexpected error occurred'] - Error message
 * @param {number} [params.statusCode=500] - HTTP status code
 * @param {string} [params.errorCode='INTERNAL_ERROR'] - Application-specific error code
 */
export const error = ({
  res,
  message = 'An unexpected error occurred',
  statusCode = 500,
  errorCode = 'INTERNAL_ERROR',
}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: errorCode,
    timestamp: new Date().toISOString(),
  });
};

export default {
  success,
  error,
};
