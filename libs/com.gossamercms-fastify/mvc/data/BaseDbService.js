import { ApiException } from '../exceptions/ApiException.js';
import { DbSaveException } from '../exceptions/DbSaveException.js';
import { NotFoundException } from '../exceptions/NotFoundException.js';
import { isJsonColumn } from '../helpers/annotations/JsonColumn.js';
import { toJsonb } from '../helpers/JsonbHelper.js';
import { BaseModel } from '../models/BaseModel.js';
import { mapRowToDto } from '../util/ReflectionUtils.js';
import { IllegalArgumentException } from '../util/exceptions.js';
import { entriesOf, javaMapToString } from '../util/maps.js';
import {
  Instant,
  JavaBoolean,
  JavaPrimitiveBoolean,
  Timestamp,
  UUID,
  Uuid,
  parseBoolean,
} from '../util/uuid.js';
import { BeanPropertySqlParameterSource, Types } from './namedParameters.js';
import { ListResultset } from './ListResultset.js';

const BATCH_EXCLUDED = new Set(['id', 'createdon', 'created_on']);

function hasDeclaredField(entity, name) {
  if (Object.prototype.hasOwnProperty.call(entity, name)) {
    return typeof entity[name] !== 'function';
  }
  const desc = Object.getOwnPropertyDescriptor(entity.constructor?.prototype, name);
  return Boolean(desc && (desc.get || desc.set));
}

function classIsInstance(expectedType, value) {
  if (expectedType == null) return false;
  if (typeof expectedType.isInstance === 'function') return expectedType.isInstance(value);
  if (expectedType === String) return typeof value === 'string' || value instanceof String;
  if (expectedType === Boolean) return typeof value === 'boolean';
  if (expectedType === Number) return typeof value === 'number';
  if (typeof expectedType === 'function') return value instanceof expectedType;
  return false;
}

function isPgError(error) {
  return Boolean(
    error
    && typeof error.code === 'string'
    && /^[0-9A-Z]{5}$/.test(error.code)
    && error.severity,
  );
}

function extractSafeMessage(error) {
  let cause = error;
  while (cause) {
    if (isPgError(cause) && cause.message) return cause.message;
    cause = cause.cause;
  }
  return error?.message;
}

function mapOverride(entity, overrideClass) {
  try {
    return new overrideClass(entity);
  } catch (cause) {
    const error = new Error('DTO mapping failed');
    error.cause = cause;
    throw error;
  }
}

export class BaseDbService {
  constructor(modelClass, dtoClass, dsManager) {
    if (new.target === BaseDbService) {
      throw new TypeError('BaseDbService is abstract');
    }
    this.meta = BaseModel.metaOf(modelClass);
    this.dtoClass = dtoClass;
    this.dsManager = dsManager;
    this.batchUpdateSql = this.buildBatchUpdateSql(this.meta);

    const mapImpl = this.mapToDto;
    const self = this;
    this.mapToDto = function mapToDto(entity, overrideClass) {
      if (arguments.length >= 2) return mapOverride(entity, overrideClass);
      return mapImpl.call(self, entity);
    };
  }

  mapToEntity(dto) {
    return dto.toEntity();
  }

  mapToDto(entity) {
    return mapRowToDto(entity, this.dtoClass);
  }

  removeExcludedFields(_dto) {
    throw new Error(`${this.constructor.name} must implement removeExcludedFields(dto)`);
  }

  buildBatchUpdateSql(meta) {
    const assignments = [];
    for (const columnName of meta.columns().keys()) {
      if (!BATCH_EXCLUDED.has(String(columnName).toLowerCase())) {
        assignments.push(`${columnName} = :${columnName}`);
      }
    }
    return `UPDATE ${meta.table()} SET ${assignments.join(', ')} WHERE id = :id`;
  }

  createFilter(params) {
    const validated = new Map();
    for (const [key, value] of entriesOf(params)) {
      const expectedType = this.meta.columns().get(key);
      if (expectedType == null) {
        throw new IllegalArgumentException(`Unknown column: ${key}`);
      }
      if (value == null) {
        validated.set(key, null);
        continue;
      }
      validated.set(key, this.convertFilterValue(expectedType, value));
    }
    return validated;
  }

  convertFilterValue(expectedType, value) {
    if (classIsInstance(expectedType, value)) return value;

    if (expectedType === UUID || expectedType === Uuid) {
      if (typeof value === 'string' || value instanceof Uuid) return Uuid.fromString(String(value));
      return value;
    }

    if (expectedType === Instant && value instanceof Timestamp) {
      return value.toInstant();
    }

    if (
      (expectedType === Boolean || expectedType === JavaBoolean || expectedType === JavaPrimitiveBoolean)
      && typeof value === 'string'
    ) {
      return parseBoolean(value);
    }

    return value;
  }

