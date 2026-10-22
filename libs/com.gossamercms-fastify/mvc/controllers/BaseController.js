import { UnauthorizedStatusException } from '../exceptions/UnauthorizedStatusException.js';
import { ApiResponse } from '../http/ApiResponse.js';
import { resolveCurrentJwtUser } from '../jwt/CurrentJwtUser.js';
import { QueryOptions } from '../data/QueryOptions.js';
import { IllegalArgumentException } from '../util/exceptions.js';
import { Uuid } from '../util/uuid.js';

const EMPTY_ORDER = Object.freeze({});

function queryObject(request) {
  const out = {};
  for (const [key, value] of Object.entries(request.query ?? {})) out[key] = value;
  return out;
}

function scalarQuery(value) {
  if (Array.isArray(value)) return value.length ? value[value.length - 1] : undefined;
  return value;
}

function intParam(raw, defaultValue, name) {
  const value = scalarQuery(raw);
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return Number(value);
  const error = new IllegalArgumentException(`Invalid ${name}: ${value}`);
  error.statusCode = 400;
  throw error;
}

function idOf(existing) {
  if (existing != null && typeof existing.getId === 'function') return existing.getId();
  const error = new IllegalArgumentException('Path variable did not resolve to a DtoWithId');
  error.statusCode = 400;
  throw error;
}

const BASE_ROUTES = [
  { method: 'GET', path: '/get', action: 'get' },
  {
    method: 'GET',
    path: '/:id',
    action: 'getById',
    parameters: [{ type: 'request' }],
  },
  { method: 'GET', path: '/', action: 'getAll' },
  { method: 'POST', path: '/bulk', action: 'createOrReplaceBulk' },
  { method: 'POST', path: '/:id/restore', action: 'restore' },
  { method: 'POST', path: '/', action: 'create' },
  { method: 'PUT', path: '/update', action: 'update' },
  { method: 'PUT', path: '/:id', action: 'updateById' },
  { method: 'DELETE', path: '/:id', action: 'deleteById' },
  { method: 'DELETE', path: '/', action: 'delete' },
];


function defaultParameters() {
  return [{ type: 'request' }, { type: 'reply' }];
}

export class BaseController {


  constructor(handler) {
    this.handler = handler;
  }


  /**
   * Spring converts `/{id}` into a DTO before the method runs.
   * That converter is not in the spec; handler.getById is used when present.
   */
  async resolvePathDto(id) {
    if (typeof this.handler.getById === 'function') return this.handler.getById(id);
    return id;
  }

  currentUser(request) {
    return resolveCurrentJwtUser(request);
  }
  // getRouteDefinitions() {
  //   return [
  //     ...BASE_ROUTES,
  //     ...(this.constructor.routes ?? []),
  //   ];
  // }

  async resolveRouteParameter(parameter, request, reply) {
    switch (parameter.type) {
      case 'request':
        return request;

      case 'reply':
        return reply;

      case 'path':
        return request.params[parameter.name];

      case 'query':
        return request.query?.[parameter.name];

      case 'body':
        return request.body;

      case 'dto': {
        const pathParam = parameter.pathParam ?? parameter.name;
        return parameter.converter.convert(request.params[pathParam]);
      }

      default:
        throw new IllegalArgumentException(
            `Unsupported route parameter type: ${parameter.type}`,
        );
    }
  }

