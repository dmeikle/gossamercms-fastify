
import {BaseHandler} from "#mvc/handlers/base.handler.js";


export class UsersHandler extends BaseHandler {
    constructor({ usersDbService}) {
        super(usersDbService);
    }
}

export default UsersHandler;