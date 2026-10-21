import { BaseDbService } from '@com.gossamercms-fastify/mvc/data/BaseDbService.js';
import { entriesOf, getOrDefault } from '@com.gossamercms-fastify/mvc/util/maps.js';
import { IncorrectResultSizeDataAccessException } from '@com.gossamercms-fastify/mvc/util/exceptions.js';
import { UserDto } from '../dtos/user.dto.js';
import { UserDirectoryDto } from '../dtos/user-directory.dto.js';
import { UserDetailDto } from '../dtos/user-detail.dto.js';
import { VerifyUserExistsResponse, UserCandidateDto } from '../dtos/verify-user-exists-response.dto.js';
import { User } from '../models/user.js';
import { UserDirectoryQueryPolicy } from '../policies/user-directory-query.policy.js';
import { PrivacyMaskUtils } from '../util/privacy-mask.js';

const DIRECTORY_COLUMNS = `
  u.id, u.firstname, u.lastname, u."createdOn", uc."contextType",
  li."lastLoginAt", li.identifier as email,
  ut."countryCode" as "phoneCountryCode", ut."numberRaw" as "phoneNumber"`;

const USER_JOINS = `
  from users u
  inner join user_contexts uc on u.id = uc."userId"
  inner join login_identities li on li."userId" = u.id
  inner join user_telephone ut on ut."userId" = u.id`;

const DEFAULT_ADDRESS_JOIN = `
  left join lateral (
    select * from user_addresses a
    where a."userId" = u.id
    order by a."isDefault" desc
    limit 1
  ) ua on true`;

export class UsersDbService extends BaseDbService {
  constructor(dsManager) {
    super(User, UserDto, dsManager);
  }

  removeExcludedFields(dto) {
    return dto;
  }

  async directory(options) {
    const ds = this.dsManager.get(this.meta.datasourceKey());
    const orderBy = {};
    const columnMappings = { contextType: 'uc.contextType' };
    for (const [field, direction] of entriesOf(options.orderBy())) {
      const column = UserDirectoryQueryPolicy.resolveSortColumn(field);
      orderBy[field] = UserDirectoryQueryPolicy.validateDirection(direction);
      columnMappings[field] = column;
    }

    return ds.findAllBySql(
      `select ${DIRECTORY_COLUMNS} ${USER_JOINS} /*WHERE_CLAUSE*/`,
      `select count(*) ${USER_JOINS} /*WHERE_CLAUSE*/`,
      { contextType: getOrDefault(options.filters(), 'contextType', 'default') },
      columnMappings,
      orderBy,
      options.page(),
      options.size(),
      (row) => new UserDirectoryDto(row),
    );
  }

  async getUserDetail(userId) {
    const ds = this.dsManager.get(this.meta.datasourceKey());
    return ds.findOneBySql(
      `select ${DIRECTORY_COLUMNS},
        ua.address1, ua.address2, ua.city, ua."stateProvince",
        ua."postalCode", ua."countryCode", ua."isDefault"
      ${USER_JOINS}
      ${DEFAULT_ADDRESS_JOIN}
      where u.id = :userId and uc."contextType" = 'default'`,
      { userId },
      (row) => new UserDetailDto(row),
    );
  }

  async verifyUserExists(email) {
    const ds = this.dsManager.get(this.meta.datasourceKey());
    let candidate;
    try {
      candidate = await ds.findOneBySql(
        `select u.id, u.firstname, u.lastname, u.status, uc."contextType",
          li.identifier as email,
          ut."countryCode" as "phoneCountryCode", ut."numberRaw" as "phoneNumber"
        ${USER_JOINS}
        where li.identifier = :email and uc."contextType" = 'default'`,
        { email },
        (row) => new UserCandidateDto({
          userId: row.id,
          displayName: PrivacyMaskUtils.maskName(
            [row.firstname, row.lastname].filter(Boolean).join(' '),
          ),
          email: PrivacyMaskUtils.maskEmail(row.email),
          phone: PrivacyMaskUtils.maskPhone(
            row.phoneNumber == null ? null : `${row.phoneCountryCode ?? ''}${row.phoneNumber}`,
          ),
          accountStatus: row.status,
          userType: row.contextType,
        }),
      );
    } catch (error) {
      if (!(error instanceof IncorrectResultSizeDataAccessException && error.actual === 0)) {
        throw error;
      }
    }
    const matchFound = candidate != null;
    return new VerifyUserExistsResponse({
      matchFound,
      matchType: matchFound ? ['EMAIL'] : [],
      verificationRequired: matchFound,
      candidate: candidate ?? null,
    });
  }
}

export default UsersDbService;
