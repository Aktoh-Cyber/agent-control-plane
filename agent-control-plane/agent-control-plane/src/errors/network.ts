/**
 * Network Error Types
 *
 * Comprehensive error hierarchy for network operations including:
 * - Connection errors
 * - Timeout errors
 * - Protocol errors
 * - HTTP errors
 * - API errors
 */

import { ErrorCategory, ErrorMetadata, ErrorSeverity, OperationalError } from './base';

/**
 * Error code ranges: 4000-4999
 */
export enum NetworkErrorCode {
  // Connection errors: 4000-4099
  NETWORK_ERROR = 'NET_4000',
  CONNECTION_REFUSED = 'NET_4001',
  CONNECTION_RESET = 'NET_4002',
  CONNECTION_TIMEOUT = 'NET_4003',
  CONNECTION_ABORTED = 'NET_4004',
  DNS_LOOKUP_FAILED = 'NET_4005',
  HOST_UNREACHABLE = 'NET_4006',

  // Timeout errors: 4100-4199
  REQUEST_TIMEOUT = 'NET_4100',
  RESPONSE_TIMEOUT = 'NET_4101',
  GATEWAY_TIMEOUT = 'NET_4102',

  // Protocol errors: 4200-4299
  PROTOCOL_ERROR = 'NET_4200',
  SSL_ERROR = 'NET_4201',
  TLS_ERROR = 'NET_4202',
  CERTIFICATE_ERROR = 'NET_4203',
  HTTP_VERSION_NOT_SUPPORTED = 'NET_4204',

  // HTTP errors: 4300-4399
  HTTP_ERROR = 'NET_4300',
  BAD_REQUEST = 'NET_4400',
  FORBIDDEN = 'NET_4403',
  NOT_FOUND = 'NET_4404',
  METHOD_NOT_ALLOWED = 'NET_4405',
  NOT_ACCEPTABLE = 'NET_4406',
  CONFLICT = 'NET_4409',
  GONE = 'NET_4410',
  PAYLOAD_TOO_LARGE = 'NET_4413',
  URI_TOO_LONG = 'NET_4414',
  UNSUPPORTED_MEDIA_TYPE = 'NET_4415',
  TOO_MANY_REQUESTS = 'NET_4429',
  INTERNAL_SERVER_ERROR = 'NET_4500',
  NOT_IMPLEMENTED = 'NET_4501',
  BAD_GATEWAY = 'NET_4502',
  SERVICE_UNAVAILABLE = 'NET_4503',

  // API errors: 4800-4899
  API_ERROR = 'NET_4800',
  API_RATE_LIMIT = 'NET_4801',
  API_QUOTA_EXCEEDED = 'NET_4802',
  API_KEY_INVALID = 'NET_4803',
  API_VERSION_DEPRECATED = 'NET_4804',

  // General: 4900-4999
  NETWORK_UNAVAILABLE = 'NET_4900',
  PROXY_ERROR = 'NET_4901',
}

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Base network error
 */
export class NetworkError extends OperationalError {
  constructor(
    message: string,
    code: NetworkErrorCode,
    options?: {
      severity?: ErrorSeverity;
      metadata?: ErrorMetadata;
      cause?: Error;
      httpStatus?: number;
    }
  ) {
    super(message, code, ErrorCategory.NETWORK, {
      ...options,
      httpStatus: options?.httpStatus || 500,
    });
  }
}

/**
 * Connection errors
 */
export class ConnectionError extends NetworkError {
  constructor(
    message: string,
    code: NetworkErrorCode = NetworkErrorCode.NETWORK_ERROR,
    options?: {
      host?: string;
      port?: number;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      severity: ErrorSeverity.HIGH,
      metadata: {
        ...options?.metadata,
        host: options?.host,
        port: options?.port,
      },
    });
  }
}

export class ConnectionRefusedError extends ConnectionError {
  constructor(
    host: string,
    port?: number,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Connection refused to ${host}${port ? `:${port}` : ''}`,
      NetworkErrorCode.CONNECTION_REFUSED,
      {
        ...options,
        host,
        port,
      }
    );
  }
}

export class ConnectionTimeoutError extends ConnectionError {
  constructor(
    host: string,
    timeout: number,
    options?: {
      port?: number;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Connection timeout to ${host} after ${timeout}ms`, NetworkErrorCode.CONNECTION_TIMEOUT, {
      ...options,
      host,
      metadata: {
        ...options?.metadata,
        timeout,
      },
    });
  }
}

