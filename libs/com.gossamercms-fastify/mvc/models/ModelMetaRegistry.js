export class ModelMetaRegistry {
  constructor() {
    this.registry = new Map();
  }

  register(meta) {
    this.registry.set(meta.table(), meta);
  }

  get(table) {
    return this.registry.has(table) ? this.registry.get(table) : null;
  }

  all() {
    return Array.from(this.registry.values());
  }
}
