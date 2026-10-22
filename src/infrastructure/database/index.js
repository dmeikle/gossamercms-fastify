
import mysql from 'mysql2/promise';

let pool;

/**
 * Create the shared MySQL connection pool.
 *
 * @returns {Promise<import('mysql2/promise').Pool>}
 */
export async function createDatabase() {
    if (pool) {
        return pool;
    }

    const config = process.env.DATABASE_URL
        ? {
            uri: process.env.DATABASE_URL,
        }
        : {
            host: process.env.DB_HOST ?? 'localhost',
            port: Number(process.env.DB_PORT ?? 3306),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        };

    const options = {
        ...config,
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_POOL_MAX ?? 10),
        maxIdle: Number(process.env.DB_POOL_MAX_IDLE ?? 2),
        idleTimeout: 30_000,
        queueLimit: 0,
        enableKeepAlive: true,
        timezone: 'Z',
    };

    pool = mysql.createPool(options);

    try {
        const connection = await pool.getConnection();

        try {
            await connection.query('SELECT 1');
        } finally {
            connection.release();
        }

        console.info('MySQL connection pool initialized');

        return pool;
    } catch (error) {
        await pool.end().catch(() => {});
        pool = undefined;

        throw new Error('Failed to connect to MySQL', {
            cause: error,
        });
    }
}

/**
 * Close the shared MySQL connection pool.
 *
 * @param {import('mysql2/promise').Pool} database
 */
export async function closeDatabase(database = pool) {
    if (!database) return;

    await database.end();

    if (database === pool) {
        pool = undefined;
    }
}
