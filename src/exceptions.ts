export class EthereaError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, EthereaError.prototype);
  }
}

export class NetworkMismatch extends EthereaError {
  actual: string;
  expected: string;

  constructor(message: string, actual: string, expected: string) {
    super(message);
    Object.setPrototypeOf(this, NetworkMismatch.prototype);
    this.actual = actual;
    this.expected = expected;
  }
}
