import { IllegalStateException } from '../util/exceptions.js';
import { Instant, UUID } from '../util/uuid.js';

function unmodifiableMap(entries) {
  const map = new Map(entries);
  map.set = () => {
    throw new TypeError('unmodifiable map');
  };
  map.delete = () => {
    throw new TypeError('unmodifiable map');
  };
  map.clear = () => {
    throw new TypeError('unmodifiable map');
  };
  return map;
}

export class ModelMeta {
  constructor(table, columns, datasourceKey, defaultSort, lengths) {
    this._table = table;
    this._columns = unmodifiableMap(columns instanceof Map ? columns.entries() : Object.entries(columns));
    this._datasourceKey = datasourceKey ?? null;
    this._defaultSort = defaultSort ?? null;
    this._lengths = unmodifiableMap(lengths instanceof Map ? lengths.entries() : Object.entries(lengths));
  }

  table() {
    return this._table;
  }

  defaultSort() {
    return this._defaultSort;
  }

  columns() {
    return this._columns;
  }

  datasourceKey() {
    return this._datasourceKey;
  }

  length(name) {
    return this._lengths.has(name) ? this._lengths.get(name) : null;
  }

  static of(modelClass) {
    const name = modelClass?.name ?? String(modelClass);
    if (modelClass == null || !Object.hasOwn(modelClass, 'META')) {
      throw new IllegalStateException(
        `Model class ${name} must define: public static final ModelMeta META`,
      );
    }
    try {
      const value = modelClass.META;
      if (!(value instanceof ModelMeta)) {
        throw new IllegalStateException(`META field in ${name} is not a ModelMeta`);
      }
      return value;
    } catch (error) {
      if (error instanceof IllegalStateException) throw error;
      throw new Error(`Failed to load ModelMeta from ${name}`, { cause: error });
    }
  }

  static builder() {
    return new ModelMetaBuilder();
  }

  static builderWithId(table) {
    return ModelMeta.builder()
      .table(table)
      .datasource('postgres')
      .column('id', UUID, 100);
  }

  static auditable(table) {
    return ModelMeta.builderWithId(table)
      .column('createdAt', Instant);
  }

  static updateable(table) {
    return ModelMeta.builderWithId(table)
      .column('createdAt', Instant)
      .column('updatedAt', Instant);
  }
}

export class ModelMetaBuilder {
  constructor() {
    this._table = undefined;
    this._datasourceKey = undefined;
    this._columns = new Map();
    this._lengths = new Map();
    this._defaultSort = undefined;
  }

  table(table) {
    this._table = table;
    return this;
  }

  column(name, type, length) {
    this._columns.set(name, type);
    if (arguments.length >= 3) {
      this._lengths.set(name, length);
    }
    return this;
  }

  datasource(key) {
    this._datasourceKey = key;
    return this;
  }

  defaultSort(defaultSort) {
    this._defaultSort = defaultSort;
    return this;
  }

  build() {
    return new ModelMeta(
      this._table,
      this._columns,
      this._datasourceKey,
      this._defaultSort,
      this._lengths,
    );
  }
}
