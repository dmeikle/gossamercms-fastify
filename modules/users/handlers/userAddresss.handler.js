
import {BaseHandler} from "#mvc/handlers/base.handler.js";


export class UserAddresssHandler extends BaseHandler {
    constructor({ userAddresssDbService }) {
        super(userAddresssDbService);
    }
}

export default UserAddresssHandler;