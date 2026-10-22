
import knexFactory from 'knex';
import config from '../../../../knexfile.js';
import { ModuleMigrationSource } from './ModuleMigrationSource.js';

const environment = process.env.NODE_ENV ?? 'development';
const environmentConfig = config[environment];

if (!environmentConfig) {
    throw new Error(`Unknown database environment: ${environment}`);
}

const knex = knexFactory(environmentConfig);
const migrationSource = new ModuleMigrationSource();

const command = process.argv[2] ?? 'latest';

try {
    switch (command) {
        case 'latest': {
            const [batch, migrations] = await knex.migrate.latest({
                migrationSource,
            });

            console.log(`Migration batch: ${batch}`);
            console.log(`Migrations completed: ${migrations.length}`);

            for (const migration of migrations) {
                console.log(`  + ${migration}`);
            }
            break;
        }

        case 'rollback': {
            const [batch, migrations] = await knex.migrate.rollback({
                migrationSource,
            });

            console.log(`Migration batch: ${batch}`);
            console.log(`Migrations rolled back: ${migrations.length}`);

            for (const migration of migrations) {
                console.log(`  - ${migration}`);
            }
            break;
        }

        case 'status': {
            const [completed, pending] = await knex.migrate.list({
                migrationSource,
            });

            console.log('Completed migrations:');
            for (const migration of completed) {
                console.log(`  ✓ ${migration}`);
            }

            console.log('Pending migrations:');
            for (const migration of pending) {
                console.log(`  - ${migration}`);
            }
            break;
        }

        default:
            throw new Error(
                `Unknown command "${command}". Use latest, rollback, or status.`,
            );
    }
} catch (error) {
    console.error('Migration command failed:', error);
    process.exitCode = 1;
} finally {
    await knex.destroy();
}
