/**
 * Node App Server Entry Point
 * @module server
 * @description Bootstraps the Node application, starts the HTTP server, 
 * and handles registration with the central CMS.
 */
import config from './config/index.js';
import createApp from './app.js';
import { registerWithCMS, disconnectFromCMS } from './services/registrationService.js';

async function main() {
    const app = createApp();

    const server = app.listen(config.port, async () => {
        console.log(`[${config.nodeId}] Node App listening on port ${config.port}`);

        // Initial registration with retry logic
        const register = async () => {
            try {
                await registerWithCMS();
            } catch {
                const RETRY_DELAY = 5000;
                console.warn(`[${config.nodeId}] CMS registration failed — retrying in ${RETRY_DELAY / 1000}s...`);
                setTimeout(register, RETRY_DELAY);
            }
        };

        register();
    });

    // Graceful shutdown — notify CMS before exiting
    const shutdown = async (signal) => {
        console.log(`[${config.nodeId}] Received ${signal}, shutting down...`);
        await disconnectFromCMS();
        server.close(() => {
            console.log(`[${config.nodeId}] Server closed`);
            process.exit(0);
        });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
