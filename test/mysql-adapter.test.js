import assert from 'node:assert/strict';
import test from 'node:test';
import { MySqlAdapter } from '#mvc/adapters/mysql/MySqlAdapter.js';
import { Operator, QueryFilter } from '#mvc/data/QueryFilter.js';

function createDb(results = []) {
  const resultQueue = Array.isArray(results) ? results : [results];
  const calls = [];
  return {
    calls,
    async execute(sql, values) {
      calls.push({ sql, values });
      return [resultQueue.shift() ?? [], []];
    },
    async end() {},
  };
}

test('MySqlAdapter binds named values and quotes identifiers for MySQL', async () => {
  const db = createDb([[{ id: 'record-1', status: 'active' }]]);
  const adapter = new MySqlAdapter(db);

  assert.equal(adapter.key(), 'mysql');
  assert.deepEqual(
    await adapter.findOneFull('users', { status: 'active' }, [], {}),
    { id: 'record-1', status: 'active' },
  );
  assert.deepEqual(db.calls[0], {
    sql: 'SELECT * FROM `users` WHERE `status` = ? LIMIT 1',
    values: ['active'],
  });
});

test('MySqlAdapter builds MySQL-compatible filters and expands IN values', async () => {
  const adapter = new MySqlAdapter(createDb());
  const where = adapter.buildWhere(
    null,
    [
      new QueryFilter('state', Operator.IN, ['open', 'closed']),
      new QueryFilter('createdAt', Operator.EQUALS_DATE, '2026-10-20'),
    ],
    {},
    true,
  );

  assert.equal(
    where,
    '`deletedAt` IS NULL AND `state` IN (:state) AND DATE(`createdAt`) = :createdAt',
  );
});

test('MySqlAdapter translates double-quoted identifiers in application SQL', async () => {
  const db = createDb({ affectedRows: 1 });
  const adapter = new MySqlAdapter(db);

  await adapter.executeSql('UPDATE "users" SET "deletedAt" = NOW() WHERE "id" = :id', { id: 'record-1' });

  assert.deepEqual(db.calls[0], {
    sql: 'UPDATE `users` SET `deletedAt` = NOW() WHERE `id` = ?',
    values: ['record-1'],
  });
});

test('MySqlAdapter batches updates inside a transaction', async () => {
  const calls = [];
  const connection = {
    async beginTransaction() {
      calls.push('begin');
    },
    async execute(sql, values) {
      calls.push({ sql, values });
      return [{ affectedRows: 1 }, []];
    },
    async commit() {
      calls.push('commit');
    },
    async rollback() {
      calls.push('rollback');
    },
    release() {
      calls.push('release');
    },
  };
  const adapter = new MySqlAdapter({
    async getConnection() {
      return connection;
    },
  });

  assert.deepEqual(
    await adapter.getNamedParameterJdbcTemplate().batchUpdate(
      'UPDATE "users" SET "name" = :name WHERE "id" = :id',
      [{ name: 'Ada', id: 'user-1' }, { name: 'Lin', id: 'user-2' }],
    ),
    [1, 1],
  );
  assert.deepEqual(calls, [
    'begin',
    { sql: 'UPDATE `users` SET `name` = ? WHERE `id` = ?', values: ['Ada', 'user-1'] },
    { sql: 'UPDATE `users` SET `name` = ? WHERE `id` = ?', values: ['Lin', 'user-2'] },
    'commit',
    'release',
  ]);
});
