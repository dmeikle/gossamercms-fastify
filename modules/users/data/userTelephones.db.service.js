import {BaseDbService} from "#mvc/data/BaseDbService.js";

import { UserTelephone } from "../models/userTelephone.js";
import { UserTelephoneDto } from "../dtos/userTelephone.dto.js";

export class UserTelephonesDbService extends BaseDbService {
    constructor({ dsManager }) {
        super(UserTelephone, UserTelephoneDto, dsManager);
    }
}

export default UserTelephonesDbService;