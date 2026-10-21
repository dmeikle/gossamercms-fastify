import { DataSourceAdapter } from '../../data/DataSourceAdapter.js';
import { ListResultset } from '../../data/ListResultset.js';
import { Operator } from '../../data/QueryFilter.js';
import {
  JdbcTemplate,
  NamedParameterJdbcTemplate,
  convertBindValue,
} from '../../data/namedParameters.js';
import { PGobject } from '../../helpers/JsonbHelper.js';
import { mapRowToMap } from '../../util/ReflectionUtils.js';
import {
  BadSqlGrammarException,
  IllegalArgumentException,
  IncorrectResultSizeDataAccessException,
} from '../../util/exceptions.js';
import { entriesOf, getOrDefault, hasKey, mapSize } from '../../util/maps.js';
import { Uuid, isUuid } from '../../util/uuid.js';

function insertWhereClause(sql, whereClause) {
  if (whereClause == null || whereClause.trim() === '') return sql;
  const lower = sql.toLowerCase();
  let index = Number.MAX_SAFE_INTEGER;
  const groupBy = lower.indexOf(' group by ');
  if (groupBy >= 0) index = Math.min(index, groupBy);
  const having = lower.indexOf(' having ');
  if (having >= 0) index = Math.min(index, having);
  const orderBy = lower.indexOf(' order by ');
  if (orderBy >= 0) index = Math.min(index, orderBy);
  if (index === Number.MAX_SAFE_INTEGER) return `${sql} WHERE ${whereClause}`;
  return `${sql.slice(0, index)} WHERE ${whereClause} ${sql.slice(index)}`;
}

function asUuid(value) {
  if (value instanceof Uuid) return value;
  if (typeof value === 'string' && isUuid(value)) return new Uuid(value);
  return value;
}

export class PostgresAdapter extends DataSourceAdapter {
  constructor(db) {
    super();
    this.db = db;
    this.jdbc = new JdbcTemplate(db);
    this.namedJdbcTemplate = new NamedParameterJdbcTemplate(db);
  }

  static async fromConfig(config) {
    const pg = await import('pg');
    const Pool = pg.default?.Pool ?? pg.Pool;
    return new PostgresAdapter(new Pool(config));
  }

  key() {
    return 'postgres';
  }

  getNamedParameterJdbcTemplate() {
    return this.namedJdbcTemplate;
  }

