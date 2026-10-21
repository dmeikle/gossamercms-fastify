import Fastify from 'fastify';
import { modules } from './modules/index.js';

export async function buildApp({ db }) {
    const fastify = Fastify({ logger: true });

    for (const module of modules) {
        await fastify.register(module.plugin, {
            prefix: module.prefix,
            db,
        });
    }

    return fastify;
}