import { createModule } from '#mvc/modules/base.module.js';
import userContextsRoutes from "./routes/user-contexts.routes.js";
import usersRoutes from "./routes/users.routes.js";
import userAddressRoutes from "./routes/userAddress.routes.js";
import userDeviceRoutes from "./routes/userDevice.routes.js";
import userRoleRoutes from "./routes/userRole.routes.js";
import userTelephoneRoutes from "./routes/userTelephone.routes.js";

export const usersModule = createModule([
    { name: 'usersController', prefix: '/', routes: usersRoutes },
    { name: 'userContextsController', prefix: '/contexts', routes: userContextsRoutes },
    { name: 'userAddressesController', prefix: '/addresses', routes: userAddressRoutes },
    { name: 'userDevicesController', prefix: '/devices', routes: userDeviceRoutes },
    { name: 'userRolesController', prefix: '/roles', routes: userRoleRoutes },
    { name: 'userTelephonesController', prefix: '/telephones', routes: userTelephoneRoutes },
]);