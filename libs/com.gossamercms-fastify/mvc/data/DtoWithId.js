export class DtoWithId {
  constructor(id = null) {
    this.id = id;
  }

  getId() {
    return this.id;
  }
}
