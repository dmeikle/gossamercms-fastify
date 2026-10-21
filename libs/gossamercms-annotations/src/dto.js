/**
 * Small DTO utilities inspired by Lombok's constructor and builder patterns.
 * These helpers work with plain JavaScript classes and do not require decorators.
 */

export function createBuilder(DtoClass, initialValues = {}) {
  if (typeof DtoClass !== "function") {
    throw new TypeError("DtoClass must be a constructor");
  }

  const values = { ...initialValues };
  const builder = {};

  const fieldNames = new Set([
    ...Object.keys(initialValues),
    ...(DtoClass.fields ?? [])
  ]);

  for (const fieldName of fieldNames) {
    builder[fieldName] = (value) => {
      values[fieldName] = value;
      return builder;
    };
  }

  builder.build = () => new DtoClass({ ...values });
  return builder;
}

/**
 * Adds static builder() and instance toBuilder() methods to a DTO class.
 * Call once after declaring the class:
 *   withBuilder(UserDto, ["id", "email", "firstname"]);
 */
export function withBuilder(DtoClass, fields = []) {
  if (typeof DtoClass !== "function") {
    throw new TypeError("DtoClass must be a constructor");
  }

  const normalizedFields = [...new Set(fields)];
  Object.defineProperty(DtoClass, "fields", {
    configurable: true,
    enumerable: false,
    writable: false,
    value: Object.freeze(normalizedFields)
  });

  Object.defineProperty(DtoClass, "builder", {
    configurable: true,
    enumerable: false,
    writable: false,
    value: (initialValues = {}) => createBuilder(DtoClass, initialValues)
  });

  if (!Object.hasOwn(DtoClass.prototype, "toBuilder")) {
    Object.defineProperty(DtoClass.prototype, "toBuilder", {
      configurable: true,
      enumerable: false,
      writable: false,
      value() {
        const values = {};
        for (const field of normalizedFields) {
          values[field] = this[field] ?? null;
        }
        return createBuilder(DtoClass, values);
      }
    });
  }

  return DtoClass;
}

/** Convenience helper for creating an object from a DTO class and values. */
export function instantiate(DtoClass, values = {}) {
  return new DtoClass(values);
}
