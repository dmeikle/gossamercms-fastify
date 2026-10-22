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
        'modules/**/converters/*.converter.js',
    ], {
        cwd: projectRoot,
        esModules: true,
        formatName: 'camelCase',
        resolverOptions: {
            lifetime: Lifetime.SINGLETON,
        },
    });
    const dtoConverters = new Map();

    for (const name of Object.keys(container.registrations)) {
        if (!name.endsWith('Converter')) continue;

        const converter = container.resolve(name);
        const Dto = converter.constructor.dto;

        if (typeof Dto !== 'function'
            || typeof converter.convert !== 'function') {
            throw new TypeError(
                `${name} must define static dto and convert(source)`,
            );
        }

        if (dtoConverters.has(Dto)) {
            throw new Error(`Duplicate converter for ${Dto.name}`);
        }

        dtoConverters.set(Dto, converter);
    }

    container.register({
        dtoConverters: asValue(dtoConverters),
    });

    return container;
}