/** Stand-in for org.postgresql.util.PGobject. JsonbHelper source was not in the spec. */
export class PGobject {
  constructor() {
    this.type = null;
    this.value = null;
  }

  setType(type) {
    this.type = type;
  }

  setValue(value) {
    this.value = value;
  }

  getType() {
    return this.type;
  }

  getValue() {
    return this.value;
  }
}

export function toJsonb(value) {
  const pg = new PGobject();
  pg.setType('jsonb');
  pg.setValue(value === undefined ? null : JSON.stringify(value));
  return pg;
}
