import {BaseDbService} from "#mvc/data/BaseDbService.js";

import { UserRole } from "../models/userRole.js";
import { UserRoleDto } from "../dtos/userRole.dto.js";

export class UserRolesDbService extends BaseDbService {
    constructor({ dsManager }) {
        super(UserRole, UserRoleDto, dsManager);
    }
}

export default UserRolesDbService;