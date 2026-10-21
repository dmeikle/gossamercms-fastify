// src/index/index.js

import { usersModule } from '../../apps/src/gossamercms-users/com/gossamercms/users/users.module.js';


export const index = [
    {
        name: 'users',
        prefix: '/users',
        plugin: usersModule,
    },

];