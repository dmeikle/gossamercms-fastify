/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
    await knex.schema.createTable('user_devices', (table) => {
        table.string('id', 36).primary().notNullable()
            .defaultTo(knex.raw('(UUID())'));
        table.string('userId', 36).nullable();
        table.string('firebaseToken', 500).nullable();
        table.string('platform', 20).nullable();
        table.string('deviceId', 255).nullable();
        table.string('appVersion', 50).nullable();
        table.boolean('active').nullable();
        table.timestamp('lastSeenAt').nullable();
        table.timestamp('createdAt').nullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').nullable();
        table.index('userId', 'idx_user_devices_user_id');
        table.foreign('userId', 'fk_user_devices_userId')
            .references('id').inTable('users').onDelete('RESTRICT');
    });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('user_devices');
}