  async save(table, params) {
    if (params == null || mapSize(params) === 0) {
      throw new IllegalArgumentException('Cannot insert empty params');
    }

    if (!hasKey(params, 'id') || (params instanceof Map ? params.get('id') : params.id) == null) {
      const id = Uuid.randomUUID();
      if (params instanceof Map) params.set('id', id);
      else params.id = id;
    }

    const effective = new Map();
    for (const [key, value] of entriesOf(params)) {
      if (value != null) effective.set(key, value);
    }

    const columns = Array.from(effective.keys());
    const columnList = columns.map((column) => this.quote(column)).join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.quote(table)} (${columnList}) VALUES (${placeholders})`;
    const values = columns.map((column) => this.convertValue(effective.get(column)));
    await this.jdbc.update(sql, values);
  }

  async find(_id) {
    return null;
  }

  async findOne(table, filter, third, fourth) {
    if (arguments.length <= 2) return this.findOneFull(table, filter, [], {});
    if (arguments.length === 3) {
      if (Array.isArray(third)) return this.findOneFull(table, filter, third, {});
      return this.findOneFull(table, filter, [], third ?? {});
    }
    return this.findOneFull(table, filter, third ?? [], fourth ?? {});
  }

  async findOneFull(table, filter, queryFilters, columnMappings) {
    const params = {};
    if (filter != null) {
      for (const [key, value] of entriesOf(filter)) params[key] = value;
    }
    if (queryFilters != null) {
      for (const queryFilter of queryFilters) {
        params[queryFilter.field()] = queryFilter.value();
      }
    }

    const where = this.buildWhere(filter, queryFilters, columnMappings, false);
    let sql = `SELECT * FROM ${this.quote(table)}`;
    if (where != null && where.trim() !== '') sql += ` WHERE ${where}`;
    sql += ' LIMIT 1';

    const rows = await this.namedJdbcTemplate.queryForList(sql, params);
    return rows.length === 0 ? null : rows[0];
  }

  hasWhereClause(sql) {
    return sql != null && (sql.toLowerCase().includes('where ') || sql.includes('/*WHERE_CLAUSE*/'));
  }

  async hasColumn(table, column) {
    const sql = `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = :table
          AND column_name = :column
      )
    `;
    const exists = await this.namedJdbcTemplate.queryForObject(sql, { table, column }, Boolean);
    return exists === true;
  }

  async findOneIncludingDeleted(table, filter) {
    return this.findOne(table, filter);
  }

  async update(table, id, params) {
    if (params == null || mapSize(params) === 0) return null;

    const effective = new Map();
    for (const [key, value] of entriesOf(params)) {
      if (value == null) continue;
      if (key === 'id') continue;
      effective.set(key, value);
    }
    if (effective.size === 0) return null;

    const columns = Array.from(effective.keys());
    const setClause = columns.map((column) => `"${column}" = ?`).join(', ');
    const sql = `UPDATE "${table}" SET ${setClause} WHERE "id" = ? RETURNING *`;
    const values = columns.map((column) => this.convertValue(effective.get(column)));
    values.push(this.convertValue(id));

    const rows = await this.jdbc.query(sql, values, (row) => mapRowToMap(row));
    return rows.length === 0 ? null : rows[0];
  }

  async delete(table, id) {
    await this.jdbc.update(`DELETE FROM ${table} WHERE id = ?`, [this.convertValue(id)]);
  }

  /**
   * Java concatenates ids.stream() into the SQL, which stringifies the stream
   * object rather than the ids. This binds the collection as a real IN list.
   */
  async bulkDelete(table, ids) {
    const list = ids == null ? [] : Array.from(ids);
    if (list.length === 0) return;
    const placeholders = list.map((_, index) => `$${index + 1}`).join(', ');
    const sql = `UPDATE ${table} SET deletedAt = now() WHERE id IN (${placeholders})`;
    await this.jdbc.update(sql, list.map((id) => this.convertValue(id)));
  }

  async restoreById(table, id, restoredBy) {
    void restoredBy;
    const sql = `UPDATE ${table} SET deleted = false WHERE id = ? RETURNING *`;
    const rows = await this.jdbc.queryForList(sql, [this.convertValue(id)]);
    return rows.length === 0 ? null : rows[0];
  }

  async count(table, filter, queryFilters) {
    const params = {};
    if (filter != null) {
      for (const [key, value] of entriesOf(filter)) params[key] = value;
    }
    if (queryFilters != null) {
      for (const queryFilter of queryFilters) {
        params[queryFilter.field()] = queryFilter.value();
      }
    }

    const where = this.buildWhere(filter, queryFilters, {}, false);
    let sql = `SELECT COUNT(*) FROM ${this.quote(table)}`;
    if (where != null && where.trim() !== '') sql += ` WHERE ${where}`;

    const value = await this.namedJdbcTemplate.queryForObject(sql, params, Number);
    if (value == null) throw new TypeError('null');
    return value;
  }

  async findMany(meta, options) {
    const page = Math.max(1, options.page());
    const size = Math.max(1, options.size());
    const offset = (page - 1) * size;
    const normalizedFilter = this.normalizeFilters(options.filters());
    const softDeletable = meta.columns().has('deletedAt');
    const where = this.buildWhere(normalizedFilter, options.queryFilters(), {}, softDeletable);

    let sql = `SELECT * FROM ${meta.table()}`;
    if (where.trim() !== '') sql += ` WHERE ${where}`;

    const orderBy = options.orderBy();
    if (orderBy != null && mapSize(orderBy) > 0) {
      const clause = entriesOf(orderBy)
        .map(([key, direction]) => `${this.quote(key)} ${direction}`)
        .join(', ');
      sql += ` ORDER BY ${clause}`;
    }
    sql += ' LIMIT :limit OFFSET :offset';

    const params = { ...normalizedFilter };
    if (options.queryFilters() != null) {
      for (const queryFilter of options.queryFilters()) {
        params[queryFilter.field()] = queryFilter.value();
      }
    }
    params.limit = size;
    params.offset = offset;

    let rows;
    try {
      rows = await this.namedJdbcTemplate.queryForList(sql, params);
    } catch (error) {
      console.error(error);
      throw error;
    }

    const total = await this.count(meta.table(), normalizedFilter, options.queryFilters());
    return ListResultset.of(rows, page, size, total);
  }

  async exists(table, id) {
    let sql = `SELECT EXISTS (SELECT 1 FROM ${this.quote(table)} WHERE "id" = :id`;
    if (await this.hasColumn(table, 'deletedAt')) {
      sql += ' AND "deletedAt" IS NULL';
    }
    sql += ')';
    const exists = await this.namedJdbcTemplate.queryForObject(sql, { id }, Boolean);
    return exists === true;
  }

  buildWhere(filters, queryFilters, columnMappings, excludeSoftDeleted) {
    if (columnMappings == null) throw new TypeError('null');
    const clauses = [];

    if (excludeSoftDeleted) clauses.push('"deletedAt" IS NULL');

    if (filters != null && mapSize(filters) > 0) {
      for (const [key, value] of entriesOf(filters)) {
        if (value == null) continue;
        if (this.isIgnoredFilter(key)) continue;

        const base = this.stripOperator(this.stripRangeSuffix(key));
        const mapped = getOrDefault(columnMappings, base, base);
        const column = this.buildColumnExpression(mapped);
        let operator = '=';
        if (key.endsWith('__like')) operator = 'LIKE';
        else if (key.endsWith('__ilike')) operator = 'ILIKE';

        if (base.endsWith('Id') && isUuid(value)) {
          clauses.push(`${column} ${operator} CAST(:${key} AS UUID)`);
        } else {
          clauses.push(`${column} ${operator} :${key}`);
        }
      }
    }

    if (queryFilters != null) {
      for (const filter of queryFilters) {
        const mapped = getOrDefault(columnMappings, filter.field(), filter.field());
        const column = this.buildColumnExpression(mapped);
        const parameter = filter.field();
        const prefix = filter.prefix();
        switch (filter.operator()) {
          case Operator.EQUALS:
            if (parameter.endsWith('Id') && isUuid(filter.value())) {
              clauses.push(`${prefix}${column} = CAST(:${parameter} AS UUID)`);
            } else {
              clauses.push(`${prefix}${column} = :${parameter}`);
            }
            break;
          case Operator.LIKE:
            clauses.push(`${prefix}${column} LIKE :${parameter}`);
            break;
          case Operator.ILIKE:
            clauses.push(`${prefix}${column} ILIKE :${parameter}`);
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
            clauses.push(`${prefix}${column}::date = CAST(:${parameter} AS date)`);
            break;
          case Operator.GREATER_THAN_DATE:
            clauses.push(`${prefix}${column}::date > CAST(:${parameter} AS date)`);
            break;
          case Operator.GREATER_THAN_OR_EQUAL_DATE:
            clauses.push(`${prefix}${column}::date >= CAST(:${parameter} AS date)`);
            break;
          case Operator.LESS_THAN_DATE:
            clauses.push(`${prefix}${column}::date < CAST(:${parameter} AS date)`);
            break;
          case Operator.LESS_THAN_OR_EQUAL_DATE:
            clauses.push(`${prefix}${column}::date <= CAST(:${parameter} AS date)`);
            break;
          case Operator.BETWEEN:
            clauses.push(`${prefix}${column} BETWEEN CAST(:${parameter}Start AS date) AND CAST(:${parameter}End AS date)`);
            break;
          case Operator.NOT_BETWEEN:
            clauses.push(`${prefix}${column} NOT BETWEEN CAST(:${parameter}Start AS date) AND CAST(:${parameter}End AS date)`);
            break;
          case Operator.GREATER_THAN_TIMESTAMP:
            clauses.push(`${prefix}${column} > CAST(:${parameter} AS TIMESTAMPTZ)`);
            break;
          case Operator.GREATER_THAN_OR_EQUAL_TIMESTAMP:
            clauses.push(`${prefix}${column} >= CAST(:${parameter} AS TIMESTAMPTZ)`);
            break;
          case Operator.LESS_THAN_TIMESTAMP:
            clauses.push(`${prefix}${column} < CAST(:${parameter} AS TIMESTAMPTZ)`);
            break;
          case Operator.LESS_THAN_OR_EQUAL_TIMESTAMP:
            clauses.push(`${prefix}${column} <= CAST(:${parameter} AS TIMESTAMPTZ)`);
            break;
          case Operator.EQUALS_TIMESTAMP:
            clauses.push(`${prefix}${column} = CAST(:${parameter} AS TIMESTAMPTZ)`);
            break;
          case Operator.NOT_EQUALS_TIMESTAMP:
            clauses.push(`${prefix}${column} <> CAST(:${parameter} AS TIMESTAMPTZ)`);
            break;
          default:
            break;
        }
      }
    }

    return clauses.join(' AND ');
  }

  isIgnoredFilter(key) {
    return key === 'page' || key === 'size' || key === 'sortBy' || key === 'direction';
  }

  stripOperator(key) {
    if (key.endsWith('__like')) return key.slice(0, -6);
    if (key.endsWith('__ilike')) return key.slice(0, -7);
    return key;
  }

  stripRangeSuffix(key) {
    if (key.endsWith('Start')) return key.slice(0, -5);
    if (key.endsWith('End')) return key.slice(0, -3);
    return key;
  }

  buildColumnExpression(mapped) {
    if (mapped.includes('::')) {
      const splitAt = mapped.indexOf('::');
      return `${this.quote(mapped.slice(0, splitAt))}::${mapped.slice(splitAt + 2)}`;
    }
    return this.quote(mapped);
  }

  quote(column) {
    if (column == null) return null;
    if (column.includes('"') && !column.includes('.')) return column;
    if (column.includes('.')) {
      return column.split('.').map((part) => `"${part}"`).join('.');
    }
    return `"${column}"`;
  }

  append(arr, value) {
    const copy = arr.slice();
    copy.push(value);
    return copy;
  }

  convertValue(value) {
    if (value instanceof PGobject) return value.getValue();
    return convertBindValue(value);
  }

  async findAllBySql(
    sql,
    countSql,
    params,
    columnMappingsOrFilters,
    orderByOrMappings,
    pageOrOrderBy,
    sizeOrPage,
    mapperOrSize,
    maybeMapper,
  ) {
    if (Array.isArray(columnMappingsOrFilters)) {
      return this.findAllBySqlFull(
        sql,
        countSql,
        params,
        columnMappingsOrFilters,
        orderByOrMappings ?? {},
        pageOrOrderBy ?? {},
        sizeOrPage,
        mapperOrSize,
        maybeMapper,
      );
    }
    return this.findAllBySqlFull(
      sql,
      countSql,
      params,
      [],
      columnMappingsOrFilters ?? {},
      orderByOrMappings ?? {},
      pageOrOrderBy,
      sizeOrPage,
      mapperOrSize,
    );
  }

  async findAllBySqlFull(sql, countSql, params, queryFilters, columnMappings, orderBy, page, size, mapper) {
    page = Math.max(1, page);
    size = Math.max(1, size);
    const offset = (page - 1) * size;
    const queryParams = {};
    if (params != null) {
      for (const [key, value] of entriesOf(params)) queryParams[key] = value;
    }
    if (queryFilters != null) {
      for (const filter of queryFilters) queryParams[filter.field()] = filter.value();
    }
    queryParams.limit = size;
    queryParams.offset = offset;

    const whereClause = this.buildWhere(params, queryFilters, columnMappings, false);
    let dataSql = sql;
    let countQuery = countSql;
    if (whereClause.trim() !== '') {
      if (dataSql.includes('/*WHERE_CLAUSE*/')) {
        dataSql = dataSql.replace('/*WHERE_CLAUSE*/', ` WHERE ${whereClause}`);
        countQuery = countQuery.replace('/*WHERE_CLAUSE*/', ` WHERE ${whereClause}`);
      } else if (this.hasWhereClause(dataSql)) {
        dataSql += ` AND ${whereClause}`;
        countQuery += ` AND ${whereClause}`;
      } else {
        dataSql = insertWhereClause(dataSql, whereClause);
        countQuery = insertWhereClause(countQuery, whereClause);
      }
    }

    if (orderBy != null && mapSize(orderBy) > 0) {
      const orderByClause = entriesOf(orderBy)
        .map(([key, direction]) => `${this.quote(getOrDefault(columnMappings, key, key))} ${direction}`)
        .join(', ');
      dataSql += ` ORDER BY ${orderByClause}`;
    }
    dataSql += ' LIMIT :limit OFFSET :offset';

    let rows = null;
    try {
      rows = await this.namedJdbcTemplate.query(dataSql, queryParams, mapper);
    } catch (error) {
      if (error instanceof BadSqlGrammarException) {
        console.error(error.getSql());
        console.error(error.getSQLException()?.message);
      } else {
        throw error;
      }
    }

    const total = await this.namedJdbcTemplate.queryForObject(countQuery, queryParams, Number);
    return ListResultset.of(rows, page, size, total == null ? 0 : total);
  }

  async findOneBySql(sql, params, mapper) {
    try {
      const rows = await this.namedJdbcTemplate.query(sql, params ?? {}, mapper);
      if (rows.length !== 1) {
        throw new IncorrectResultSizeDataAccessException(1, rows.length);
      }
      return rows[0];
    } catch (error) {
      console.log(sql);
      console.log(params);
      console.log(error.message);
      console.log(error.cause);
      console.log(error.stack);
      throw error;
    }
  }

  async executeSql(sql, params) {
    await this.namedJdbcTemplate.update(sql, params ?? {});
  }

  handleFilterTypes(_filterType, _value) {}

  normalizeFilters(filters) {
    if (filters == null || mapSize(filters) === 0) return {};
    const normalized = {};
    for (const [key, value] of entriesOf(filters)) {
      if (value == null) {
        normalized[key] = null;
        continue;
      }
      if ((key.endsWith('__like') || key.endsWith('__ilike')) && typeof value === 'string') {
        normalized[key] = `%${value.trim()}%`;
        continue;
      }
      if (this.isBooleanField(key)) {
        normalized[key] = this.convertBoolean(value);
        continue;
      }
      normalized[key] = value;
    }
    return normalized;
  }

  async findExistingIds(table, ids) {
    const list = ids == null ? [] : Array.from(ids);
    if (list.length === 0) return new Set();
    const result = await this.db.query(
      `select id from ${table} where id = ANY($1::uuid[])`,
      [list.map((id) => (id instanceof Uuid ? id.toString() : String(id)))],
    );
    return new Set(result.rows.map((row) => asUuid(row.id)));
  }

  isBooleanField(key) {
    if (!key.startsWith('is') || key.length <= 2) return false;
    const code = key.charCodeAt(2);
    return code >= 65 && code <= 90;
  }

  convertBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (Number.isNaN(value)) return false;
      if (!Number.isFinite(value)) return true;
      return Math.trunc(value) !== 0;
    }
    if (typeof value === 'string') {
      const text = value.trim().toLowerCase();
      switch (text) {
        case 'true':
        case '1':
        case 'yes':
          return true;
        case 'false':
        case '0':
        case 'no':
          return false;
        default:
          return text === 'true';
      }
    }
    return false;
  }
}
