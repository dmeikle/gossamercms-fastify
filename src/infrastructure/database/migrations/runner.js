import 'dotenv/config';

const migrationDirectories = [
    './src/modules/users/migrations',
    // './src/modules/organizations/migrations',
];

export default {
    development: {
        client: 'mysql2',
        connection: {
            host: process.env.DB_HOST ?? 'localhost',
            port: Number(process.env.DB_PORT ?? 3306),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        },
        migrations: {
            // Knex expects a directory for its migration source.
            directory: migrationDirectories,
            tableName: 'knex_migrations',
            loadExtensions: ['.js'],
        },
    },
};