/**
 * Database Rollback Script
 * @module rollback
 * @description CLI script to roll back the most recent database migration
 * using the Knex database client.
 */
import '../config/index.js';
import db from './knex.js';

async function run() {
  try {
    console.log('Rolling back migrations...');
    await db.migrate.rollback();
    console.log('Rollback complete');
    process.exit(0);
  } catch (err) {
    console.error('Rollback failed:', err);
    process.exit(1);
  }
}

run();
