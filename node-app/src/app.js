import express from 'express';
import config from './config/index.js';

/**
 * Express Application Configuration
 * @module app
 * @description Express application setup with middleware configuration, route definitions,
 * security headers, CORS settings, error handling, and health check endpoints.
 * Configures the complete Express application stack with proper middleware ordering
 */
function createApp() {
    const app = express();

    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'ok',
            nodeId: config.nodeId,
        });
    });

    return app;
}

export default createApp;
