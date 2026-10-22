import { BaseConverter } from '#mvc/converters/base.converter.js';
import { UserContextDto } from '../dtos/user-context.dto.js';

export class UserContextConverter extends BaseConverter {
    static dto = UserContextDto;

    constructor({ userContextsDbService }) {
        super(userContextsDbService);
        console.log("***************************** UserContextConverter constructor *****************************");
    }
}

export default UserContextConverter;