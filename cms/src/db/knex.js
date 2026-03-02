/**
 * Knex Database Client
 * @module knex
 * @description Initializes and exports a singleton instance of the Knex query builder,
 * configured for the current environment.
 */
import knex from 'knex';

import knexConfig from './knexfile.js';

const environment = process.env.NODE_ENV || 'development';

const db = knex(knexConfig[environment]);

export default db;
