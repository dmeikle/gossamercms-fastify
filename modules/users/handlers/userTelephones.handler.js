
import {BaseHandler} from "#mvc/handlers/base.handler.js";


export class UserTelephonesHandler extends BaseHandler {
    constructor({ userTelephonesDbService }) {
        super(userTelephonesDbService);
    }
}

export default UserTelephonesHandler;