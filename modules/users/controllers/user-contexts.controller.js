
import { BaseController } from '#mvc/controllers/BaseController.js';

/**
 * UserContextsController is responsible for handling HTTP requests related to user contexts
 */
export class UserContextsController extends BaseController {
    constructor({userContextsHandler}) {
        super(userContextsHandler);
    }

}

export default UserContextsController;