export class DnsLookupError extends ConnectionError {
  constructor(
    hostname: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`DNS lookup failed for ${hostname}`, NetworkErrorCode.DNS_LOOKUP_FAILED, {
      ...options,
      host: hostname,
    });
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends NetworkError {
  constructor(
    message: string,
    timeout: number,
    code: NetworkErrorCode = NetworkErrorCode.REQUEST_TIMEOUT,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 408,
      metadata: {
        ...options?.metadata,
        timeout,
      },
    });
  }
}

export class RequestTimeoutError extends TimeoutError {
  constructor(
    timeout: number,
    options?: {
      url?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Request timeout after ${timeout}ms`, timeout, NetworkErrorCode.REQUEST_TIMEOUT, {
      ...options,
      metadata: {
        ...options?.metadata,
        url: options?.url,
      },
    });
  }
}

export class GatewayTimeoutError extends TimeoutError {
  constructor(
    timeout: number,
    options?: {
      gateway?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Gateway timeout after ${timeout}ms`, timeout, NetworkErrorCode.GATEWAY_TIMEOUT, {
      ...options,
      httpStatus: 504,
      metadata: {
        ...options?.metadata,
        gateway: options?.gateway,
      },
    });
  }
}

/**
 * Protocol errors
 */
export class ProtocolError extends NetworkError {
  constructor(
    message: string,
    code: NetworkErrorCode = NetworkErrorCode.PROTOCOL_ERROR,
    options?: {
      protocol?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      severity: ErrorSeverity.HIGH,
      metadata: {
        ...options?.metadata,
        protocol: options?.protocol,
      },
    });
  }
}

export class SslError extends ProtocolError {
  constructor(
    message: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`SSL error: ${message}`, NetworkErrorCode.SSL_ERROR, {
      ...options,
      protocol: 'SSL',
    });
  }
}

export class CertificateError extends ProtocolError {
  constructor(
    message: string,
    options?: {
      certificate?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Certificate error: ${message}`, NetworkErrorCode.CERTIFICATE_ERROR, {
      ...options,
      metadata: {
        ...options?.metadata,
        certificate: options?.certificate,
      },
    });
  }
}

/**
 * HTTP errors
 */
export class HttpError extends NetworkError {
  public readonly statusCode: number;
  public readonly method?: HttpMethod;
  public readonly url?: string;
  public readonly responseBody?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code: NetworkErrorCode = NetworkErrorCode.HTTP_ERROR,
    options?: {
      method?: HttpMethod;
      url?: string;
      responseBody?: unknown;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      httpStatus: statusCode,
      severity: statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      metadata: {
        ...options?.metadata,
        statusCode,
        method: options?.method,
        url: options?.url,
      },
    });

    this.statusCode = statusCode;
    this.method = options?.method;
    this.url = options?.url;
    this.responseBody = options?.responseBody;
  }
}

// 4xx Client Errors
export class BadRequestError extends HttpError {
  constructor(
    message: string = 'Bad Request',
    options?: {
      method?: HttpMethod;
      url?: string;
      responseBody?: unknown;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(400, message, NetworkErrorCode.BAD_REQUEST, options);
  }
}

export class ForbiddenError extends HttpError {
  constructor(
    message: string = 'Forbidden',
    options?: {
      method?: HttpMethod;
      url?: string;
      resource?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(403, message, NetworkErrorCode.FORBIDDEN, {
      ...options,
      metadata: {
        ...options?.metadata,
        resource: options?.resource,
      },
    });
  }
}

export class NotFoundError extends HttpError {
  constructor(
    resource: string,
    options?: {
      method?: HttpMethod;
      url?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(404, `Resource not found: ${resource}`, NetworkErrorCode.NOT_FOUND, {
      ...options,
      metadata: {
        ...options?.metadata,
        resource,
      },
    });
  }
}

export class MethodNotAllowedError extends HttpError {
  constructor(
    method: HttpMethod,
    allowedMethods: HttpMethod[],
    options?: {
      url?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      405,
      `Method ${method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
      NetworkErrorCode.METHOD_NOT_ALLOWED,
      {
        ...options,
        method,
        metadata: {
          ...options?.metadata,
          allowedMethods,
        },
      }
    );
  }
}

export class ConflictError extends HttpError {
  constructor(
    message: string,
    options?: {
      method?: HttpMethod;
      url?: string;
      resource?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(409, message, NetworkErrorCode.CONFLICT, {
      ...options,
      metadata: {
        ...options?.metadata,
        resource: options?.resource,
      },
    });
  }
}

export class PayloadTooLargeError extends HttpError {
  constructor(
    size: number,
    maxSize: number,
    options?: {
      method?: HttpMethod;
      url?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      413,
      `Payload too large: ${size} bytes (max: ${maxSize} bytes)`,
      NetworkErrorCode.PAYLOAD_TOO_LARGE,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          size,
          maxSize,
        },
      }
    );
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(
    retryAfter?: number,
    options?: {
      method?: HttpMethod;
      url?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      429,
      `Too many requests${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
      NetworkErrorCode.TOO_MANY_REQUESTS,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          retryAfter,
        },
      }
    );
  }
}

// 5xx Server Errors
export class InternalServerError extends HttpError {
  constructor(
    message: string = 'Internal Server Error',
    options?: {
      method?: HttpMethod;
      url?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(500, message, NetworkErrorCode.INTERNAL_SERVER_ERROR, options);
  }
}

export class BadGatewayError extends HttpError {
  constructor(
    message: string = 'Bad Gateway',
    options?: {
      method?: HttpMethod;
      url?: string;
      upstream?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(502, message, NetworkErrorCode.BAD_GATEWAY, {
      ...options,
      metadata: {
        ...options?.metadata,
        upstream: options?.upstream,
      },
    });
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(
    retryAfter?: number,
    options?: {
      method?: HttpMethod;
      url?: string;
      service?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      503,
      `Service unavailable${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
      NetworkErrorCode.SERVICE_UNAVAILABLE,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          retryAfter,
          service: options?.service,
        },
      }
    );
  }
}

