import { BaseDto, defineDto } from '#mvc/dtos/base.dto.js';

export class UserDirectoryDto extends BaseDto {
  static META = defineDto({
    id: { type: 'uuid' },
    firstname: { type: 'string' },
    lastname: { type: 'string' },
    createdOn: { type: 'instant' },
    contextType: { type: 'string' },
    lastLoginAt: { type: 'instant' },
    email: { type: 'string' },
    phoneCountryCode: { type: 'string' },
    phoneNumber: { type: 'string' },
  });
}
