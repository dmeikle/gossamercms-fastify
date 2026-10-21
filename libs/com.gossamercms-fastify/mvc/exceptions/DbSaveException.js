import { ApiException } from './ApiException.js';

/**
 * Constraint and save failures. The Java type is not in the port spec;
 * status 400 matches a message that is meant to be shown to the caller
 * without the SQL text.
 */
export class DbSaveException extends ApiException {
  constructor(message) {
    super(message == null ? '' : String(message), 400);
    this.name = 'DbSaveException';
  }
}
