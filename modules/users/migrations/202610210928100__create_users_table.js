import { randomUUID } from 'node:crypto';

/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
    await knex.schema.createTable('users', (table) => {
        table.string('id', 36).primary().notNullable()
            .defaultTo(knex.raw('(UUID())'));

        table.string('firstname', 100).notNullable();
        table.string('lastname', 100).notNullable();

        table.timestamp('createdAt').notNullable()
            .defaultTo(knex.fn.now());

        table.timestamp('updatedAt').nullable();
        table.timestamp('deletedAt').nullable();

        table.string('createdBy', 36).nullable();
        table.string('updatedBy', 36).nullable();
        table.string('deletedBy', 36).nullable();

        table.index('deletedAt', 'idx_users_deleted_at');
        table.index('createdBy', 'idx_users_created_by');
    });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('users');
}