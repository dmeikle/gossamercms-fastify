# gossamercms-fastify

The persistence layer exports both `PostgresAdapter` and `MySqlAdapter` from
`libs/com.gossamercms-fastify`. Create a MySQL adapter with
`await MySqlAdapter.fromConfig({ host, port, user, password, database })` and
register it with `DataSourceManager` using the adapter's `key()` (`mysql`).
Models using MySQL should set their datasource key to `mysql`; the existing
model builders continue to default to `postgres`.

Run the development server with `npm run dev`. It listens on port 3000 by default
(configurable with `PORT`) and exposes `GET /health`.

`UsersDbService` in `apps/src/gossamercms-users/com/gossamercms/users/data/users.db.service.js`
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