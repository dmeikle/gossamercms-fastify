import { IllegalArgumentException } from '../../../../../../../libs/com.gossamercms-fastify/mvc/util/exceptions.js';

const SORT_COLUMNS = new Map([
  ['id', 'u.id'],
  ['firstname', 'u.firstname'],
  ['lastname', 'u.lastname'],
  ['createdOn', 'u.createdOn'],
  ['contextType', 'uc.contextType'],
  ['lastLoginAt', 'li.lastLoginAt'],
  ['email', 'li.identifier'],
  ['phoneCountryCode', 'ut.countryCode'],
  ['phoneNumber', 'ut.numberRaw'],
]);

export class UserDirectoryQueryPolicy {
  static isAllowedSort(field) {
    return SORT_COLUMNS.has(field);
  }

  static resolveSortColumn(field) {
    if (!this.isAllowedSort(field)) {
      throw new IllegalArgumentException(`Unknown directory sort field: ${field}`);
    }
    return SORT_COLUMNS.get(field);
  }

  static validateDirection(direction) {
    const normalized = String(direction).toUpperCase();
    if (normalized !== 'ASC' && normalized !== 'DESC') {
      throw new IllegalArgumentException(`Invalid sort direction: ${direction}`);
    }
    return normalized;
  }
}
