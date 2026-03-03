/**
 * @module server
 * @description Bootstraps the Node application, starts the HTTP server, 
 * and handles registration with the central CMS.
 */

import config from './config/index.js';
import createApp from './app.js';
import {
    registerWithCMS,
    disconnectFromCMS,
    connectSocket,
    disconnectSocket,
} from './services/registrationService.js';

// Graceful shutdown — cleanup and notify CMS
const shutdown = async (signal, server) => {
    console.log(`[${config.nodeId}] Received ${signal}, starting graceful shutdown...`);

    disconnectSocket();

    try {
        await disconnectFromCMS();
    } catch (err) {
        console.error(`[${config.nodeId}] Error during CMS disconnect:`, err.message);
    }

    if (server) {
        server.close(() => {
            console.log(`[${config.nodeId}] Server closed. Exiting process.`);
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
};

async function main() {
    const app = createApp();

    const server = app.listen(config.port, () => {
        console.log(`[${config.nodeId}] Node App listening on port ${config.port}`);

        const register = async () => {
            try {
                await registerWithCMS();
                connectSocket();
            } catch (err) {
                const RETRY_DELAY = 5000;
                console.warn(`[${config.nodeId}] CMS registration failed — retrying in ${RETRY_DELAY / 1000}s...`);
                setTimeout(register, RETRY_DELAY);
            }
        };

        register();
    });

    // Listen for signals and pass the server instance
    process.on('SIGINT', () => shutdown('SIGINT', server));
    process.on('SIGTERM', () => shutdown('SIGTERM', server));

    // Keep the process alive
    process.stdin.resume();
}

main().catch(err => {
    console.error('Fatal error in main:', err);
    process.exit(1);
});
