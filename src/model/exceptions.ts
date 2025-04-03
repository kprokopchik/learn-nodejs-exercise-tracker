export class NotFoundError extends Error {
  code: number;
  constructor(message: string) {
    super(message);
    this.code = 404;
  }
}

export class BadRequestError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}
