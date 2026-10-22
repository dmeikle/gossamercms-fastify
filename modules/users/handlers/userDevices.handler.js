
import {BaseHandler} from "#mvc/handlers/base.handler.js";


export class UserDevicesHandler extends BaseHandler {
    constructor({ userDevicesDbService }) {
        super(userDevicesDbService);
    }
}

export default UserDevicesHandler;