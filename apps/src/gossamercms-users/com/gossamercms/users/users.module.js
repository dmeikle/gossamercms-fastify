import { UsersHandler } from './handlers/users.handler.js.js';
import { UserDbService } from './data/users.db.service.js';
import {UsersController} from "./controllers/users.controller.js";

export async function usersModule(fastify, options) {
    const db = new UserDbService(options.db);
    const handler = new UsersHandler(db);
    const controller = new UsersController(handler);

    await controller.register(fastify);
}