  getOrderBy() {
    return Object.freeze({ id: 'asc' });
  }

  getOrderByCustom() {
    return Object.freeze({});
  }

  getExcludedFields() {
    return [];
  }

  assignGenerated(entity, name, value, label, { onlyIfNull = false } = {}) {
    if (!hasDeclaredField(entity, name)) return;
    try {
      if (onlyIfNull && entity[name] != null) return;
      entity[name] = value;
    } catch (error) {
      console.error(error);
      throw new Error(label, { cause: error });
    }
  }

  async create(createdBy, dto) {
    const ds = this.dsManager.get(this.meta.datasourceKey());
    const entity = await this.mapToEntity(dto);
    const now = new Date();

    this.assignGenerated(entity, 'id', Uuid.randomUUID(), 'Failed to auto-generate ID');
    this.assignGenerated(entity, 'createdOn', now, 'Failed to set createdOn', { onlyIfNull: true });
    this.assignGenerated(entity, 'createdAt', now, 'Failed to set createdAt', { onlyIfNull: true });
    this.assignGenerated(entity, 'updatedAt', now, 'Failed to set updatedAt', { onlyIfNull: true });
    this.assignGenerated(entity, 'createdBy', createdBy, 'Failed to set createdBy', { onlyIfNull: true });

    const params = this.buildParamsForSave(entity);
    try {
      await ds.save(this.meta.table(), params);
    } catch (error) {
      console.error(error);
      throw new DbSaveException(extractSafeMessage(error));
    }
    return this.mapToDto(entity);
  }

