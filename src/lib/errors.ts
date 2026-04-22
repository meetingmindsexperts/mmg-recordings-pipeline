export class AppError extends Error {
  public override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.cause = cause;
  }
}

export class ConfigError extends AppError {}
export class WebhookSignatureError extends AppError {}
export class IdempotencyConflictError extends AppError {}
export class NotImplementedError extends AppError {
  constructor(what: string) {
    super(`Not implemented: ${what}`);
  }
}

export class ExternalApiError extends AppError {
  public readonly service: string;
  public readonly status?: number;
  constructor(service: string, message: string, status?: number, cause?: unknown) {
    super(`[${service}] ${message}`, cause);
    this.service = service;
    this.status = status;
  }
}
