/**
 * Database Migration Script
 * @module migrate
 * @description CLI script to execute the latest database migrations
 * using the Knex database client.
 */
import '../config/index.js';
import db from './knex.js';

async function run() {
  try {
    console.log('Running migrations...');
    await db.migrate.latest();
    console.log('Migrations complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
