import * as fc from 'fast-check';
import {
  success,
  error,
  validationError,
  databaseError,
  unauthorizedError,
  notFoundError,
  unknownError,
  getErrorCodeFromStatus,
  getStatusFromErrorCode,
} from './errors';
import { ERROR_CODES } from '@/types';

describe('Error Handling Utilities', () => {
  describe('success', () => {
    it('should create a success Result with data', () => {
      const data = { id: '123', name: 'Test' };
      const result = success(data);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });
  });

  describe('error', () => {
    it('should create an error Result with code and message', () => {
      const result = error(ERROR_CODES.VALIDATION_ERROR, 'Test error');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(result.error.message).toBe('Test error');
      }
    });

    it('should include optional details', () => {
      const details = { field: 'email', issue: 'invalid format' };
      const result = error(ERROR_CODES.VALIDATION_ERROR, 'Test error', details);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details).toEqual(details);
      }
    });
  });

  describe('validationError', () => {
    it('should create a validation error with default message', () => {
      const result = validationError();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(result.error.message).toBe('Validation failed');
      }
    });

    it('should create a validation error with custom message', () => {
      const result = validationError('Custom validation error');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Custom validation error');
      }
    });
  });

  describe('HTTP status code mapping', () => {
    it('should map error codes to correct HTTP status codes', () => {
      expect(getStatusFromErrorCode(ERROR_CODES.VALIDATION_ERROR)).toBe(400);
      expect(getStatusFromErrorCode(ERROR_CODES.UNAUTHORIZED)).toBe(401);
      expect(getStatusFromErrorCode(ERROR_CODES.FORBIDDEN)).toBe(403);
      expect(getStatusFromErrorCode(ERROR_CODES.NOT_FOUND)).toBe(404);
      expect(getStatusFromErrorCode(ERROR_CODES.CONFLICT)).toBe(409);
      expect(getStatusFromErrorCode(ERROR_CODES.EXTERNAL_SERVICE_ERROR)).toBe(503);
    });

    it('should map HTTP status codes to error codes', () => {
      expect(getErrorCodeFromStatus(400)).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(getErrorCodeFromStatus(401)).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(getErrorCodeFromStatus(403)).toBe(ERROR_CODES.FORBIDDEN);
      expect(getErrorCodeFromStatus(404)).toBe(ERROR_CODES.NOT_FOUND);
      expect(getErrorCodeFromStatus(409)).toBe(ERROR_CODES.CONFLICT);
      expect(getErrorCodeFromStatus(503)).toBe(ERROR_CODES.EXTERNAL_SERVICE_ERROR);
    });
  });
});

/**
 * Feature: destination-wedding-platform, Property 6: XSS and Injection Prevention (partial - error handling)
 * Validates: Requirements 4.18, 18.2
 * 
 * This property test ensures that error handling utilities properly handle
 * malicious input without exposing vulnerabilities or breaking the error handling flow.
 */
describe('Property Test: XSS and Injection Prevention in Error Handling', () => {
  // Arbitrary for generating malicious strings
  const maliciousInputArbitrary = fc.oneof(
    fc.constant('<script>alert("xss")</script>'),
    fc.constant('"; DROP TABLE guests; --'),
    fc.constant('<img src=x onerror=alert(1)>'),
    fc.constant('javascript:alert(1)'),
    fc.constant('<svg onload=alert(1)>'),
    fc.constant("' OR '1'='1"),
    fc.constant('${alert(1)}'),
    fc.constant('{{constructor.constructor("alert(1)")()}}'),
    fc.string().map(s => `${s}<script>alert(1)</script>`),
    fc.string().map(s => `${s}'; DROP TABLE users; --`)
  );

  it('should safely handle malicious input in error messages', () => {
    fc.assert(
      fc.property(maliciousInputArbitrary, (maliciousInput) => {
        // Create error with malicious message
        const result = error(ERROR_CODES.VALIDATION_ERROR, maliciousInput);
        
        // Verify error structure is maintained
        expect(result.success).toBe(false);
        
        if (!result.success) {
          // Error message should be stored as-is (sanitization happens at display time)
          expect(result.error.message).toBe(maliciousInput);
          expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
          
          // Verify the error object is serializable (no code injection)
          const serialized = JSON.stringify(result);
          expect(() => JSON.parse(serialized)).not.toThrow();
          
          // Verify serialization produces valid JSON structure
          const parsed = JSON.parse(serialized);
          expect(parsed.success).toBe(false);
          expect(parsed.error).toBeDefined();
          expect(parsed.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
          
          // The message is stored as-is - sanitization should happen at display time
          // This is correct behavior for error handling
          expect(parsed.error.message).toBe(maliciousInput);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should safely handle malicious input in error details', () => {
    fc.assert(
      fc.property(maliciousInputArbitrary, (maliciousInput) => {
        const details = {
          field: maliciousInput,
          value: maliciousInput,
          nested: { data: maliciousInput },
        };
        
        const result = error(ERROR_CODES.VALIDATION_ERROR, 'Test error', details);
        
        expect(result.success).toBe(false);
        
        if (!result.success) {
          // Details should be stored as-is
          expect(result.error.details).toEqual(details);
          
          // Verify serialization safety
          const serialized = JSON.stringify(result);
          expect(() => JSON.parse(serialized)).not.toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle all error types with malicious input', () => {
    fc.assert(
      fc.property(maliciousInputArbitrary, (maliciousInput) => {
        const errorFunctions = [
          () => validationError(maliciousInput),
          () => databaseError(maliciousInput),
          () => unauthorizedError(maliciousInput),
          () => notFoundError(maliciousInput),
        ];
        
        errorFunctions.forEach(fn => {
          const result = fn();
          expect(result.success).toBe(false);
          
          if (!result.success) {
            // Verify error structure is maintained
            expect(result.error.code).toBeDefined();
            expect(result.error.message).toBeDefined();
            
            // Verify serialization safety
            expect(() => JSON.stringify(result)).not.toThrow();
          }
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should handle unknown errors with malicious Error objects', () => {
    fc.assert(
      fc.property(maliciousInputArbitrary, (maliciousInput) => {
        const maliciousError = new Error(maliciousInput);
        const result = unknownError(maliciousError);
        
        expect(result.success).toBe(false);
        
        if (!result.success) {
          expect(result.error.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
          expect(result.error.message).toBe(maliciousInput);
          
          // Verify serialization safety
          const serialized = JSON.stringify(result);
          expect(() => JSON.parse(serialized)).not.toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain type safety with any input', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        fc.string(),
        (data, message) => {
          // Success case
          const successResult = success(data);
          expect(successResult.success).toBe(true);
          if (successResult.success) {
            expect(successResult.data).toBe(data);
          }
          
          // Error case
          const errorResult = error(ERROR_CODES.VALIDATION_ERROR, message, data);
          expect(errorResult.success).toBe(false);
          if (!errorResult.success) {
            expect(errorResult.error.details).toBe(data);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
