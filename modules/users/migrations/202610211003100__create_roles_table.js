/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
    await knex.schema.createTable('roles', (table) => {
        table.string('id', 36).primary().notNullable();

        table.string('name', 50).notNullable();
        table.string('description', 100).nullable();

        table.boolean('isSystem').notNullable().defaultTo(false);

        table.timestamp('createdAt').nullable();
        table.timestamp('updatedAt').nullable();

        table.unique('name', {
            indexName: 'ux_roles_name',
        });
    });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('roles');
}