/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
    await knex.schema.createTable('user_telephone', (table) => {
        table.string('id', 36).primary().notNullable()
            .defaultTo(knex.raw('(UUID())'));
        table.string('userId', 36).nullable();
        table.string('countryCode', 3).nullable();
        table.string('numberRaw', 15).nullable();
        table.string('numberE164', 15).nullable();
        table.string('type', 20).nullable();
        table.boolean('verified').nullable();
        table.boolean('smsOptIn').nullable();
        table.boolean('preferred').nullable();
        table.string('extension', 10).nullable();
        table.timestamp('createdAt').nullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').nullable();
        table.timestamp('deletedAt').nullable();
        table.string('createdBy', 36).nullable();
        table.string('updatedBy', 36).nullable();
        table.string('deletedBy', 36).nullable();
        table.index('userId', 'idx_user_telephone_user_id');
        table.foreign('userId', 'fk_user_telephone_userId')
            .references('id').inTable('users').onDelete('RESTRICT');
    });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('user_telephone');
}