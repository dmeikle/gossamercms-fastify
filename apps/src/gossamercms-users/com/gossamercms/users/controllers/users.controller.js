
import { BaseController } from '@gossamercms/mvc/controllers/BaseController.js';

export class UsersController extends BaseController {
    constructor(handler) {
        super(handler);
    }

    async register(fastify) {
        // Public endpoint
        fastify.get('/hello', async () => {
            return 'Hello from public endpoint';
        });

        // Register inherited CRUD endpoints
        await super.register(fastify);
    }
}
