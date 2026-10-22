/**
 * Creates a Fastify preHandler that loads a DTO by a path parameter.
 *
 * @param {object} options
 * @param {string} options.param - Path parameter name
 * @param {object} options.data - Data service
 * @param {string} [options.property] - Request property to populate
 */
export function loadDto({
                            param,
                            data,
                            property = 'loadedDto',
                        }) {
    return async function dtoPreHandler(request, reply) {
        const id = request.params[param];

        if (!id) {
            return reply.code(400).send({
                error: 'Bad Request',
                message: `Missing path parameter: ${param}`,
            });
        }

        const dto = await data.findById(id);

        if (!dto) {
            return reply.code(404).send({
                error: 'Not Found',
                message: `${param} was not found`,
            });
        }

        request[property] = dto;
    };
}