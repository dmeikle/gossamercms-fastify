
// import { loadDto } from '../helpers/loadDto.js';

import {loadDto} from "../../../../src/infrastructure/http/loadDto.js";

export class BaseConverter {
    constructor(data) {
        this.data = data;
    }

    async convert(source) {
        return loadDto({
            id: source,
            data: this.data,
            parameterName: this.constructor.dto.name,
        });
    }
}