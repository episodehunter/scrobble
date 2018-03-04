export class UnauthorizedError extends Error {
  constructor(msg) {
    super(msg)
    this.name = this.constructor.name
  }
}

export class UnableToAddShowError extends Error {
  constructor(msg: string, extra?: object) {
    super(msg)
    this.name = this.constructor.name
    ;(this as any).extra = extra
  }
}
