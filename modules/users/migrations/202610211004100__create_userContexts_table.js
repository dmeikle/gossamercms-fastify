/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
    await knex.schema.createTable('user_contexts', (table) => {
        table.string('id', 36).primary().notNullable();

        table.string('userId', 50).notNullable();
        table.string('contextType', 50).notNullable();
        table.json('metadata').notNullable();
        table.string('ipAddress', 15).nullable();

        table.boolean('isDefault').nullable().defaultTo(false);

        table.string('roleId', 36).notNullable();

        table.timestamp('createdAt').notNullable()
            .defaultTo(knex.fn.now());

        table.timestamp('deletedAt').nullable();
        table.timestamp('updatedAt').nullable();

        table.string('createdBy', 36).notNullable();
        table.string('deletedBy', 36).nullable();
        table.string('updatedBy', 36).nullable();

        table
            .foreign('userId', 'fk_user_contexts_user')
            .references('id')
            .inTable('users')
            .onDelete('RESTRICT');

        table
            .foreign('roleId', 'fk_user_contexts_role')
            .references('id')
            .inTable('roles')
            .onDelete('RESTRICT');

        table.index('userId', 'idx_user_contexts_user_id');
        table.index('roleId', 'idx_user_contexts_role_id');
        table.index('contextType', 'idx_user_contexts_context_type');
    });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('user_contexts');
}