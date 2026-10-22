export const crudRoutes = [

    { method: 'GET', path: '/:id', action: 'getById' },
    { method: 'GET', path: '/', action: 'getAll' },
    { method: 'POST', path: '/bulk', action: 'createOrReplaceBulk' },
    { method: 'POST', path: '/:id/restore', action: 'restore' },
    { method: 'POST', path: '/', action: 'create' },
    { method: 'PUT', path: '/:id', action: 'updateById' },
    { method: 'DELETE', path: '/:id', action: 'deleteById' }
];