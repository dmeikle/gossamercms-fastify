export function createModule(controllers) {
    return async function modulePlugin(fastify, { container }) {
        for (const { name, prefix, routes } of controllers) {
            if (!Array.isArray(routes)) {
                throw new TypeError(`Routes must be an array for ${name}`);
            }

            fastify.register(async function controllerScope(scope) {
                const controller = container.resolve(name);
                await controller.register(scope, routes);
            }, { prefix });
        }
    };
}