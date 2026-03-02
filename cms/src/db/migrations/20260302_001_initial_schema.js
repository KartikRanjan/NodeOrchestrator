/**
 * Initial Schema Migration
 * @module 20260302_001_initial_schema
 * @description Defines the initial database schema for the CMS,
 * including nodes, file uploads, and status tracking tables.
 */
export async function up(knex) {
  // --- nodes ---
  await knex.schema.createTable('nodes', (table) => {
    table.increments('id').primary();
    table.string('node_id', 100).notNullable().unique();
    table.string('ip', 45).notNullable();
    table.integer('port').notNullable();
    table.string('status', 20).notNullable().defaultTo('connected');
    table.timestamp('registered_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // --- file_uploads ---
  await knex.schema.createTable('file_uploads', (table) => {
    table.increments('id').primary();
    table.string('filename', 255).notNullable();
    table.timestamp('uploaded_at').defaultTo(knex.fn.now());
  });

  // --- node_upload_status ---
  await knex.schema.createTable('node_upload_status', (table) => {
    table.increments('id').primary();
    table
      .integer('file_upload_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('file_uploads')
      .onDelete('CASCADE');
    table
      .string('node_id', 100)
      .notNullable()
      .references('node_id')
      .inTable('nodes')
      .onDelete('CASCADE');
    table.string('status', 20).notNullable().defaultTo('pending');
    table.text('error_message').nullable();
    table.timestamp('completed_at').nullable();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('node_upload_status');
  await knex.schema.dropTableIfExists('file_uploads');
  await knex.schema.dropTableIfExists('nodes');
}
