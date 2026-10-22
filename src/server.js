// import Fastify from 'fastify';
//
// const app = Fastify({ logger: true });
// const port = Number(process.env.PORT ?? 3000);
//
// app.get('/health', async () => ({ status: 'ok' }));
//
// try {
//   await app.listen({ host: '0.0.0.0', port });
// } catch (error) {
//   app.log.error(error);
//   process.exit(1);
// }
//

import { buildApp } from './app.js';
import { createDatabase } from './infrastructure/database/index.js';
import {buildContainer} from "./container.js";

const db = await createDatabase();
const container = await buildContainer({ db });
const fastify = await buildApp({ container });

try {
  await fastify.listen({
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? '0.0.0.0',
  });
} catch (error) {
  fastify.log.error(error);
  await fastify.close();
  process.exitCode = 1;
}