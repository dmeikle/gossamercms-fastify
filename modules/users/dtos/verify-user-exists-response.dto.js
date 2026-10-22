import { BaseDto, defineDto } from '#mvc/dtos/base.dto.js';

export class UserCandidateDto extends BaseDto {
  static META = defineDto({
    userId: { type: 'uuid' },
    displayName: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    accountStatus: { type: 'string' },
    userType: { type: 'string' },
  });
}

export class VerifyUserExistsResponse extends BaseDto {
  static META = defineDto({
    matchFound: { type: 'boolean', default: false },
    matchType: { type: 'array' },
    verificationRequired: { type: 'boolean', default: false },
    candidate: { type: 'object' },
  });
}
