/**
 * Application Constants
 * @module constants
 * @description Centralized constants for the CMS service.
 */

// Maximum number of concurrent file propagation requests to nodes.
export const PROPAGATION_CONCURRENCY = 10;

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const API_RATE_LIMIT = 100;                    // General API: 100 req/window
export const UPLOAD_RATE_LIMIT = 20;                  // File uploads: 20 req/window
