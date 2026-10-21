
import { BaseDto, defineDto } from '@libs/com.gossamercms-fastify/mvc/dtos/base.dto.js';
import User from "../models/user.js";

export class UserDto extends BaseDto {
    static META = defineDto({
        id:       { type: 'uuid' },
        firstname:{ type: 'string' },
        lastname: { type: 'string' },
        status:   { type: 'string' },
        ipAddress:{ type: 'string', maxLength: 15 },
        createdOn:{ type: 'instant' },
    });

    toClaims() {
        return this.toObject([
            'firstname',
            'lastname',
        ]);
    }

    toEntity() {
        return new User(this.toObject());
    }
}
