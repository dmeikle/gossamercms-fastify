import { PostgresAdapter } from '../postgresql/PostgresAdapter.js';
import { Operator } from '../../data/QueryFilter.js';
import {
  convertBindValue,
} from '../../data/namedParameters.js';
import { mapRowToMap } from '../../util/ReflectionUtils.js';
import {
  entriesOf,
  getOrDefault,
  hasKey,
  mapSize,
  toPlainObject,
} from '../../util/maps.js';
import { Uuid, isUuid } from '../../util/uuid.js';

const NAMED_PARAMETER = /(?<!:):([A-Za-z_][A-Za-z0-9_]*)/g;

function normalizeSql(sql) {
  return sql.replace(/"([^"]+)"/g, (_match, identifier) => `\`${identifier.replaceAll('`', '``')}\``);
}

function bindNamed(sql, params = {}) {
  const values = [];
  const text = normalizeSql(sql).replace(NAMED_PARAMETER, (_match, name) => {
    if (!hasKey(params, name)) {
      throw new Error(`No value supplied for the SQL parameter '${name}'`);
    }
    const value = params instanceof Map ? params.get(name) : params[name];
    if (Array.isArray(value) || value instanceof Set) {
      const items = Array.from(value);
      if (items.length === 0) throw new Error(`Empty collection for SQL parameter '${name}'`);
      return items.map((item) => {
        values.push(convertBindValue(item));
        return '?';
      }).join(', ');
    }
    values.push(convertBindValue(value));
    return '?';
  });
  return { text, values };
}

class MySqlJdbcTemplate {
  constructor(db) {
    this.db = db;
  }

  async query(sql, values = [], mapper) {
    const [rows] = await this.db.execute(normalizeSql(sql), values.map(convertBindValue));
    if (!Array.isArray(rows)) return [];
    return typeof mapper === 'function' ? rows.map(mapper) : rows;
  }

  async queryForList(sql, values) {
    return (await this.query(sql, values)).map((row) => ({ ...row }));
  }

  async update(sql, values = []) {
    const [result] = await this.db.execute(normalizeSql(sql), values.map(convertBindValue));
    return result.affectedRows ?? 0;
  }
}

class MySqlNamedParameterJdbcTemplate {
  constructor(db) {
    this.db = db;
  }

  async queryForList(sql, params) {
    const bound = bindNamed(sql, params);
    const [rows] = await this.db.execute(bound.text, bound.values);
    return Array.isArray(rows) ? rows.map((row) => ({ ...row })) : [];
  }

  async query(sql, params, mapper) {
    const rows = await this.queryForList(sql, params);
    return typeof mapper === 'function' ? rows.map(mapper) : rows;
  }

  async queryForObject(sql, params, type) {
    const rows = await this.queryForList(sql, params);
    if (rows.length === 0) return null;
    const value = Object.values(rows[0])[0] ?? null;
    if (type === Boolean || type === 'boolean') {
      return value === true || value === 1 || value === '1';
    }
    if (type === Number || type === 'long' || type === 'Long') {
      return value == null ? null : Number(value);
    }
    return value;
  }

  async update(sql, params) {
    const bound = bindNamed(sql, params);
    const [result] = await this.db.execute(bound.text, bound.values);
    return result.affectedRows ?? 0;
  }

  async batchUpdate(sql, sources) {
    const manageConnection = typeof this.db.getConnection === 'function';
    const connection = manageConnection ? await this.db.getConnection() : this.db;
    try {
      await connection.beginTransaction();
      const counts = [];
      for (const source of sources) {
        const params = typeof source?.getValues === 'function'
          ? source.getValues()
          : toPlainObject(source);
        const bound = bindNamed(sql, params);
        const [result] = await connection.execute(bound.text, bound.values);
        counts.push(result.affectedRows ?? 0);
      }
      await connection.commit();
      return counts;
    } catch (error) {
      try {
        await connection.rollback();
      } catch {
        // Preserve the original failure.
      }
      throw error;
    } finally {
      if (manageConnection) connection.release();
    }
  }
}

