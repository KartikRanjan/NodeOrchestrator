/**
 * Knex Configuration
 * @module knexfile
 * @description Configuration for Knex database migrations, seeds, and connection
 * settings. PostgreSQL is the only supported database.
 */
import path from 'path';
import { fileURLToPath } from 'url';

import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const knexConfig = {
  development: {
    client: 'pg',
    connection: config.db.connectionString,
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
    },
    pool: { min: 2, max: 10 },
  },

  production: {
    client: 'pg',
    connection: config.db.connectionString,
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
    },
    pool: { min: 2, max: 10 },
  },
};

export default knexConfig;
