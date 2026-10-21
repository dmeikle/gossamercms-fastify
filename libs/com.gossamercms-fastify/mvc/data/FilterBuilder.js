function mapOf(key, value) {
  if (key == null || value == null) {
    throw new TypeError('null key or value');
  }
  return Object.freeze({ [key]: value });
}

export class FilterBuilder {
  constructor() {
    this.filters = {};
  }

  static create() {
    return new FilterBuilder();
  }

  eq(field, value) {
    this.filters[field] = mapOf('$eq', value);
    return this;
  }

  neq(field, value) {
    this.filters[field] = mapOf('$neq', value);
    return this;
  }

  gt(field, value) {
    this.filters[field] = mapOf('$gt', value);
    return this;
  }

  gte(field, value) {
    this.filters[field] = mapOf('$gte', value);
    return this;
  }

  lt(field, value) {
    this.filters[field] = mapOf('$lt', value);
    return this;
  }

  lte(field, value) {
    this.filters[field] = mapOf('$lte', value);
    return this;
  }

  contains(field, value) {
    this.filters[field] = mapOf('$contains', value);
    return this;
  }

  startsWith(field, value) {
    this.filters[field] = mapOf('$startsWith', value);
    return this;
  }

  endsWith(field, value) {
    this.filters[field] = mapOf('$endsWith', value);
    return this;
  }

  in(field, values) {
    this.filters[field] = mapOf('$in', values);
    return this;
  }

  and(...builders) {
    const list = [];
    for (const builder of builders) {
      list.push(builder.build());
    }
    this.filters.$and = Object.freeze(list);
    return this;
  }

  or(...builders) {
    const list = [];
    for (const builder of builders) {
      list.push(builder.build());
    }
    this.filters.$or = Object.freeze(list);
    return this;
  }

  not(builder) {
    this.filters.$not = builder.build();
    return this;
  }

  nested(field, nested) {
    this.filters[field] = nested.build();
    return this;
  }

  build() {
    return Object.freeze({ ...this.filters });
  }
}
