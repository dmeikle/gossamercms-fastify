import {BaseDbService} from "#mvc/data/BaseDbService.js";

import { UserAddress } from "../models/userAddress.js";
import { UserAddressDto } from "../dtos/userAddress.dto.js";

export class UserAddresssDbService extends BaseDbService {
    constructor({ dsManager }) {
        super(UserAddress, UserAddressDto, dsManager);
    }
}

export default UserAddresssDbService;