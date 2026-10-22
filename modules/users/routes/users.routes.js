import { crudRoutes } from '#mvc/routes/crud.routes.js';
import User from '../models/user.js';

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
            { name: 'user', type: 'dto', model: User },
        ],
    },
];