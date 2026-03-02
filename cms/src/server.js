import config from './config/index.js';
import createApp from './app.js';
import logger from './utils/logger.js';

/**
 * CMS Server Entry Point.
 *
 * 1. Creates the Express app
 * 2. Starts listening on the configured port
 */
async function main() {
    try {
        const { httpServer } = createApp();

        httpServer.listen(config.port, () => {
            logger.info(`CMS server listening on port ${config.port}`);
        });
    } catch (err) {
        logger.error('Failed to start CMS server', { error: err.message, stack: err.stack });
        process.exit(1);
    }
}

main();
