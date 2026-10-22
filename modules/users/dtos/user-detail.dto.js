import { BaseDto, defineDto } from '#mvc/dtos/base.dto.js';

export class UserDetailDto extends BaseDto {
  static META = defineDto({
    id: { type: 'uuid' },
    firstname: { type: 'string' },
    lastname: { type: 'string' },
    contextType: { type: 'string' },
    lastLoginAt: { type: 'instant' },
    email: { type: 'string' },
    phoneCountryCode: { type: 'string' },
    phoneNumber: { type: 'string' },
    address1: { type: 'string' },
    address2: { type: 'string' },
    city: { type: 'string' },
    stateProvince: { type: 'string' },
    postalCode: { type: 'string' },
    countryCode: { type: 'string' },
    isDefault: { type: 'boolean' },
  });
}
