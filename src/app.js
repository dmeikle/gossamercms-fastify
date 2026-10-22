import Fastify from 'fastify';
import { modules } from './modules/index.js';

export async function buildApp({ container }) {
    const fastify = Fastify({ logger: true });
    const loadedModules = [];

    for (const module of modules) {
        const endpoints = [];
        loadedModules.push({ name: module.name, endpoints });

        fastify.register(async function moduleScope(scope) {
            scope.addHook('onRoute', (route) => {
                const methods = Array.isArray(route.method)
                    ? route.method
                    : [route.method];

                for (const method of methods) {
                    endpoints.push({ method, url: route.url });
                }
            });

            scope.register(module.plugin, { container });
        }, {
            prefix: module.prefix,
        });
    }

    fastify.addHook('onReady', async () => {
        for (const { name, endpoints } of loadedModules) {
            fastify.log.info(
                { module: name, endpointCount: endpoints.length },
                'Module loaded',
            );

            for (const { method, url } of endpoints) {
                fastify.log.info(
                    { module: name, method, url },
                    'Endpoint loaded',
                );
            }
        }
    });

    return fastify;
}