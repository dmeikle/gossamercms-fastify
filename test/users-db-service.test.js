import assert from 'node:assert/strict';
import test from 'node:test';
import { UsersDbService } from '../modules/users/data/users.db.service.js';
import { UserDto } from '../modules/users/dtos/user.dto.js';
import { User } from '../modules/users/models/user.js';
import { UserDirectoryDto } from '../modules/users/dtos/user-directory.dto.js';
import { UserDetailDto } from '../modules/users/dtos/user-detail.dto.js';
import { PrivacyMaskUtils } from '../modules/users/util/privacy-mask.js';
import { BaseDbService } from '#mvc/data/BaseDbService.js';
import { DataSourceManager } from '#mvc/data/DataSourceManager.js';
import { PostgresAdapter } from '#mvc/adapters/postgresql/PostgresAdapter.js';
import { QueryOptions } from '#mvc/data/QueryOptions.js';
import { IncorrectResultSizeDataAccessException } from '#mvc/util/exceptions.js';

function createService(adapter) {
  const manager = new DataSourceManager();
  manager.register('postgres', adapter);
  return new UsersDbService(manager);
}

function createQueryService(results) {
  const calls = [];
  const service = createService(new PostgresAdapter({
    async query(sql, values) {
      calls.push({ sql, values });
      assert.ok(results.length, 'Unexpected database query');
      return { rows: results.shift() };
    },
  }));
  return { service, calls };
}

test('UsersDbService extends the abstract JavaScript base and maps all User fields', () => {
  assert.throws(() => new BaseDbService(), /abstract/);
  const service = createService({});
  assert.ok(service instanceof BaseDbService);
  const values = {
    id: 'user-1',
    firstname: 'Ada',
    lastname: 'Lovelace',
    status: 'active',
    ipAddress: '127.0.0.1',
    createdOn: new Date('2026-10-20T12:00:00Z'),
  };
  const dto = new UserDto(values);
  const entity = service.mapToEntity(dto);
  assert.ok(entity instanceof User);
  assert.deepEqual({ ...entity }, values);
  const mapped = service.mapToDto(entity);
  assert.ok(mapped instanceof UserDto);
  assert.deepEqual(mapped.toObject(), values);
  assert.deepEqual(service.mapToDto(entity, UserDto).toObject(), values);
});

test('UsersDbService inherited CRUD uses the configured datasource and DTOs', async () => {
  let saved;
  let deleted;
  const service = createService({
    async save(table, params) {
      assert.equal(table, 'users');
      saved = params;
    },
    async findOne(table, filters) {
      assert.equal(table, 'users');
      assert.equal(filters.get('id'), saved.id);
      return { ...saved };
    },
    async update(table, id, params) {
      assert.equal(table, 'users');
      assert.equal(id, saved.id);
      return { ...params, id };
    },
    async exists() { return true; },
    async delete(table, id) { deleted = { table, id }; },
  });
  const created = await service.create('admin', new UserDto({
    firstname: 'Ada', lastname: 'Lovelace', status: 'active', ipAddress: '127.0.0.1',
  }));
  assert.ok(created instanceof UserDto);
  assert.ok(created.id);
  assert.ok(created.createdOn instanceof Date);
  assert.equal(saved.ipAddress, '127.0.0.1');
  assert.deepEqual(await service.getById(created.id), created);
  const updated = await service.updateById('admin', new UserDto({ firstname: 'Grace' }), created.id);
  assert.ok(updated instanceof UserDto);
  assert.equal(updated.firstname, 'Grace');
  assert.equal(updated.id, created.id);
  await service.deleteById('admin', created.id);
  assert.deepEqual(deleted, { table: 'users', id: created.id });
});

test('directory binds the default context in both queries and maps rows with pagination', async () => {
  const createdOn = new Date('2026-10-20T12:00:00Z');
  const { service, calls } = createQueryService([
    [{ id: 'user-1', firstname: 'Ada', createdOn, lastLoginAt: null }],
    [{ count: '5' }],
  ]);
  const result = await service.directory(QueryOptions.builder()
    .page(2).size(2).orderBy({ lastname: 'desc', createdOn: 'asc' }).build());
  assert.ok(result.list[0] instanceof UserDirectoryDto);
  assert.equal(result.list[0].createdOn, createdOn);
  assert.equal(result.list[0].lastLoginAt, null);
  assert.equal(result.page, 2);
  assert.equal(result.pageSize, 2);
  assert.equal(result.totalCount, 5);
  assert.equal(result.totalPages, 3);
  assert.match(calls[0].sql, /WHERE "uc"\."contextType" = \$1/);
  assert.match(calls[0].sql, /ORDER BY "u"\."lastname" DESC, "u"\."createdOn" ASC/);
  assert.deepEqual(calls[0].values, ['default', 2, 2]);
  assert.match(calls[1].sql, /WHERE "uc"\."contextType" = \$1/);
  assert.deepEqual(calls[1].values, ['default']);
});

