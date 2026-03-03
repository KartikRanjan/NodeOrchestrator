/**
 * Node App Server Entry Point
 * @module server
 * @description Bootstraps the Node application, starts the HTTP server
 */
import config from './config/index.js';
import createApp from './app.js';

async function main() {
    const app = createApp();

    const server = app.listen(config.port, async () => {
        console.log(`[${config.nodeId}] Node App listening on port ${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
        console.log(`[${config.nodeId}] Received ${signal}, shutting down...`);
        server.close(() => {
            console.log(`[${config.nodeId}] Server closed`);
            process.exit(0);
        });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
