import { BaseConverter } from '#mvc/converters/base.converter.js';
import { UserTelephoneDto } from '../dtos/userTelephone.dto.js';

export class UserTelephoneConverter extends BaseConverter {
    static dto = UserTelephoneDto;

    constructor({ userTelephonesDbService }) {
        super(userTelephonesDbService);
        console.log("***************************** UserTelephoneConverter constructor *****************************");
    }
}

export default UserTelephoneConverter;