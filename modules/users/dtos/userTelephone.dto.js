import {BaseDto, defineDto} from "#mvc/dtos/base.dto.js";


export class UserTelephoneDto extends BaseDto {
    static META = defineDto({
        id: { type: 'UUID' },
        userId: { type: 'UUID' },
        countryCode: { type: 'String' },
        numberRaw: { type: 'String' },
        numberE164: { type: 'String' },
        type: { type: 'String' },
        verified: { type: 'Boolean' },
        smsOptIn: { type: 'Boolean' },
        preferred: { type: 'Boolean' },
        extension: { type: 'String' },
        createdAt: { type: 'Instant' },
        updatedAt: { type: 'Instant' },
        deletedAt: { type: 'Instant' },
        createdBy: { type: 'UUID' },
        updatedBy: { type: 'UUID' },
        deletedBy: { type: 'UUID' },

    });

    toEntity() {
        return new UserTelephone(this.toObject());
    }
}
