// src/index/index.js

import { usersModule } from '../../modules/users/users.module.js';


export const modules = [
    {
        name: 'users',
        prefix: '/users',
        plugin: usersModule,
    },

];