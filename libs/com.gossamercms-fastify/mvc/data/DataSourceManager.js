export class DataSourceManager {
  constructor() {
    this.sources = new Map();
  }

  register(key, adapter) {
    this.sources.set(key, adapter);
  }

  get(key) {
    return this.sources.has(key) ? this.sources.get(key) : null;
  }
}
