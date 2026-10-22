import { BaseController } from '#mvc/controllers/BaseController.js';
import User from '../models/user.js';
import {ApiResponse} from "#mvc/http/ApiResponse.js";

export class UsersController extends BaseController {
    static routes = [
        {
            method: 'GET',
            path: '/hello',
            action: 'hello',
            parameters: [],
        },
        {
            method: 'GET',
            path: '/:user/detailed',
            action: 'getDetailed',
            parameters: [
                {
                    type: 'dto',
                    name: 'user',
                    model: User,
                },
            ],
        },
    ];

    constructor({ usersHandler }) {
        super(usersHandler);
    }

    async hello() {
        return 'Hello from public endpoint';
    }

    async getDetailed(user) {
        return ApiResponse.ok(user);//this.handler.getDetailed(user);
    }
}

export default UsersController;