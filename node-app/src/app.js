import express from 'express';
import morgan from 'morgan';
import config from './config/index.js';
import uploadRoutes from './routes/uploadRoutes.js';

/**
 * Express Application Configuration
 * @module app
 * @description Express application setup with middleware configuration, route definitions,
 * security headers, CORS settings, error handling, and health check endpoints.
 * Configures the complete Express application stack with proper middleware ordering
 */
function createApp() {
    const app = express();

    // Use morgan for HTTP request logging (prefixed for visibility in multi-node logs)
    app.use(morgan(`[:nodeId] :method :url :status :res[content-length] - :response-time ms`, {
        skip: (req, res) => req.url === '/health' // Skip health checks to keep logs clean
    }));
    
    // Register the nodeId token for morgan
    morgan.token('nodeId', () => config.nodeId);

    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'ok',
            nodeId: config.nodeId,
        });
    });

    // File upload route (protected)
    app.use('/', uploadRoutes);

    return app;
}

export default createApp;
