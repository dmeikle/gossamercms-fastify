import {BaseDbService} from "#mvc/data/BaseDbService.js";

import { UserDevice } from "../models/userDevice.js";
import { UserDeviceDto } from "../dtos/userDevice.dto.js";

export class UserDevicesDbService extends BaseDbService {
    constructor({ dsManager }) {
        super(UserDevice, UserDeviceDto, dsManager);
    }
}

export default UserDevicesDbService;