import {
  defineClassMetadata,
  definePropertyMetadata
} from "./metadata.js";

/**
 * Class decorator. Supports legacy decorator invocation:
 *   @Model({ table: "users" })
 *   class User {}
 *
 * It can also be called explicitly in plain JavaScript:
 *   Model({ table: "users" })(User);
 */
export function Model(options = {}) {
  return (target) => defineClassMetadata(target, {
    kind: "model",
    ...options
  });
}

/**
 * Property decorator. Supports legacy TypeScript/Babel decorator invocation:
 *   @Column({ type: String, length: 50 })
 *   firstname;
 *
 * Plain-JavaScript alternative:
 *   Column({ type: String, length: 50 })(User.prototype, "firstname");
 */
export function Column(options = {}) {
  return (target, propertyName) => {
    if (propertyName === undefined) {
      throw new TypeError(
        "Column must decorate a class property; use Column(options)(Class.prototype, 'propertyName') in plain JavaScript"
      );
    }
    return definePropertyMetadata(target, propertyName, {
      kind: "column",
      ...options
    });
  };
}

/** Class decorator for DTO metadata. */
export function Dto(options = {}) {
  return (target) => defineClassMetadata(target, {
    kind: "dto",
    ...options
  });
}

/** Property decorator for DTO fields. */
export function Field(options = {}) {
  return (target, propertyName) => {
    if (propertyName === undefined) {
      throw new TypeError(
        "Field must decorate a class property; use Field(options)(Class.prototype, 'propertyName') in plain JavaScript"
      );
    }
    return definePropertyMetadata(target, propertyName, {
      kind: "field",
      ...options
    });
  };
}

/**
 * Legacy method decorator marker for generated/declared builder conventions.
 * It records intent only; it does not rewrite the class or generate methods.
 */
export function Builder(options = {}) {
  return (target) => defineClassMetadata(target, {
    builder: Object.freeze({ enabled: true, ...options })
  });
}
