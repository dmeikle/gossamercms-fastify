const EMPTY = Object.freeze({});
const EMPTY_LIST = Object.freeze([]);

export class LocalDate {
  constructor(text) {
    this.text = text;
  }

  toString() {
    return this.text;
  }

  toJSON() {
    return this.text;
  }

  static parse(text) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      throw new Error(`Text '${text}' could not be parsed as a LocalDate`);
    }
    const [year, month, day] = text.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year
      || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day
    ) {
      throw new Error(`Text '${text}' could not be parsed as a LocalDate`);
    }
    return new LocalDate(text);
  }
}

export class QueryOptions {
  constructor(page, size, filters, orderBy, queryFilters = EMPTY_LIST) {
    this._page = page;
    this._size = size;
    this._filters = filters;
    this._orderBy = orderBy;
    this._queryFilters = queryFilters ?? EMPTY_LIST;
  }

  page() {
    return this._page;
  }

  size() {
    return this._size;
  }

  filters() {
    return this._filters;
  }

  orderBy() {
    return this._orderBy;
  }

  queryFilters() {
    return this._queryFilters;
  }

  static of(page, size, filters, orderBy) {
    return new QueryOptions(page, size, filters, orderBy, EMPTY_LIST);
  }

  static builder() {
    return new QueryOptionsBuilder();
  }
}

export class QueryOptionsBuilder {
  constructor() {
    this._page = 1;
    this._size = 20;
    this._filters = EMPTY;
    this._orderBy = EMPTY;
    this._queryFilters = EMPTY_LIST;
  }

  page(page) {
    this._page = page;
    return this;
  }

  size(size) {
    this._size = size;
    return this;
  }

  filters(filters) {
    this._filters = normalizeFilters(filters);
    return this;
  }

  orderBy(orderBy) {
    this._orderBy = orderBy;
    return this;
  }

  queryFilters(queryFilters) {
    this._queryFilters = queryFilters == null ? EMPTY_LIST : queryFilters;
    return this;
  }

  build() {
    return new QueryOptions(
      this._page,
      this._size,
      this._filters,
      this._orderBy,
      this._queryFilters,
    );
  }
}

function normalizeFilters(raw) {
  if (raw == null || (raw instanceof Map ? raw.size === 0 : Object.keys(raw).length === 0)) {
    return EMPTY;
  }
  const entries = raw instanceof Map ? Array.from(raw.entries()) : Object.entries(raw);
  const normalized = {};
  for (const [key, value] of entries) {
    const coerced = coerceValue(value);
    if (coerced == null) {
      throw new TypeError('null');
    }
    normalized[key] = coerced;
  }
  return normalized;
}

function coerceValue(value) {
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return LocalDate.parse(value);
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?Z$/.test(value)) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return date;
    }
    return value;
  }
  return value;
}
