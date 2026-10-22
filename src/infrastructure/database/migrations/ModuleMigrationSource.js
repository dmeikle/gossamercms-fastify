
import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class ModuleMigrationSource {
    // constructor(modulesDirectory = resolve(__dirname, '../../../modules')) {
    //     this.modulesDirectory = modulesDirectory;
    // }
    constructor(modulesDirectory = resolve(__dirname, '../../../../modules')) {
        this.modulesDirectory = modulesDirectory;
    }
    async getMigrations(loadExtensions) {
        const allowedExtensions = new Set(
            loadExtensions ?? ['.js'],
        );

        const modules = await readdir(this.modulesDirectory, {
            withFileTypes: true,
        });

        const migrations = [];

        for (const moduleEntry of modules) {
            if (!moduleEntry.isDirectory()) continue;

            const migrationDirectory = join(
                this.modulesDirectory,
                moduleEntry.name,
                'migrations',
            );

            let files;

            try {
                files = await readdir(migrationDirectory, {
                    withFileTypes: true,
                });
            } catch (error) {
                if (error.code === 'ENOENT') continue;
                throw error;
            }

            for (const file of files) {
                if (!file.isFile()) continue;
                if (!allowedExtensions.has(
                    `.${file.name.split('.').pop()}`,
                )) continue;

                migrations.push({
                    moduleName: moduleEntry.name,
                    fileName: file.name,
                    filePath: join(migrationDirectory, file.name),
                });
            }
        }

        migrations.sort((a, b) =>
            a.fileName.localeCompare(b.fileName) ||
            a.moduleName.localeCompare(b.moduleName),
        );

        // Knex stores migration names in its history table.
        // Fail early if two migrations would have the same name.
        const names = new Set();

        for (const migration of migrations) {
            const name = this.getMigrationName(migration);

            if (names.has(name)) {
                throw new Error(`Duplicate migration name: ${name}`);
            }

            names.add(name);
        }

        return migrations;
    }

    getMigrationName(migration) {
        return `${migration.moduleName}/${migration.fileName}`;
    }

    async getMigration(migration) {
        const url = pathToFileURL(migration.filePath).href;
        return import(url);
    }
}
