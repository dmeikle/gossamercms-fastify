import { fileURLToPath } from 'node:url';
import {
    createContainer,
    InjectionMode,
    Lifetime,
    asValue,
} from 'awilix';

import { DataSourceManager } from '#mvc/data/DataSourceManager.js';
import { MySqlAdapter } from '#mvc/adapters/mysql/MySqlAdapter.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export async function buildContainer({ db }) {
    const adapter = new MySqlAdapter(db);
    const dsManager = new DataSourceManager();
    dsManager.register(adapter.key(), adapter);

    const container = createContainer({
        injectionMode: InjectionMode.PROXY,
        strict: true,
    });

    container.register({
        dsManager: asValue(dsManager),
    });

    await container.loadModules([
        'modules/**/data/*.service.js',
        'modules/**/handlers/*.handler.js',
        'modules/**/controllers/*.controller.js',
    ], {
        cwd: projectRoot,
        esModules: true,
        formatName: 'camelCase',
        resolverOptions: {
            lifetime: Lifetime.SINGLETON,
        },
    });

    return container;
}