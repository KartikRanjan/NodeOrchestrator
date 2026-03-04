/**
 * CMS Server Entry Point
 * @module server
 * @description Entry point: runs migrations, starts the HTTP server, and injects io into services.
 */
import config from './config/index.js';
import createApp from './app.js';
import container from './container.js';
import logger from './utils/logger.js';
import db from './db/knex.js';

async function main() {
  try {
    // Run pending migrations before starting the server
    logger.info('Running database migrations...');
    await db.migrate.latest();
    logger.info('Migrations complete');

    const { httpServer, io } = createApp();

    container.bootstrapIo(io);

    // Start periodic stale node cleanup
    setInterval(() => {
      container.nodeService.cleanupStaleNodes(config.nodeHeartbeatThreshold)
        .catch((err) => logger.error('Stale node cleanup failed', { error: err.message }));
    }, config.nodeCleanupInterval * 1000);

    httpServer.listen(config.port, () => {
      logger.info(`CMS server listening on port ${config.port}`);
    });
  } catch (err) {
    logger.error('Failed to start CMS server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

main();