/**
 * API errors
 */
export class ApiError extends NetworkError {
  constructor(
    message: string,
    code: NetworkErrorCode = NetworkErrorCode.API_ERROR,
    options?: {
      apiName?: string;
      endpoint?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
      httpStatus?: number;
    }
  ) {
    super(message, code, {
      ...options,
      metadata: {
        ...options?.metadata,
        apiName: options?.apiName,
        endpoint: options?.endpoint,
      },
    });
  }
}

export class ApiRateLimitError extends ApiError {
  constructor(
    limit: number,
    retryAfter?: number,
    options?: {
      apiName?: string;
      endpoint?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `API rate limit exceeded: ${limit} requests${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
      NetworkErrorCode.API_RATE_LIMIT,
      {
        ...options,
        httpStatus: 429,
        metadata: {
          ...options?.metadata,
          limit,
          retryAfter,
        },
      }
    );
  }
}

export class ApiQuotaExceededError extends ApiError {
  constructor(
    quota: number,
    options?: {
      apiName?: string;
      resetDate?: Date;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `API quota exceeded: ${quota}${options?.resetDate ? `. Resets at ${options.resetDate.toISOString()}` : ''}`,
      NetworkErrorCode.API_QUOTA_EXCEEDED,
      {
        ...options,
        httpStatus: 429,
        metadata: {
          ...options?.metadata,
          quota,
          resetDate: options?.resetDate?.toISOString(),
        },
      }
    );
  }
}

export class ApiKeyInvalidError extends ApiError {
  constructor(options?: { apiName?: string; metadata?: ErrorMetadata; cause?: Error }) {
    super('Invalid or missing API key', NetworkErrorCode.API_KEY_INVALID, {
      ...options,
      httpStatus: 401,
    });
  }
}

/**
 * Factory function to create HTTP error from status code
 */
export function createHttpError(
  statusCode: number,
  message?: string,
  options?: {
    method?: HttpMethod;
    url?: string;
    responseBody?: unknown;
    metadata?: ErrorMetadata;
    cause?: Error;
  }
): HttpError {
  switch (statusCode) {
    case 400:
      return new BadRequestError(message, options);
    case 403:
      return new ForbiddenError(message, options);
    case 404:
      return new NotFoundError(message || 'Resource', options);
    case 405:
      return new MethodNotAllowedError(options?.method || 'GET', [], options);
    case 409:
      return new ConflictError(message || 'Conflict', options);
    case 413:
      return new PayloadTooLargeError(0, 0, options);
    case 429:
      return new TooManyRequestsError(undefined, options);
    case 500:
      return new InternalServerError(message, options);
    case 502:
      return new BadGatewayError(message, options);
    case 503:
      return new ServiceUnavailableError(undefined, options);
    default:
      return new HttpError(
        statusCode,
        message || `HTTP Error ${statusCode}`,
        NetworkErrorCode.HTTP_ERROR,
        options
      );
  }
}
