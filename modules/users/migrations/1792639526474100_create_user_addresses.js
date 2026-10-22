/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
    await knex.schema.createTable('user_addresses', (table) => {
        table.string('id', 36).primary().notNullable()
            .defaultTo(knex.raw('(UUID())'));
        table.string('userId', 36).notNullable();
        table.string('type', 50).notNullable();
        table.string('address1', 255).notNullable();
        table.string('address2', 255).nullable();
        table.string('city', 100).nullable();
        table.string('stateProvince', 100).nullable();
        table.string('postalCode', 20).nullable();
        table.string('countryCode', 10).nullable();
        table.boolean('isDefault').notNullable().defaultTo(false);
        table.boolean('isBilling').notNullable().defaultTo(false);
        table.index('userId', 'idx_user_addresses_user_id');
        table.foreign('userId', 'fk_user_addresses_userId')
            .references('id').inTable('users').onDelete('RESTRICT');
    });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('user_addresses');
}