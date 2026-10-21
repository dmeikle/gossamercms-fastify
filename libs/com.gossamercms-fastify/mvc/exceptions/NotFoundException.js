import { ApiException } from './ApiException.js';

export class NotFoundException extends ApiException {
  constructor(message) {
    super(message == null ? '' : String(message), 404);
    this.name = 'NotFoundException';
  }
}
