export const Operator = Object.freeze({
  EQUALS: 'EQUALS',
  LIKE: 'LIKE',
  ILIKE: 'ILIKE',
  GREATER_THAN: 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL: 'GREATER_THAN_OR_EQUAL',
  LESS_THAN: 'LESS_THAN',
  LESS_THAN_OR_EQUAL: 'LESS_THAN_OR_EQUAL',
  IN: 'IN',
  NOT_IN: 'NOT_IN',
  IS_NULL: 'IS_NULL',
  IS_NOT_NULL: 'IS_NOT_NULL',
  EQUALS_DATE: 'EQUALS_DATE',
  GREATER_THAN_DATE: 'GREATER_THAN_DATE',
  GREATER_THAN_OR_EQUAL_DATE: 'GREATER_THAN_OR_EQUAL_DATE',
  LESS_THAN_DATE: 'LESS_THAN_DATE',
  LESS_THAN_OR_EQUAL_DATE: 'LESS_THAN_OR_EQUAL_DATE',
  BETWEEN: 'BETWEEN',
  NOT_BETWEEN: 'NOT_BETWEEN',
  GREATER_THAN_TIMESTAMP: 'GREATER_THAN_TIMESTAMP',
  GREATER_THAN_OR_EQUAL_TIMESTAMP: 'GREATER_THAN_OR_EQUAL_TIMESTAMP',
  LESS_THAN_TIMESTAMP: 'LESS_THAN_TIMESTAMP',
  LESS_THAN_OR_EQUAL_TIMESTAMP: 'LESS_THAN_OR_EQUAL_TIMESTAMP',
  EQUALS_TIMESTAMP: 'EQUALS_TIMESTAMP',
  NOT_EQUALS: 'NOT_EQUALS',
  NOT_EQUALS_DATE: 'NOT_EQUALS_DATE',
  NOT_EQUALS_TIMESTAMP: 'NOT_EQUALS_TIMESTAMP',
});

export class QueryFilter {
  constructor(field, operator, value, prefix = '') {
    this._field = field;
    this._operator = operator;
    this._value = value;
    this._prefix = prefix;
  }

  static equals(field, value) {
    return new QueryFilter(field, Operator.EQUALS, value);
  }

  static like(field, value) {
    return new QueryFilter(field, Operator.LIKE, `%${value}%`);
  }

  static ilike(field, value) {
    return new QueryFilter(field, Operator.ILIKE, `%${value}%`);
  }

  static isNull(field) {
    return new QueryFilter(field, Operator.IS_NULL, null);
  }

  field() {
    return this._field;
  }

  operator() {
    return this._operator;
  }

  value() {
    return this._value;
  }

  prefix() {
    return this._prefix == null || this._prefix === '' ? '' : `${this._prefix}.`;
  }
}

QueryFilter.Operator = Operator;
