export function isMapLike(value) {
  return value instanceof Map || (value != null && typeof value === 'object' && !Array.isArray(value));
}

export function entriesOf(value) {
  if (value == null) return [];
  if (value instanceof Map) return Array.from(value.entries());
  if (typeof value === 'object') return Object.entries(value);
  throw new TypeError('Expected a map');
}

export function hasKey(value, key) {
  if (value == null) return false;
  if (value instanceof Map) return value.has(key);
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function getKey(value, key) {
  if (value instanceof Map) return value.get(key);
  return value?.[key];
}

export function mapSize(value) {
  if (value == null) return 0;
  if (value instanceof Map) return value.size;
  return Object.keys(value).length;
}

export function javaMapToString(value) {
  if (value instanceof Map) {
    const parts = [];
    for (const [key, entry] of value) {
      parts.push(`${key}=${formatJava(entry)}`);
    }
    return `{${parts.join(', ')}}`;
  }
  if (value && typeof value === 'object') {
    const parts = Object.entries(value).map(([key, entry]) => `${key}=${formatJava(entry)}`);
    return `{${parts.join(', ')}}`;
  }
  return String(value);
}

function formatJava(value) {
  if (value == null) return 'null';
  if (value instanceof Map) return javaMapToString(value);
  if (Array.isArray(value)) return `[${value.map((item) => formatJava(item)).join(', ')}]`;
  return String(value);
}

export function getOrDefault(map, key, fallback) {
  if (map == null) return fallback;
  if (map instanceof Map) return map.has(key) ? map.get(key) : fallback;
  if (Object.prototype.hasOwnProperty.call(map, key)) return map[key];
  return fallback;
}

export function toPlainObject(value) {
  if (value == null) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  return { ...value };
}
