/**
 * Knex Configuration
 * @module knexfile
 * @description Configuration for Knex database migrations, seeds, and connection
 * settings across different environments.
 */
import path from 'path';
import { fileURLToPath } from 'url';

import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseConfig = {
  client: 'pg',
  connection: config.db.connectionString,
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
  },
};

/**
 * Knex configuration for PostgreSQL.
 */
const knexConfig = {
  development: {
    ...baseConfig,
  },
  production: {
    ...baseConfig,
    pool: { min: 2, max: 10 },
    // Setup SSL if required by your hosting provider
    // connection: { connectionString: config.db.connectionString, ssl: { rejectUnauthorized: false } }
  },
};

export default knexConfig;
