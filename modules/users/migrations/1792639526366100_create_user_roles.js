/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
    await knex.schema.createTable('user_roles', (table) => {
        table.string('id', 36).primary().notNullable()
            .defaultTo(knex.raw('(UUID())'));
        table.string('userContextId', 36).notNullable();
        table.string('roleId', 36).notNullable();
        table.string('createdBy', 36).nullable();
        table.timestamp('createdAt').nullable().defaultTo(knex.fn.now());
        table.timestamp('expiresAt').nullable();
        table.index('userContextId', 'idx_user_roles_user_context_id');
        table.foreign('userContextId', 'fk_user_roles_userContextId')
            .references('id').inTable('user_contexts').onDelete('RESTRICT');
        table.index('roleId', 'idx_user_roles_role_id');
        table.foreign('roleId', 'fk_user_roles_roleId')
            .references('id').inTable('roles').onDelete('RESTRICT');
        table.index('createdBy', 'idx_user_roles_created_by');
        table.foreign('createdBy', 'fk_user_roles_createdBy')
            .references('id').inTable('users').onDelete('RESTRICT');
    });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('user_roles');
}