/**
 * The Java ReflectionUtils source was not part of the spec.
 * mapRowToDto no-arg constructs the DTO and copies row keys onto it.
 * mapRowToMap copies a node-postgres row into a plain object.
 */
export function mapRowToDto(row, dtoClass) {
  let dto;
  try {
    dto = new dtoClass();
  } catch (cause) {
    const error = new Error(`DTO mapping failed for ${dtoClass?.name ?? dtoClass}`);
    error.cause = cause;
    throw error;
  }
  if (row && typeof row === 'object') {
    for (const [key, value] of Object.entries(row)) {
      dto[key] = value;
    }
  }
  return dto;
}

export function mapRowToMap(row) {
  const out = {};
  if (!row || typeof row !== 'object') return out;
  for (const [key, value] of Object.entries(row)) {
    out[key] = value;
  }
  return out;
}
