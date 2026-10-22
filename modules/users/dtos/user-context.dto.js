import {BaseDto, defineDto} from "#mvc/dtos/base.dto.js";


export class UserContextDto extends BaseDto {
    static META = defineDto({
        id:       { type: 'uuid' },
        userId:{ type: 'uuid' },
        contextType: { type: 'string' },
        metadata:   { type: 'string' },
        ipAddress:{ type: 'string', maxLength: 15 },
        createdAt:{ type: 'instant' },
        updatedAt:{ type: 'instant' },
        deletedAt:{ type: 'instant' },
        createdBy:{ type: 'uuid' },
        updatedBy:{ type: 'uuid' },
        deletedBy:{ type: 'uuid' },
        roleId:{ type: 'uuid' },
        isDefault:{ type: 'boolean' },
    });


    toEntity() {
        return new UserContext(this.toObject());
    }
}
