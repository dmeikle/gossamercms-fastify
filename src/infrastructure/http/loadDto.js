import { isUuidString } from '#mvc/util/uuid.js';
import { ApiException } from '#mvc/exceptions/ApiException.js';
import { NotFoundException } from '#mvc/exceptions/NotFoundException.js';

export async function loadDto({ id, data, parameterName }) {
    if (!isUuidString(id)) {
        throw new ApiException(
            `Invalid UUID for ${parameterName}`,
            400,
        );
    }

    const dto = await data.getById(id);

    if (dto == null) {
        throw new NotFoundException(`${parameterName} was not found`);
    }

    return dto;
}