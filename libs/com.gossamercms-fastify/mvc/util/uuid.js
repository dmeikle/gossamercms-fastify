import { randomUUID } from 'node:crypto';
import { IllegalArgumentException } from './exceptions.js';

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isUuidString(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

export class Uuid {
  constructor(value) {
    const text = String(value);
    if (!isUuidString(text)) {
      throw new IllegalArgumentException(`Invalid UUID string: ${value}`);
    }
    this.value = text.toLowerCase();
  }

  toString() {
    return this.value;
  }

  toJSON() {
    return this.value;
  }

  static fromString(value) {
    return new Uuid(value);
  }

  static randomUUID() {
    return new Uuid(randomUUID());
  }
}

/** Java UUID.class token. Identity-compared by BaseDbService.convertFilterValue. */
export const UUID = Object.freeze({
  name: 'java.util.UUID',
  isInstance(value) {
    return value instanceof Uuid;
  },
});

export class Timestamp {
  constructor(date) {
    this.date = date instanceof Date ? date : new Date(date);
  }

  toInstant() {
    return this.date;
  }
}

/** Java Instant.class token. java.time.Instant values are Date objects. */
export const Instant = Object.freeze({
  name: 'java.time.Instant',
  isInstance(value) {
    return value instanceof Date && !(value instanceof Timestamp);
  },
});

export const JavaBoolean = Object.freeze({
  name: 'java.lang.Boolean',
  isInstance(value) {
    return typeof value === 'boolean';
  },
});

export const JavaPrimitiveBoolean = Object.freeze({
  name: 'boolean',
  isInstance(value) {
    return typeof value === 'boolean';
  },
});

export function parseBoolean(value) {
  return String(value).toLowerCase() === 'true';
}

export function isUuid(value) {
  if (value == null) return false;
  if (value instanceof Uuid) return true;
  if (typeof value === 'string') return isUuidString(value);
  return false;
}
