
export function defineDto(fields) {
  return Object.freeze({
    kind: 'dto',
    fields: Object.freeze({ ...fields }),
  });
}

export class BaseDto {
  constructor(values = {}) {
    const fields = this.constructor.META?.fields ?? {};

    for (const [name, definition] of Object.entries(fields)) {
      this[name] = values[name] ?? definition.default ?? null;
    }

    // Preserve extra fields only if the framework explicitly
    // enables this behavior in a future extension.
  }

  getId() {
    return this.id ?? null;
  }

  toObject(fieldNames) {
    const names = fieldNames ?? Object.keys(
      this.constructor.META?.fields ?? {}
    );

    return Object.fromEntries(
      names.map(name => [name, this[name]])
    );
  }

  static builder(initialValues = {}) {
    const fields = Object.keys(this.META?.fields ?? {});
    const values = { ...initialValues };
    const builder = {};

    for (const field of fields) {
      builder[field] = value => {
        values[field] = value;
        return builder;
      };
    }

    builder.build = () => new this(values);
    return builder;
  }

  toBuilder() {
    return this.constructor.builder(this.toObject());
  }

  toEntity() {
    throw new Error(
        `${this.constructor.name} must implement toEntity()`,
    );
  }
}
