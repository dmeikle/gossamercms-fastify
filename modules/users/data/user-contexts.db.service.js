import {BaseDbService} from "#mvc/data/BaseDbService.js";

import {UserContext} from "../models/user-context.js";
import {UserContextDto} from "../dtos/user-context.dto.js";

export class UserContextsDbService extends BaseDbService {
    constructor({ dsManager }) {
        super(UserContext, UserContextDto, dsManager);
    }
}

export default UserContextsDbService;