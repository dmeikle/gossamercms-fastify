import { ApiException } from './ApiException.js';

export class UnauthorizedStatusException extends ApiException {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedStatusException';
  }
}
