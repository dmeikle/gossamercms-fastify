
import {BaseHandler} from "#mvc/handlers/base.handler.js";


export class UserRolesHandler extends BaseHandler {
    constructor({ userRolesDbService }) {
        super(userRolesDbService);
    }
}

export default UserRolesHandler;