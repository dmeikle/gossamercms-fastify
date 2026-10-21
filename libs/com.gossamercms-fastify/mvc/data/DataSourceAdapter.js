import { UnsupportedOperationException } from '../util/exceptions.js';

export class DataSourceAdapter {
  key() {
    throw new Error(`${this.constructor.name}.key() is abstract`);
  }

  async save() {
    throw new Error(`${this.constructor.name}.save() is abstract`);
  }

  getNamedParameterJdbcTemplate() {
    throw new Error(`${this.constructor.name}.getNamedParameterJdbcTemplate() is abstract`);
  }

  async find() {
    throw new Error(`${this.constructor.name}.find() is abstract`);
  }

  async findOne() {
    throw new Error(`${this.constructor.name}.findOne() is abstract`);
  }

  async findOneIncludingDeleted() {
    throw new Error(`${this.constructor.name}.findOneIncludingDeleted() is abstract`);
  }

  async update() {
    throw new Error(`${this.constructor.name}.update() is abstract`);
  }

  async delete() {
    throw new Error(`${this.constructor.name}.delete() is abstract`);
  }

  async bulkDelete() {
    throw new Error(`${this.constructor.name}.bulkDelete() is abstract`);
  }

  async restoreById() {
    throw new Error(`${this.constructor.name}.restoreById() is abstract`);
  }

  async count() {
    throw new Error(`${this.constructor.name}.count() is abstract`);
  }

  async findMany() {
    throw new Error(`${this.constructor.name}.findMany() is abstract`);
  }

  async exists() {
    throw new UnsupportedOperationException('exists() not supported');
  }

  async findAllBySql() {
    throw new Error(`${this.constructor.name}.findAllBySql() is abstract`);
  }

  async findOneBySql() {
    throw new Error(`${this.constructor.name}.findOneBySql() is abstract`);
  }

  async executeSql() {
    throw new Error(`${this.constructor.name}.executeSql() is abstract`);
  }

  buildWhere() {
    throw new Error(`${this.constructor.name}.buildWhere() is abstract`);
  }

  async findExistingIds() {
    throw new Error(`${this.constructor.name}.findExistingIds() is abstract`);
  }
}
