import { BaseController } from '#mvc/controllers/BaseController.js';
import {ApiResponse} from "#mvc/http/ApiResponse.js";

/**
 * UsersController is responsible for handling HTTP requests related to users
 */
export class UsersController extends BaseController {


    constructor({ usersHandler }) {
        super(usersHandler);
    }

    /**
     * simple hello world endpoint
     * @returns {Promise<string>}
     */
    async hello() {
        return 'Hello from public endpoint';
    }

    /**
     * get all user details
     *
     * @param user
     * @returns {Promise<ApiResponse>}
     */
    async getDetailed(user) {
        return ApiResponse.ok(user);//this.handler.getDetailed(user);
    }

    /**
     * test endpoint for making sure converters are working independently
     *
     * @param user
     * @param userContext
     * @returns {Promise<ApiResponse>}
     */
    async getContext(user, userContext) {
        return ApiResponse.ok({user: user, userContext: userContext });
    }
}

export default UsersController;