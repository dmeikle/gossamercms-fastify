import test from "node:test";
import assert from "node:assert/strict";
import {
  Model, Column, Dto, Field, getMetadata, withBuilder
} from "../src/index.js";

test("plain JavaScript metadata declarations are readable", () => {
  class User {}
  Model({ table: "users", datasource: "postgres" })(User);
  Column({ type: "uuid", primaryKey: true, nullable: false })(User.prototype, "id");
  Column({ type: String, length: 50, nullable: true })(User.prototype, "firstname");

  const metadata = getMetadata(User);
  assert.equal(metadata.kind, "model");
  assert.equal(metadata.table, "users");
  assert.equal(metadata.properties.id.primaryKey, true);
  assert.equal(metadata.properties.firstname.length, 50);
});

test("metadata inherits and child properties override parent properties", () => {
  class Base {}
  Model({ datasource: "postgres" })(Base);
  Column({ type: String, length: 100 })(Base.prototype, "name");

  class Child extends Base {}
  Column({ type: String, length: 50 })(Child.prototype, "name");

  const metadata = getMetadata(Child);
  assert.equal(metadata.datasource, "postgres");
  assert.equal(metadata.properties.name.length, 50);
});

test("DTO builder supports build and toBuilder", () => {
  class UserDto {
    constructor(values = {}) {
      Object.assign(this, {
        id: null,
        email: null,
        firstname: null,
        ...values
      });
    }
  }
  withBuilder(UserDto, ["id", "email", "firstname"]);

  const user = UserDto.builder()
    .id("123")
    .email("d@example.com")
    .firstname("Dana")
    .build();

  assert.equal(user.getId, undefined);
  assert.equal(user.firstname, "Dana");

  const changed = user.toBuilder().firstname("Dee").build();
  assert.equal(changed.id, "123");
  assert.equal(changed.firstname, "Dee");
});

test("DTO decorator records class metadata", () => {
  class UserDto {}
  Dto({ version: 1 })(UserDto);
  Field({ type: "string", nullable: true })(UserDto.prototype, "email");

  const metadata = getMetadata(UserDto);
  assert.equal(metadata.kind, "dto");
  assert.equal(metadata.properties.email.kind, "field");
});
