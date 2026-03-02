/**
 * CMS Server Entry Point
 * @module server
 * @description Bootstraps the CMS Express application, initializes the database connection,
 * and starts the HTTP server on the configured port.
 */
import config from './config/index.js';
import createApp from './app.js';
import logger from './utils/logger.js';
import db from './db/knex.js';

async function main() {
  try {
    // Run pending migrations before starting the server
    logger.info('Running database migrations...');
    await db.migrate.latest();
    logger.info('Migrations complete');

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
