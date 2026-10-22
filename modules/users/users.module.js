import { createModule } from '#mvc/modules/base.module.js';
import userContextsRoutes from "./routes/user-contexts.routes.js";
import usersRoutes from "./routes/users.routes.js";

export const usersModule = createModule([
    { name: 'usersController', prefix: '/', routes: usersRoutes },
    { name: 'userContextsController', prefix: '/contexts', routes: userContextsRoutes },
]);