  async register(fastify, routes, dtoConverters) {
    for (const route of routes) {
      const action = this[route.action];

      if (typeof action !== 'function') {
        throw new Error(
            `Route action "${route.action}" not found on ${this.constructor.name}`,
        );
      }
      const parameters = (route.parameters ?? defaultParameters()).map(
          (parameter) => {
            if (parameter.type !== 'dto') return parameter;

            const converter = dtoConverters.get(parameter.dto);

            if (!converter) {
              throw new Error(
                  `No converter registered for DTO parameter `
                  + `"${parameter.name}" on ${route.method} ${route.path}`,
              );
            }

            return { ...parameter, converter };
          },
      );

      fastify.route({
        method: route.method,
        url: route.path,
        ...(route.schema ? { schema: route.schema } : {}),
        ...(route.config ? { config: route.config } : {}),
        handler: async (request, reply) => {

          const args = [];

          for (const parameter of parameters) {
            if (parameter.type === 'reply') {
              args.push(reply);
            } else {
              args.push(
                  await this.resolveRouteParameter(parameter, request, reply),
              );
            }
          }

          return action.apply(this, args);
        },
      });
    }
  }
  // async register(fastify) {
  //   fastify.get('/get', (request, reply) => this.get(request, reply));
  //   fastify.get('/:id', (request, reply) => this.getById(request, reply));
  //   fastify.get('/', (request, reply) => this.getAll(request, reply));
  //   fastify.post('/bulk', (request, reply) => this.createOrReplaceBulk(request, reply));
  //   fastify.post('/:id/restore', (request, reply) => this.restore(request, reply));
  //   fastify.post('/', (request, reply) => this.create(request, reply));
  //   fastify.put('/update', (request, reply) => this.update(request, reply));
  //   fastify.put('/:id', (request, reply) => this.updateById(request, reply));
  //   fastify.delete('/:id', (request, reply) => this.deleteById(request, reply));
  //   fastify.delete('/', (request, reply) => this.delete(request, reply));
  // }

  async getById(request) {
    const dto = await this.resolvePathDto(request.params.id);
    return ApiResponse.ok(dto);
  }

  async get(request) {
    return ApiResponse.ok(await this.handler.get(queryObject(request)));
  }

  async getAll(request) {
    const params = queryObject(request);
    const page = intParam(params.page, 1, 'page');
    const size = intParam(params.size, 50, 'size');
    delete params.page;
    delete params.size;
    const options = QueryOptions.of(page, size, params, EMPTY_ORDER);
    return ApiResponse.ok(await this.handler.getAll(options));
  }

  async create(request) {
    const jwtUser = this.currentUser(request);
    if (!jwtUser.isAuthenticated()) throw new UnauthorizedStatusException();
    return ApiResponse.ok(await this.handler.create(jwtUser.getUserId(), request.body));
  }

  /**
   * Handler order matches the Java controller: (userId, id, dto).
   * BaseDbService.updateById is (updatedBy, dto, id).
   */
  async updateById(request) {
    const jwtUser = this.currentUser(request);
    const existing = await this.resolvePathDto(request.params.id);
    return ApiResponse.ok(await this.handler.updateById(
      jwtUser.getUserId(),
      idOf(existing),
      request.body,
    ));
  }

  async update(request) {
    const jwtUser = this.currentUser(request);
    return ApiResponse.ok(await this.handler.update(
      jwtUser.getUserId(),
      request.body,
      queryObject(request),
    ));
  }

  async deleteById(request, reply) {
    const jwtUser = this.currentUser(request);
    const existing = await this.resolvePathDto(request.params.id);
    await this.handler.deleteById(jwtUser.getUserId(), idOf(existing));
    return reply.code(200).send();
  }

  async delete(request, reply) {
    const jwtUser = this.currentUser(request);
    await this.handler.delete(jwtUser.getUserId(), queryObject(request));
    return reply.code(200).send();
  }

  async restore(request) {
    const jwtUser = this.currentUser(request);
    const id = Uuid.fromString(String(request.params.id));
    return ApiResponse.ok(await this.handler.restoreById(jwtUser.getUserId(), id));
  }

  async createOrReplaceBulk(request) {
    const jwtUser = this.currentUser(request);
    return ApiResponse.ok(await this.handler.createOrReplaceBulk(
      jwtUser.getUserId(),
      request.body,
      queryObject(request),
    ));
  }

  getOrderBy(params) {
    const sort = params.sort ?? null;
    const dir = params.dir ?? null;
    delete params.sort;
    delete params.dir;
    delete params.page;
    delete params.size;
    if (sort != null) {
      return Object.freeze({
        [String(sort)]: dir == null ? 'ASC' : String(dir).toUpperCase(),
      });
    }
    return Object.freeze({});
  }
}

// export function baseControllerPlugin(controller) {
//   return async function plugin(fastify) {
//     await controller.register(fastify);
//   };
// }
