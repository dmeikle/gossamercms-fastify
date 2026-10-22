import { BaseConverter } from '#mvc/converters/base.converter.js';
import { UserRoleDto } from '../dtos/userRole.dto.js';

export class UserRoleConverter extends BaseConverter {
    static dto = UserRoleDto;

    constructor({ userRolesDbService }) {
        super(userRolesDbService);
        console.log("***************************** UserRoleConverter constructor *****************************");
    }
}

export default UserRoleConverter;