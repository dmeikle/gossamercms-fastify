
import {BaseHandler} from "#mvc/handlers/base.handler.js";


export class UserContextsHandler extends BaseHandler {
    constructor({ userContextsDbService}) {
        super(userContextsDbService);
    }
}

export default UserContextsHandler;