  buildParamsForSave(entity) {
    const params = {};
    try {
      for (const columnName of this.meta.columns().keys()) {
        if (!hasDeclaredField(entity, columnName)) {
          throw new Error(`NoSuchFieldException: ${columnName}`);
        }
        const value = entity[columnName];
        params[columnName] = isJsonColumn(entity, columnName) ? toJsonb(value) : value;
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to build params for save', { cause: error });
    }
    return params;
  }

  async getById(id) {
    const ds = this.dsManager.get(this.meta.datasourceKey());
    const row = await ds.findOne(this.meta.table(), new Map([['id', id]]));
    if (row == null) this.throw404(`id=${id}`);
    const dto = mapRowToDto(row, this.dtoClass);
    return this.removeExcludedFields(dto);
  }

  async get(params) {
    const ds = this.dsManager.get(this.meta.datasourceKey());
    const filter = this.createFilter(params);
    const row = await ds.findOne(this.meta.table(), filter);
    if (row == null) this.throw404(javaMapToString(filter));
    const dto = mapRowToDto(row, this.dtoClass);
    return this.removeExcludedFields(dto);
  }

  async getOrNull(params) {
    try {
      return await this.get(params);
    } catch {
      return null;
    }
  }

  async updateById(updatedBy, dto, id) {
    void updatedBy;
    const ds = this.dsManager.get(this.meta.datasourceKey());
    const entity = await this.mapToEntity(dto);
    const params = this.buildParamsForSave(entity);
    const row = await ds.update(this.meta.table(), id, params);
    if (row == null) throw new TypeError('null');
    const updatedDto = mapRowToDto(row, this.dtoClass);
    return this.removeExcludedFields(updatedDto);
  }

  async update(updatedBy, dto, params) {
    const filter = this.createFilter(params);
    const existing = await this.get(filter);
    return this.updateById(updatedBy, dto, existing.getId());
  }

  async getAll(options) {
    const ds = this.dsManager.get(this.meta.datasourceKey());
    // Java validates these, then still queries with the original options.
    this.createFilter(options.filters());
    this.validateOrderBy(options.orderBy());

    const raw = await ds.findMany(this.meta, options);
    const dtos = [];
    for (const row of raw.list) {
      dtos.push(mapRowToDto(row, this.dtoClass));
    }
    return new ListResultset(dtos, raw.page, raw.pageSize, raw.totalCount, raw.totalPages);
  }

  validateOrderBy(orderBy) {
    const validated = new Map();
    for (const [key, value] of entriesOf(orderBy)) {
      if (!this.meta.columns().has(key)) {
        throw new IllegalArgumentException(`Unknown column in orderBy: ${key}`);
      }
      if (value == null) throw new TypeError('null');
      const direction = String(value).toLowerCase();
      if (direction !== 'asc' && direction !== 'desc') {
        throw new IllegalArgumentException(`Invalid sort direction: ${value}`);
      }
      validated.set(key, direction);
    }
    return validated;
  }

  async createOrReplaceBulk(createdBy, dtos, deleteExistingKey) {
    const ds = this.dsManager.get(this.meta.datasourceKey());
    const keyCount = deleteExistingKey instanceof Map
      ? deleteExistingKey.size
      : Object.keys(deleteExistingKey).length;

    if (keyCount > 0) {
      const where = entriesOf(deleteExistingKey)
        .map(([key]) => `"${key}" = :${key}`)
        .join(' AND ');
      const params = {};
      for (const [key, value] of entriesOf(deleteExistingKey)) params[key] = value;
      params.deletedBy = createdBy;
      const sql = `UPDATE "${this.meta.table()}"
SET "deletedAt" = now(),
    "deletedBy" = :deletedBy
WHERE ${where}
AND "deletedAt" IS NULL
`;
      await ds.executeSql(sql, params);
    }

    const saved = [];
    for (const dto of dtos) {
      saved.push(await this.create(createdBy, dto));
    }
    return ListResultset.of(saved, 1, -1, saved.length);
  }

  async deleteById(deletedBy, id) {
    void deletedBy;
    const ds = this.dsManager.get(this.meta.datasourceKey());
    if (!(await ds.exists(this.meta.table(), id))) {
      this.throw404(`Record not found: ${id}`);
    }
    await ds.delete(this.meta.table(), id);
  }

  async delete(deletedBy, params) {
    const filter = this.createFilter(params);
    const dto = await this.get(filter);
    await this.deleteById(deletedBy, dto.getId());
  }

  async restoreById(restoredBy, id) {
    const ds = this.dsManager.get(this.meta.datasourceKey());
    const restored = await ds.restoreById(this.meta.table(), id, restoredBy);
    if (restored == null) {
      this.throw404(`Record not found or not deleted: ${id}`);
    }
    const dto = await this.dtoFromLoaded(restored);
    return this.removeExcludedFields(dto);
  }

  async restore(restoredBy, params) {
    const filter = this.createFilter(params);
    const deletedRecord = await this.getIncludingDeleted(filter);
    return this.restoreById(restoredBy, deletedRecord.getId());
  }

  async getIncludingDeleted(params) {
    const filter = this.createFilter(params);
    const ds = this.dsManager.get(this.meta.datasourceKey());
    const entity = await ds.findOneIncludingDeleted(this.meta.table(), filter);
    if (entity == null) {
      this.throw404(`Record not found (including deleted): ${javaMapToString(filter)}`);
    }
    const dto = await this.dtoFromLoaded(entity);
    return this.removeExcludedFields(dto);
  }

  /**
   * PostgresAdapter returns a row object. The Java service casts that row to
   * the entity type. Rows are mapped with mapRowToDto; BaseModel instances
   * still go through mapToDto.
   */
  async dtoFromLoaded(value) {
    if (value instanceof BaseModel) return this.mapToDto(value);
    return mapRowToDto(value, this.dtoClass);
  }

  async optionalGet(params) {
    try {
      return await this.get(params);
    } catch (error) {
      if (error instanceof ApiException && error.getStatus() === 404) return null;
      throw error;
    }
  }

  throw404(id) {
    throw new NotFoundException(id);
  }

  toInstant(value) {
    if (value == null) return null;
    if (value instanceof Timestamp) return value.toInstant();
    if (value instanceof Date) return value;
    throw new IllegalArgumentException(`Unsupported timestamp type: ${value.constructor?.name ?? typeof value}`);
  }

  isUuid(value) {
    try {
      Uuid.fromString(value);
      return true;
    } catch (error) {
      if (error instanceof IllegalArgumentException) return false;
      throw error;
    }
  }

  normalizeFilters(filters) {
    const normalized = {};
    for (const [key, value] of entriesOf(filters)) normalized[key] = value;
    for (const [key, value] of Object.entries(normalized)) {
      if (!key.startsWith('is')) continue;
      if (typeof value === 'string') {
        const text = value.trim().toLowerCase();
        if (text === 'true' || text === '1' || text === 'yes') normalized[key] = true;
        else if (text === 'false' || text === '0' || text === 'no') normalized[key] = false;
        else normalized[key] = text === 'true';
      } else if (typeof value === 'number') {
        normalized[key] = Number.isFinite(value) ? Math.trunc(value) !== 0 : false;
      }
    }
    return normalized;
  }

  async updateAll(updatedBy, dtos) {
    void updatedBy;
    if (dtos == null || dtos.length === 0) return [];
    const ds = this.dsManager.get(this.meta.datasourceKey());
    const jdbcTemplate = ds.getNamedParameterJdbcTemplate();
    const batchParams = dtos.map((dto) => {
      const paramSource = new BeanPropertySqlParameterSource(dto);
      paramSource.registerSqlType('updatedBy', Types.OTHER);
      return paramSource;
    });
    await jdbcTemplate.batchUpdate(this.batchUpdateSql, batchParams);
    return dtos;
  }
}
