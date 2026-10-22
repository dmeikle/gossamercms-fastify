
import { BaseDto, defineDto } from '#mvc/dtos/base.dto.js';
import User from "../models/user.js";

export class UserDto extends BaseDto {
    static META = defineDto({
        id:       { type: 'uuid' },
        firstname:{ type: 'string' },
        lastname: { type: 'string' },
        status:   { type: 'string' },
        ipAddress:{ type: 'string', maxLength: 15 },
        createdAt:{ type: 'instant' },
        updatedAt:{ type: 'instant' },
        deletedAt:{ type: 'instant' },
        createdBy:{ type: 'uuid' },
        updatedBy:{ type: 'uuid' },
        deletedBy:{ type: 'uuid' },
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
