export class IllegalArgumentException extends Error {
  constructor(message) {
    super(message);
    this.name = 'IllegalArgumentException';
  }
}

export class IllegalStateException extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'IllegalStateException';
  }
}

export class UnsupportedOperationException extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnsupportedOperationException';
  }
}

export class EmptyResultDataAccessException extends Error {
  constructor(message) {
    super(message);
    this.name = 'EmptyResultDataAccessException';
  }
}

export class IncorrectResultSizeDataAccessException extends Error {
  constructor(expected, actual) {
    super(`Incorrect result size: expected ${expected}, actual ${actual}`);
    this.name = 'IncorrectResultSizeDataAccessException';
    this.expected = expected;
    this.actual = actual;
  }
}

export class BadSqlGrammarException extends Error {
  constructor(sql, cause) {
    super(cause?.message ?? 'bad sql grammar', { cause });
    this.name = 'BadSqlGrammarException';
    this.sql = sql;
  }

  getSql() {
    return this.sql;
  }

  getSQLException() {
    return this.cause;
  }
}
