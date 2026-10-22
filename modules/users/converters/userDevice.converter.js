import { BaseConverter } from '#mvc/converters/base.converter.js';
import { UserDeviceDto } from '../dtos/userDevice.dto.js';

export class UserDeviceConverter extends BaseConverter {
    static dto = UserDeviceDto;

    constructor({ userDevicesDbService }) {
        super(userDevicesDbService);
        console.log("***************************** UserDeviceConverter constructor *****************************");
    }
}

export default UserDeviceConverter;