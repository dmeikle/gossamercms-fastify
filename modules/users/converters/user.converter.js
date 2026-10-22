import { BaseConverter } from '#mvc/converters/base.converter.js';
import { UserDto } from '../dtos/user.dto.js';

export class UserConverter extends BaseConverter {
    static dto = UserDto;

    constructor({ usersDbService }) {
        super(usersDbService);
        console.log("***************************** UserConverter constructor *****************************");
    }
}

export default UserConverter;