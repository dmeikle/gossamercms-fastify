import {BaseDto, defineDto} from "#mvc/dtos/base.dto.js";


export class UserDeviceDto extends BaseDto {
    static META = defineDto({
        id: { type: 'UUID' },
        userId: { type: 'UUID' },
        firebaseToken: { type: 'String' },
        platform: { type: 'String' },
        deviceId: { type: 'String' },
        appVersion: { type: 'String' },
        active: { type: 'Boolean' },
        lastSeenAt: { type: 'Instant' },
        createdAt: { type: 'Instant' },
        updatedAt: { type: 'Instant' },

    });

    toEntity() {
        return new UserDevice(this.toObject());
    }
}
