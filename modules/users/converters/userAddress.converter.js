import { BaseConverter } from '#mvc/converters/base.converter.js';
import { UserAddressDto } from '../dtos/userAddress.dto.js';

export class UserAddressConverter extends BaseConverter {
    static dto = UserAddressDto;

    constructor({ userAddresssDbService }) {
        super(userAddresssDbService);
        console.log("***************************** UserAddressConverter constructor *****************************");
    }
}

export default UserAddressConverter;