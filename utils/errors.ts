import type { Result, ErrorDetails, ErrorCode } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * Creates a success Result.
 * 
 * @param data - The successful operation data
 * @returns Success Result containing the data
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Creates an error Result.
 * 
 * @param code - Standard error code
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @returns Error Result containing error information
 */
export function error<T>(
  code: ErrorCode,
  message: string,
  details?: unknown
): Result<T> {
  return {
    success: false,
    error: { code, message, details },
  };
}

/**
 * Creates a validation error Result.
 * 
 * @param message - Validation error message
 * @param details - Optional validation error details (e.g., Zod issues)
 * @returns Validation error Result
 */
export function validationError<T>(
  message: string = 'Validation failed',
  details?: unknown
): Result<T> {
  return error(ERROR_CODES.VALIDATION_ERROR, message, details);
}

/**
 * Creates a database error Result.
 * 
 * @param message - Database error message
 * @param details - Optional database error details
 * @returns Database error Result
 */
export function databaseError<T>(
  message: string = 'Database operation failed',
  details?: unknown
): Result<T> {
  return error(ERROR_CODES.DATABASE_ERROR, message, details);
}

/**
 * Creates an unauthorized error Result.
 * 
 * @param message - Authorization error message
 * @returns Unauthorized error Result
 */
export function unauthorizedError<T>(
  message: string = 'Authentication required'
): Result<T> {
  return error(ERROR_CODES.UNAUTHORIZED, message);
}

/**
 * Creates a not found error Result.
 * 
 * @param resource - The resource that was not found
 * @returns Not found error Result
 */
export function notFoundError<T>(resource: string = 'Resource'): Result<T> {
  return error(ERROR_CODES.NOT_FOUND, `${resource} not found`);
}

/**
 * Creates an unknown error Result from a caught exception.
 * 
 * @param err - The caught error
 * @returns Unknown error Result
 */
export function unknownError<T>(err: unknown): Result<T> {
  const message = err instanceof Error ? err.message : 'Unknown error occurred';
  return error(ERROR_CODES.UNKNOWN_ERROR, message, err);
}

/**
 * Maps HTTP status codes to appropriate error codes.
 * 
 * @param status - HTTP status code
 * @returns Corresponding error code
 */
export function getErrorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ERROR_CODES.VALIDATION_ERROR;
    case 401:
      return ERROR_CODES.UNAUTHORIZED;
    case 403:
      return ERROR_CODES.FORBIDDEN;
    case 404:
      return ERROR_CODES.NOT_FOUND;
    case 409:
      return ERROR_CODES.CONFLICT;
    case 502:
    case 503:
      return ERROR_CODES.EXTERNAL_SERVICE_ERROR;
    default:
      return ERROR_CODES.UNKNOWN_ERROR;
  }
}

/**
 * Maps error codes to HTTP status codes.
 * 
 * @param code - Error code
 * @returns Corresponding HTTP status code
 */
export function getStatusFromErrorCode(code: ErrorCode): number {
  switch (code) {
    case ERROR_CODES.VALIDATION_ERROR:
    case ERROR_CODES.INVALID_INPUT:
    case ERROR_CODES.MISSING_REQUIRED_FIELD:
      return 400;
    case ERROR_CODES.UNAUTHORIZED:
    case ERROR_CODES.INVALID_CREDENTIALS:
    case ERROR_CODES.SESSION_EXPIRED:
      return 401;
    case ERROR_CODES.FORBIDDEN:
    case ERROR_CODES.INSUFFICIENT_PERMISSIONS:
      return 403;
    case ERROR_CODES.NOT_FOUND:
    case ERROR_CODES.GUEST_NOT_FOUND:
    case ERROR_CODES.EVENT_NOT_FOUND:
      return 404;
    case ERROR_CODES.CONFLICT:
    case ERROR_CODES.DUPLICATE_ENTRY:
    case ERROR_CODES.CAPACITY_EXCEEDED:
      return 409;
    case ERROR_CODES.EXTERNAL_SERVICE_ERROR:
    case ERROR_CODES.STORAGE_UNAVAILABLE:
    case ERROR_CODES.EMAIL_SERVICE_ERROR:
      return 503;
    default:
      return 500;
  }
}
