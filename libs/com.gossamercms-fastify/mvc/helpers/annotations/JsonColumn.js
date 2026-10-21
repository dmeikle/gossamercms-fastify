const registry = new WeakMap();

/**
 * Marks a field as JSONB. Call JsonColumn(EntityClass, 'fieldName'),
 * or set static jsonColumns = ['fieldName'] on the entity class.
 * Stands in for the Java @JsonColumn annotation.
 */
export function JsonColumn(target, property) {
  let names = registry.get(target);
  if (!names) {
    names = new Set();
    registry.set(target, names);
  }
  names.add(property);
  return target;
}

export function isJsonColumn(entity, name) {
  if (entity == null) return false;
  let ctor = entity.constructor;
  while (ctor && ctor !== Function.prototype && ctor !== Object) {
    const names = registry.get(ctor);
    if (names?.has(name)) return true;
    const declared = ctor.jsonColumns;
    if (Array.isArray(declared) && declared.includes(name)) return true;
    if (declared instanceof Set && declared.has(name)) return true;
    ctor = Object.getPrototypeOf(ctor);
  }
  return false;
}
