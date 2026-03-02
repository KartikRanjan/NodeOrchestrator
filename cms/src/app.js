import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Middleware
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';

/**
 * Create and configure the Express application.
 *
 * @description App setup, middleware registration, route mounting, and Socket.IO configuration.
 */
function createApp() {
    const app = express();
    const httpServer = createServer(app);

    // Socket.IO — CMS ↔ Frontend only
    const io = new SocketIOServer(httpServer, {
        cors: { origin: '*' },
    });

    // Global middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Health check
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', service: 'cms' });
    });

    // Error handling (must be last)
    app.use(errorHandler);

    // Socket.IO events
    io.on('connection', (socket) => {
        logger.info('Frontend client connected', { socketId: socket.id });

        socket.on('disconnect', () => {
            logger.info('Frontend client disconnected', { socketId: socket.id });
        });
    });

    // Attach io to app so services can emit events later
    app.set('io', io);

    return { app, httpServer, io };
}

export default createApp;
