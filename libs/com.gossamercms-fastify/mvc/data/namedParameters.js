import { PGobject } from '../helpers/JsonbHelper.js';
import { LocalDate } from './QueryOptions.js';
import { Uuid } from '../util/uuid.js';
import {
  BadSqlGrammarException,
  EmptyResultDataAccessException,
  IncorrectResultSizeDataAccessException,
} from '../util/exceptions.js';
import { hasKey, toPlainObject } from '../util/maps.js';

export const Types = Object.freeze({
  OTHER: 'OTHER',
});

const NAMED_PARAM = /(?<!:):([A-Za-z_][A-Za-z0-9_]*)/g;

export function convertBindValue(value) {
  if (value instanceof PGobject) return value.getValue();
  if (value instanceof Uuid) return value.toString();
  if (value instanceof LocalDate) return value.toString();
  if (value instanceof Date) return value;
  return value;
}

/**
 * Spring NamedParameterJdbcTemplate style `:name` binding.
 * PostgreSQL casts written as `::type` are left alone.
 * A collection value expands to a comma-separated placeholder list so `IN (:ids)` works.
 */
export function bindNamed(sql, params) {
  const source = params == null ? {} : params;
  const values = [];
  const indexByName = new Map();
  const text = sql.replace(NAMED_PARAM, (match, name) => {
    if (!hasKey(source, name)) {
      throw new Error(`No value supplied for the SQL parameter '${name}'`);
    }
    const value = source instanceof Map ? source.get(name) : source[name];
    if (Array.isArray(value) || value instanceof Set) {
      const items = Array.from(value);
      if (items.length === 0) {
        throw new Error(`Empty collection for SQL parameter '${name}'`);
      }
      return items.map((item) => {
        values.push(convertBindValue(item));
        return `$${values.length}`;
      }).join(', ');
    }
    if (!indexByName.has(name)) {
      values.push(convertBindValue(value));
      indexByName.set(name, values.length);
    }
    return `$${indexByName.get(name)}`;
  });
  return { text, values };
}

function translate(sql, error) {
  if (error && typeof error.code === 'string' && error.code.startsWith('42')) {
    return new BadSqlGrammarException(sql, error);
  }
  return error;
}

function firstColumn(row) {
  if (row == null) return null;
  const keys = Object.keys(row);
  if (keys.length === 0) return null;
  return row[keys[0]];
}

export class JdbcTemplate {
  constructor(db) {
    this.db = db;
  }

  async query(sql, values, mapper) {
    try {
      const result = await this.db.query(sql, values);
      if (typeof mapper !== 'function') return result.rows;
      return result.rows.map((row, index) => mapper(row, index));
    } catch (error) {
      throw translate(sql, error);
    }
  }

  async queryForList(sql, values) {
    const rows = await this.query(sql, values);
    return rows.map((row) => ({ ...row }));
  }

  async update(sql, values) {
    try {
      const result = await this.db.query(sql, values);
      return result.rowCount ?? 0;
    } catch (error) {
      throw translate(sql, error);
    }
  }

  async execute(sql) {
    try {
      await this.db.query(sql);
    } catch (error) {
      throw translate(sql, error);
    }
  }
}

export class NamedParameterJdbcTemplate {
  constructor(db) {
    this.db = db;
  }

  async queryForList(sql, params) {
    const bound = bindNamed(sql, params);
    try {
      const result = await this.db.query(bound.text, bound.values);
      return result.rows.map((row) => ({ ...row }));
    } catch (error) {
      throw translate(sql, error);
    }
  }

  async queryForObject(sql, params, type) {
    const rows = await this.queryForList(sql, params);
    if (rows.length === 0) {
      throw new EmptyResultDataAccessException('Incorrect result size: expected 1, actual 0');
    }
    if (rows.length > 1) {
      throw new IncorrectResultSizeDataAccessException(1, rows.length);
    }
    const value = firstColumn(rows[0]);
    if (type === Boolean || type === 'boolean') {
      return coerceBoolean(value);
    }
    if (type === Number || type === 'long' || type === 'Long') {
      return value == null ? null : Number(value);
    }
    return value;
  }

  async query(sql, params, mapper) {
    const bound = bindNamed(sql, params);
    try {
      const result = await this.db.query(bound.text, bound.values);
      return result.rows.map((row, index) => mapper(row, index));
    } catch (error) {
      throw translate(sql, error);
    }
  }

  async update(sql, params) {
    const bound = bindNamed(sql, params);
    try {
      const result = await this.db.query(bound.text, bound.values);
      return result.rowCount ?? 0;
    } catch (error) {
      throw translate(sql, error);
    }
  }

  /**
   * Runs one update per parameter source in a single transaction,
   * which is the @Transactional boundary on BaseDbService.updateAll.
   */
  async batchUpdate(sql, sources) {
    const db = this.db;
    const manage = db != null && typeof db.connect === 'function';
    const client = manage ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const counts = [];
      for (const source of sources) {
        const params = typeof source?.getValues === 'function'
          ? source.getValues()
          : toPlainObject(source);
        const bound = bindNamed(sql, params);
        const result = await client.query(bound.text, bound.values);
        counts.push(result.rowCount ?? 0);
      }
      await client.query('COMMIT');
      return counts;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Keep the original failure.
      }
      throw translate(sql, error);
    } finally {
      if (manage) client.release();
    }
  }
}

function coerceBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === 't' || value === 'true' || value === '1') return true;
  if (value === 'f' || value === 'false' || value === '0') return false;
  return Boolean(value);
}

function decapitalize(name) {
  if (name.length >= 2 && name[0] === name[0].toUpperCase() && name[1] === name[1].toUpperCase()) {
    return name;
  }
  return name.charAt(0).toLowerCase() + name.slice(1);
}

export function beanProperties(bean) {
  const props = {};
  if (bean == null || typeof bean !== 'object') return props;
  for (const key of Object.keys(bean)) {
    props[key] = bean[key];
  }
  let cursor = Object.getPrototypeOf(bean);
  while (cursor && cursor !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(cursor)) {
      if (name === 'constructor' || typeof bean[name] !== 'function') continue;
      if (name.startsWith('get') && name.length > 3) {
        const prop = decapitalize(name.slice(3));
        if (!Object.prototype.hasOwnProperty.call(props, prop)) {
          props[prop] = bean[name]();
        }
      } else if (name.startsWith('is') && name.length > 2) {
        const prop = decapitalize(name.slice(2));
        if (!Object.prototype.hasOwnProperty.call(props, prop)) {
          props[prop] = bean[name]();
        }
      }
    }
    cursor = Object.getPrototypeOf(cursor);
  }
  return props;
}

export class BeanPropertySqlParameterSource {
  constructor(bean) {
    this.bean = bean;
    this.sqlTypes = new Map();
  }

  registerSqlType(name, type) {
    this.sqlTypes.set(name, type);
  }

  getValues() {
    return beanProperties(this.bean);
  }
}
