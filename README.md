# gossamercms-fastify

The persistence layer exports both `PostgresAdapter` and `MySqlAdapter` from
`libs/com.gossamercms-fastify`. Create a MySQL adapter with
`await MySqlAdapter.fromConfig({ host, port, user, password, database })` and
register it with `DataSourceManager` using the adapter's `key()` (`mysql`).
Models using MySQL should set their datasource key to `mysql`; the existing
model builders continue to default to `postgres`.

Run the development server with `npm run dev`. It listens on port 3000 by default
(configurable with `PORT`) and exposes `GET /health`.

`UsersDbService` in `modules`
is a JavaScript ES module. Construct it with a `DataSourceManager`; it extends
`BaseDbService` with `User` and `UserDto` and supports inherited CRUD plus
`directory(options)`, `getUserDetail(userId)`, and `verifyUserExists(email)`.
All database methods are asynchronous. The detail query uses PostgreSQL's
`LATERAL` join to select the preferred address.

Directory queries accept `QueryOptions`, default to the `default` context, and
allow sorting by the directory DTO fields. Unknown sort fields and directions
are rejected. Verification returns a masked candidate: name initials, the first
email character with the rest (including the domain) hidden, and only the last
four phone digits (shorter numbers are fully masked). These are new masking
rules because the original Java utilities were not supplied. Only a zero-row
lookup becomes `matchFound: false`; database and multiple-match errors propagate.

## Routing
The framework's route registrar
The framework needs one reusable component to interpret those declarations and invoke the appropriate controller methods.

Its responsibilities should be:
1. Register the Fastify route.
2. Resolve parameters according to their declared types.
3. Load DTOs before calling the controller.
4. Return 404 if a requested DTO doesn't exist.
5. Invoke the controller with the resolved arguments.
6. Preserve existing error handling and response conventions.
