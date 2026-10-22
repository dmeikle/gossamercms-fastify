import {BaseDto, defineDto} from "#mvc/dtos/base.dto.js";


export class UserRoleDto extends BaseDto {
    static META = defineDto({
        id: { type: 'UUID' },
        userContextId: { type: 'UUID' },
        roleId: { type: 'UUID' },
        createdBy: { type: 'UUID' },
        createdAt: { type: 'Instant' },
        expiresAt: { type: 'Instant' },

    });

    toEntity() {
        return new UserRole(this.toObject());
    }
}
