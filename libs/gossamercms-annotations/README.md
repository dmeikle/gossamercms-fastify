# gossamercms-annotations

A small, dependency-free metadata and DTO helper module for GossamerCMS Node.js projects.

- Works with plain JavaScript ES index and Node.js 20+
- Does not depend on Fastify or an ORM
- Provides class/property metadata helpers
- Provides Lombok-inspired DTO builder helpers
- Can be used with legacy TypeScript/Babel decorators, or without decorator syntax

## Install / link locally

From this package directory:

```bash
npm test
```

To use from a sibling project during development:

```bash
npm install ../gossamercms-annotations
```

## Plain JavaScript usage

Native JavaScript does not currently provide a universal, stable `@decorator` workflow in all Node.js configurations. Use the explicit decorator calls below without requiring a transpiler.

```js
import { Model, Column, getMetadata } from "gossamercms-annotations";

class User {}

Model({ table: "users", datasource: "postgres" })(User);
Column({ type: "uuid", primaryKey: true, nullable: false })(
  User.prototype, "id"
);
Column({ type: String, length: 50, nullable: true })(
  User.prototype, "firstname"
);

console.log(getMetadata(User));
```

## TypeScript / legacy decorator usage

With a toolchain configured for legacy decorators:

```ts
import { Model, Column } from "gossamercms-annotations";

@Model({ table: "users", datasource: "postgres" })
class User {
  @Column({ type: "uuid", primaryKey: true, nullable: false })
  id!: string;

  @Column({ type: String, length: 50, nullable: true })
  firstname?: string;
}
```

The decorators record metadata only. They do not create class fields, validate values, generate SQL, or automatically generate constructors.

## Integrating with existing ModelMeta

The package deliberately does not replace GossamerCMS `ModelMeta` or `ModelMetaRegistry`. You can adapt the metadata when registering a model:

```js
import { getMetadata } from "gossamercms-annotations";
import { ModelMeta } from "../mvc/models/ModelMeta.js";

export function toModelMeta(ModelClass) {
  const metadata = getMetadata(ModelClass);
  if (!metadata || metadata.kind !== "model") {
    throw new TypeError(`${ModelClass.name} is not annotated as a model`);
  }

  const columns = {};
  const lengths = {};

  for (const [name, column] of Object.entries(metadata.properties ?? {})) {
    if (column.kind !== "column") continue;
    columns[name] = column.type ?? String;
    if (column.length !== undefined) lengths[name] = column.length;
  }

  return new ModelMeta(
    metadata.table,
    columns,
    metadata.datasource ?? "postgres",
    metadata.defaultSort ?? null,
    lengths
  );
}
```

Adjust the adapter to your project's exact `ModelMeta` constructor and column type conventions.

## DTO builders

```js
import { withBuilder } from "gossamercms-annotations";

class UserDto {
  constructor(values = {}) {
    Object.assign(this, {
      id: null,
      email: null,
      firstname: null,
      lastname: null,
      status: null,
      ...values
    });
  }

  getId() {
    return this.id;
  }

  toClaims() {
    return {
      email: this.email,
      firstname: this.firstname,
      lastname: this.lastname
    };
  }
}

withBuilder(UserDto, [
  "id", "email", "firstname", "lastname", "status"
]);

const user = UserDto.builder()
  .id("uuid-here")
  .email("user@example.com")
  .firstname("Dana")
  .build();

const updated = user.toBuilder().status("active").build();
```

`withBuilder()` adds `static builder()` and instance `toBuilder()` methods. It does not generate getters, setters, constructors, equality, or `toString()` methods.

## API

- `Model(options)` — class metadata for a model
- `Column(options)` — property metadata for a model column
- `Dto(options)` — class metadata for a DTO
- `Field(options)` — property metadata for a DTO field
- `Builder(options)` — records builder configuration metadata
- `getMetadata(Class)` — merged metadata, including inherited metadata
- `getOwnMetadata(Class)` — metadata defined directly on the class
- `defineClassMetadata(Class, metadata)` — low-level class metadata API
- `definePropertyMetadata(Class.prototype, name, metadata)` — low-level property metadata API
- `withBuilder(Class, fields)` — add `builder()` and `toBuilder()`
- `createBuilder(Class, initialValues)` — create a builder
- `instantiate(Class, values)` — construct a DTO

## Scope and limitations

This is intentionally a small starting point, not a full Lombok replacement. It does not currently generate source code or provide automatic validation, serialization, database mapping, dependency injection, or runtime TypeScript type reflection.
