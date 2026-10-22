import {BaseDto, defineDto} from "#mvc/dtos/base.dto.js";


export class UserAddressDto extends BaseDto {
    static META = defineDto({
        id: { type: 'UUID' },
        userId: { type: 'UUID' },
        type: { type: 'String' },
        address1: { type: 'String' },
        address2: { type: 'String' },
        city: { type: 'String' },
        stateProvince: { type: 'String' },
        postalCode: { type: 'String' },
        countryCode: { type: 'String' },
        isDefault: { type: 'Boolean' },
        isBilling: { type: 'Boolean' },

    });

    toEntity() {
        return new UserAddress(this.toObject());
    }
}
