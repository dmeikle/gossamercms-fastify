/**
 * Metadata registry for models and DTOs.
 *
 * This package deliberately does not depend on Fastify, an ORM, or TypeScript.
 * Decorators are metadata declarations; they do not generate JavaScript fields
 * or methods by themselves.
 */

const metadataByClass = new WeakMap();

function cloneColumnOptions(options = {}) {
  return Object.freeze({ ...options });
}

export function defineClassMetadata(target, metadata) {
  if (typeof target !== "function") {
    throw new TypeError("Metadata target must be a class constructor");
  }
  const existing = metadataByClass.get(target) ?? {};
  metadataByClass.set(target, Object.freeze({ ...existing, ...metadata }));
  return target;
}

export function definePropertyMetadata(target, propertyName, metadata) {
  const ctor = typeof target === "function" ? target : target?.constructor;
  if (typeof ctor !== "function") {
    throw new TypeError("Property metadata target must be a class or instance");
  }

  const existing = metadataByClass.get(ctor) ?? {};
  const properties = { ...(existing.properties ?? {}) };
  properties[propertyName] = Object.freeze({
    ...(properties[propertyName] ?? {}),
    ...metadata
  });

  metadataByClass.set(ctor, Object.freeze({
    ...existing,
    properties: Object.freeze(properties)
  }));
  return target;
}

/**
 * Returns metadata for a class, including inherited class and property metadata.
 * Child class property declarations override parent declarations with same name.
 */
export function getMetadata(target) {
  if (typeof target !== "function") {
    target = target?.constructor;
  }
  if (typeof target !== "function") return null;

  const chain = [];
  let current = target;
  while (current && current !== Function.prototype) {
    chain.unshift(current);
    current = Object.getPrototypeOf(current);
  }

  const result = {};
  const properties = {};

  for (const ctor of chain) {
    const metadata = metadataByClass.get(ctor);
    if (!metadata) continue;
    Object.assign(result, metadata);
    Object.assign(properties, metadata.properties ?? {});
  }

  if (Object.keys(properties).length > 0) {
    result.properties = Object.freeze(properties);
  }
  return Object.keys(result).length ? Object.freeze(result) : null;
}

export function getOwnMetadata(target) {
  if (typeof target !== "function") target = target?.constructor;
  return typeof target === "function" ? metadataByClass.get(target) ?? null : null;
}

export function columnMetadata(options = {}) {
  return cloneColumnOptions(options);
}