test('directory supports Map options and rejects unsafe sorting before querying', async () => {
  const { service, calls } = createQueryService([[], [{ count: 0 }]]);
  await service.directory(QueryOptions.of(1, 20,
    new Map([['contextType', 'staff']]), new Map([['email', 'asc']])));
  assert.deepEqual(calls[0].values, ['staff', 20, 0]);
  assert.match(calls[0].sql, /ORDER BY "li"\."identifier" ASC/);
  for (const orderBy of [
    { password: 'asc' },
    { firstname: 'ASC; DROP TABLE users' },
    { firstname: null },
    new Map([['__proto__', 'asc']]),
  ]) {
    await assert.rejects(service.directory(QueryOptions.builder().orderBy(orderBy).build()),
      /Unknown directory sort field|Invalid sort direction/);
  }
  assert.equal(calls.length, 2);
});

test('getUserDetail binds the ID and maps nullable address and timestamp fields', async () => {
  const { service, calls } = createQueryService([[
    { id: 'user-1', firstname: 'Ada', address1: null, isDefault: false, lastLoginAt: null },
  ]]);
  const dto = await service.getUserDetail('user-1');
  assert.ok(dto instanceof UserDetailDto);
  assert.equal(dto.address1, null);
  assert.equal(dto.isDefault, false);
  assert.equal(dto.lastLoginAt, null);
  assert.equal(dto.countryCode, null);
  assert.match(calls[0].sql, /left join lateral/i);
  assert.match(calls[0].sql, /order by a\."isDefault" desc/i);
  assert.match(calls[0].sql, /where u.id = \$1 and uc\."contextType" = 'default'/);
  assert.deepEqual(calls[0].values, ['user-1']);
});

test('verifyUserExists binds email and returns only the masked candidate shape', async () => {
  const { service, calls } = createQueryService([[
    {
      id: 'user-1', firstname: 'Ada', lastname: 'Lovelace', email: 'ada@example.com',
      phoneCountryCode: '+1', phoneNumber: '5551234567', status: 'active', contextType: 'default',
    },
  ]]);
  const result = await service.verifyUserExists('ada@example.com');
  assert.deepEqual(result.toObject(), {
    matchFound: true,
    matchType: ['EMAIL'],
    verificationRequired: true,
    candidate: result.candidate,
  });
  assert.deepEqual(result.candidate.toObject(), {
    userId: 'user-1', displayName: 'A*** L***', email: 'a***@***',
    phone: '***4567', accountStatus: 'active', userType: 'default',
  });
  assert.match(calls[0].sql, /li.identifier = \$1/);
  assert.deepEqual(calls[0].values, ['ada@example.com']);
});

test('verification treats only zero results as no match and propagates other errors', async () => {
  for (const emptyResult of [null, new IncorrectResultSizeDataAccessException(1, 0)]) {
    const service = createService({
      async findOneBySql() {
        if (emptyResult instanceof Error) throw emptyResult;
        return emptyResult;
      },
    });
    assert.deepEqual((await service.verifyUserExists('missing@example.com')).toObject(), {
      matchFound: false, matchType: [], verificationRequired: false, candidate: null,
    });
  }
  for (const failure of [
    new Error('Database unavailable'),
    new IncorrectResultSizeDataAccessException(1, 2),
  ]) {
    const service = createService({ async findOneBySql() { throw failure; } });
    await assert.rejects(service.verifyUserExists('ada@example.com'), (error) => error === failure);
  }
});

test('privacy helpers handle null, short and malformed values without revealing them', () => {
  assert.equal(PrivacyMaskUtils.maskName(null), null);
  assert.equal(PrivacyMaskUtils.maskName('  Ada   Lovelace '), 'A*** L***');
  assert.equal(PrivacyMaskUtils.maskEmail(null), null);
  assert.equal(PrivacyMaskUtils.maskEmail('not-an-email'), '***');
  assert.equal(PrivacyMaskUtils.maskPhone(null), null);
  assert.equal(PrivacyMaskUtils.maskPhone('1234'), '***');
  assert.equal(PrivacyMaskUtils.maskPhone('+1 (555) 123-4567'), '***4567');
});
