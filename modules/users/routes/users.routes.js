import { crudRoutes } from '#mvc/routes/crud.routes.js';
import User from '../models/user.js';
import {UserDto} from "../dtos/user.dto.js";
import {UserContextDto} from "../dtos/user-context.dto.js";

export default [
    ...crudRoutes,
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
            { name: 'user', type: 'dto', dto: UserDto },
        ],
    },
    {
        method: 'GET',
        path: '/:user/detailed/:userContext',
        action: 'getContext',
        parameters: [
            { name: 'user', type: 'dto', dto: UserDto },
            { name: 'userContext', type: 'dto', dto: UserContextDto },
        ],
    },
];