export class MySqlAdapter extends PostgresAdapter {
  constructor(db) {
    super(db);
    this.db = db;
    this.jdbc = new MySqlJdbcTemplate(db);
    this.namedJdbcTemplate = new MySqlNamedParameterJdbcTemplate(db);
  }

  static async fromConfig(config) {
    const mysql = await import('mysql2/promise');
    const pool = mysql.createPool(config);
    return new MySqlAdapter(pool);
  }

  key() {
    return 'mysql';
  }

  getNamedParameterJdbcTemplate() {
    return this.namedJdbcTemplate;
  }

  quote(identifier) {
    if (identifier == null) return null;
    return identifier.split('.').map((part) => `\`${part.replaceAll('`', '``')}\``).join('.');
  }

  buildColumnExpression(column) {
    return this.quote(column);
  }

  async hasColumn(table, column) {
    const sql = `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = :table
          AND column_name = :column
      ) AS present
    `;
    return (await this.namedJdbcTemplate.queryForObject(sql, { table, column }, Boolean)) === true;
  }

  async update(table, id, params) {
    if (params == null || mapSize(params) === 0) return null;
    const effective = new Map();
    for (const [key, value] of entriesOf(params)) {
      if (value != null && key !== 'id') effective.set(key, value);
    }
    if (effective.size === 0) return null;

    const columns = Array.from(effective.keys());
    const setClause = columns.map((column) => `${this.quote(column)} = ?`).join(', ');
    await this.jdbc.update(
      `UPDATE ${this.quote(table)} SET ${setClause} WHERE ${this.quote('id')} = ?`,
      [...columns.map((column) => effective.get(column)), id],
    );
    const rows = await this.jdbc.queryForList(
      `SELECT * FROM ${this.quote(table)} WHERE ${this.quote('id')} = ? LIMIT 1`,
      [id],
    );
    return rows.length === 0 ? null : mapRowToMap(rows[0]);
  }

  async bulkDelete(table, ids) {
    const list = ids == null ? [] : Array.from(ids);
    if (list.length === 0) return;
    const placeholders = list.map(() => '?').join(', ');
    await this.jdbc.update(
      `UPDATE ${this.quote(table)} SET ${this.quote('deletedAt')} = NOW() WHERE ${this.quote('id')} IN (${placeholders})`,
      list,
    );
  }

  async restoreById(table, id) {
    await this.jdbc.update(
      `UPDATE ${this.quote(table)} SET ${this.quote('deletedAt')} = NULL WHERE ${this.quote('id')} = ?`,
      [id],
    );
    const rows = await this.jdbc.queryForList(
      `SELECT * FROM ${this.quote(table)} WHERE ${this.quote('id')} = ? LIMIT 1`,
      [id],
    );
    return rows.length === 0 ? null : rows[0];
  }

  async exists(table, id) {
    let sql = `SELECT EXISTS (SELECT 1 FROM ${this.quote(table)} WHERE ${this.quote('id')} = :id`;
    if (await this.hasColumn(table, 'deletedAt')) {
      sql += ` AND ${this.quote('deletedAt')} IS NULL`;
    }
    sql += ') AS present';
    return (await this.namedJdbcTemplate.queryForObject(sql, { id }, Boolean)) === true;
  }

  buildWhere(filters, queryFilters, columnMappings, excludeSoftDeleted) {
    if (columnMappings == null) throw new TypeError('null');
    const clauses = [];
    if (excludeSoftDeleted) clauses.push(`${this.quote('deletedAt')} IS NULL`);

    if (filters != null && mapSize(filters) > 0) {
      for (const [key, value] of entriesOf(filters)) {
        if (value == null || this.isIgnoredFilter(key)) continue;
        const base = this.stripOperator(this.stripRangeSuffix(key));
        const column = this.buildColumnExpression(getOrDefault(columnMappings, base, base));
        const operator = key.endsWith('__like') || key.endsWith('__ilike') ? 'LIKE' : '=';
        clauses.push(`${column} ${operator} :${key}`);
      }
    }

    if (queryFilters != null) {
      for (const filter of queryFilters) {
        const column = this.buildColumnExpression(
          getOrDefault(columnMappings, filter.field(), filter.field()),
        );
        const parameter = filter.field();
        const prefix = filter.prefix();
        switch (filter.operator()) {
          case Operator.EQUALS:
            clauses.push(`${prefix}${column} = :${parameter}`);
            break;
          case Operator.LIKE:
          case Operator.ILIKE:
            clauses.push(`${prefix}${column} LIKE :${parameter}`);
            break;
          case Operator.GREATER_THAN:
            clauses.push(`${prefix}${column} > :${parameter}`);
            break;
          case Operator.GREATER_THAN_OR_EQUAL:
            clauses.push(`${prefix}${column} >= :${parameter}`);
            break;
          case Operator.LESS_THAN:
            clauses.push(`${prefix}${column} < :${parameter}`);
            break;
          case Operator.LESS_THAN_OR_EQUAL:
            clauses.push(`${prefix}${column} <= :${parameter}`);
            break;
          case Operator.IN:
            clauses.push(`${prefix}${column} IN (:${parameter})`);
            break;
          case Operator.NOT_IN:
            clauses.push(`${prefix}${column} NOT IN (:${parameter})`);
            break;
          case Operator.IS_NULL:
            clauses.push(`${prefix}${column} IS NULL`);
            break;
          case Operator.IS_NOT_NULL:
            clauses.push(`${prefix}${column} IS NOT NULL`);
            break;
          case Operator.EQUALS_DATE:
            clauses.push(`DATE(${column}) = :${parameter}`);
            break;
          case Operator.GREATER_THAN_DATE:
            clauses.push(`DATE(${column}) > :${parameter}`);
            break;
          case Operator.GREATER_THAN_OR_EQUAL_DATE:
            clauses.push(`DATE(${column}) >= :${parameter}`);
            break;
          case Operator.LESS_THAN_DATE:
            clauses.push(`DATE(${column}) < :${parameter}`);
            break;
          case Operator.LESS_THAN_OR_EQUAL_DATE:
            clauses.push(`DATE(${column}) <= :${parameter}`);
            break;
          case Operator.BETWEEN:
            clauses.push(`DATE(${column}) BETWEEN :${parameter}Start AND :${parameter}End`);
            break;
          case Operator.NOT_BETWEEN:
            clauses.push(`DATE(${column}) NOT BETWEEN :${parameter}Start AND :${parameter}End`);
            break;
          case Operator.GREATER_THAN_TIMESTAMP:
          case Operator.GREATER_THAN_OR_EQUAL_TIMESTAMP:
          case Operator.LESS_THAN_TIMESTAMP:
          case Operator.LESS_THAN_OR_EQUAL_TIMESTAMP:
          case Operator.EQUALS_TIMESTAMP:
          case Operator.NOT_EQUALS_TIMESTAMP: {
            const operators = {
              [Operator.GREATER_THAN_TIMESTAMP]: '>',
              [Operator.GREATER_THAN_OR_EQUAL_TIMESTAMP]: '>=',
              [Operator.LESS_THAN_TIMESTAMP]: '<',
              [Operator.LESS_THAN_OR_EQUAL_TIMESTAMP]: '<=',
              [Operator.EQUALS_TIMESTAMP]: '=',
              [Operator.NOT_EQUALS_TIMESTAMP]: '<>',
            };
            clauses.push(`${prefix}${column} ${operators[filter.operator()]} :${parameter}`);
            break;
          }
          default:
            break;
        }
      }
    }
    return clauses.join(' AND ');
  }

  async findExistingIds(table, ids) {
    const list = ids == null ? [] : Array.from(ids);
    if (list.length === 0) return new Set();
    const placeholders = list.map(() => '?').join(', ');
    const rows = await this.jdbc.queryForList(
      `SELECT ${this.quote('id')} FROM ${this.quote(table)} WHERE ${this.quote('id')} IN (${placeholders})`,
      list.map((id) => (id instanceof Uuid ? id.toString() : String(id))),
    );
    return new Set(rows.map((row) => {
      if (row.id instanceof Uuid) return row.id;
      return isUuid(row.id) ? new Uuid(row.id) : row.id;
    }));
  }

  async end() {
    await this.db.end();
  }
}
