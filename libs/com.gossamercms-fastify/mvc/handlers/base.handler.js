
import { randomUUID } from 'node:crypto';

export class BaseHandler {
    #db;

    constructor(db) {
        if (new.target === BaseHandler) {
            throw new TypeError(
                'BaseHandler is abstract and cannot be instantiated directly',
            );
        }

        if (!db) {
            throw new TypeError('BaseHandler requires a db service');
        }

        this.#db = db;
    }

    // GET

    getById(id) {
        return this.#db.getById(id);
    }

    get(params) {
        return this.#db.get(params);
    }

    getAll(options) {
        return this.#db.getAll(options);
    }

    // CREATE

    async create(createdBy, dto) {
        const now = new Date();

        this.applyFrameworkFields(dto, randomUUID(), now, now);

        return this.#db.create(createdBy, dto);
    }

    // UPDATE

    updateById(updatedBy, id, dto) {
        this.applyUpdatedAt(dto, new Date());

        return this.#db.updateById(updatedBy, dto, id);
    }

    update(updatedBy, dto, params) {
        this.applyUpdatedAt(dto, new Date());

        return this.#db.update(updatedBy, dto, params);
    }

    // DELETE

    deleteById(deletedBy, id) {
        return this.#db.deleteById(deletedBy, id);
    }

    delete(deletedBy, params) {
        return this.#db.delete(deletedBy, params);
    }

    // RESTORE

    restoreById(restoredBy, id) {
        return this.#db.restoreById(restoredBy, id);
    }

    // BULK

    createOrReplaceBulk(deletedBy, dtos, deleteExistingKey) {
        return this.#db.createOrReplaceBulk(
            deletedBy,
            dtos,
            deleteExistingKey,
        );
    }

    // INTERNAL HELPERS

    applyFrameworkFields(dto, id, createdAt, updatedAt) {
        this.setIfExists(dto, 'id', id);
        this.setIfExists(dto, 'createdAt', createdAt);
        this.setIfExists(dto, 'updatedAt', updatedAt);

        // Support alternate naming conventions.
        this.setIfExists(dto, 'createdOn', createdAt);
        this.setIfExists(dto, 'updatedOn', updatedAt);
    }

    applyUpdatedAt(dto, updatedAt) {
        this.setIfExists(dto, 'updatedAt', updatedAt);
        this.setIfExists(dto, 'updatedOn', updatedAt);
    }

    setIfExists(dto, property, value) {
        if (dto == null || typeof dto !== 'object') {
            throw new TypeError('Expected a DTO object');
        }

        // Check instance properties and declared DTO metadata.
        const fields = dto.constructor?.META?.fields;

        if (
            Object.hasOwn(dto, property) ||
            (fields != null && Object.hasOwn(fields, property))
        ) {
            dto[property] = value;
        }
    }
}
