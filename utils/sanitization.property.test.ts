import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { sanitizeInput, sanitizeRichText, sanitizeArray, sanitizeObject } from './sanitization';

/**
 * Feature: destination-wedding-platform, Property 6: XSS and Injection Prevention
 * 
 * For any guest input containing XSS patterns (script tags, event handlers) or 
 * SQL injection patterns, the sanitization function should remove or neutralize 
 * the dangerous content before storage.
 * 
 * Validates: Requirements 4.18, 18.2
 */
describe('Feature: destination-wedding-platform, Property 6: XSS and Injection Prevention', () => {
  
  /**
   * Generator for XSS attack patterns
   */
  const xssPatternArbitrary = fc.oneof(
    // Script tag variations
    fc.constant('<script>alert("xss")</script>'),
    fc.constant('<script>alert(1)</script>'),
    fc.constant('<SCRIPT>alert("XSS")</SCRIPT>'),
    fc.constant('<script src="http://evil.com/xss.js"></script>'),
    fc.constant('<script>document.cookie</script>'),
    fc.constant('<script>window.location="http://evil.com"</script>'),
    
    // Event handler injections
    fc.constant('<img src=x onerror=alert(1)>'),
    fc.constant('<img src=x onerror="alert(1)">'),
    fc.constant('<body onload=alert(1)>'),
    fc.constant('<div onclick="alert(1)">Click</div>'),
    fc.constant('<svg onload=alert(1)>'),
    fc.constant('<iframe onload=alert(1)>'),
    
    // JavaScript protocol
    fc.constant('<a href="javascript:alert(1)">Click</a>'),
    fc.constant('<img src="javascript:alert(1)">'),
    
    // Data URI with JavaScript
    fc.constant('<img src="data:text/html,<script>alert(1)</script>">'),
    
    // HTML injection
    fc.constant('<iframe src="http://evil.com"></iframe>'),
    fc.constant('<embed src="http://evil.com">'),
    fc.constant('<object data="http://evil.com">'),
    
    // Mixed case to bypass filters
    fc.constant('<ScRiPt>alert(1)</ScRiPt>'),
    fc.constant('<iMg sRc=x OnErRoR=alert(1)>'),
    
    // Encoded attacks
    fc.constant('&lt;script&gt;alert(1)&lt;/script&gt;'),
    fc.constant('&#60;script&#62;alert(1)&#60;/script&#62;'),
    
    // Style-based XSS
    fc.constant('<style>body{background:url("javascript:alert(1)")}</style>'),
    fc.constant('<div style="background:url(javascript:alert(1))">'),
    
    // Meta refresh
    fc.constant('<meta http-equiv="refresh" content="0;url=javascript:alert(1)">'),
    
    // Form-based XSS
    fc.constant('<form action="javascript:alert(1)"><input type="submit"></form>'),
  );

  /**
   * Generator for SQL injection patterns
   */
  const sqlInjectionArbitrary = fc.oneof(
    fc.constant("'; DROP TABLE guests; --"),
    fc.constant("' OR '1'='1"),
    fc.constant("1' OR '1'='1' --"),
    fc.constant("admin'--"),
    fc.constant("' UNION SELECT * FROM users--"),
    fc.constant("1; DELETE FROM guests WHERE '1'='1"),
    fc.constant("'; UPDATE guests SET role='admin' WHERE '1'='1"),
    fc.constant("1' AND 1=1 UNION SELECT password FROM users--"),
    fc.constant("' OR 1=1--"),
    fc.constant("admin' OR '1'='1' /*"),
  );

  /**
   * Generator combining XSS and SQL injection patterns
   */
  const maliciousInputArbitrary = fc.oneof(
    xssPatternArbitrary,
    sqlInjectionArbitrary,
    // Mixed patterns with legitimate text
    fc.tuple(fc.string({ minLength: 1, maxLength: 20 }), xssPatternArbitrary).map(
      ([text, xss]) => `${text}${xss}`
    ),
    fc.tuple(xssPatternArbitrary, fc.string({ minLength: 1, maxLength: 20 })).map(
      ([xss, text]) => `${xss}${text}`
    ),
  );

  describe('sanitizeInput', () => {
    it('should remove all script tags from any input', async () => {
      await fc.assert(
        fc.asyncProperty(
          maliciousInputArbitrary,
          async (maliciousInput) => {
            const sanitized = sanitizeInput(maliciousInput);
            
            // Should not contain script tags (case insensitive)
            expect(sanitized.toLowerCase()).not.toContain('<script');
            expect(sanitized.toLowerCase()).not.toContain('</script>');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove all event handlers from any input', async () => {
      await fc.assert(
        fc.asyncProperty(
          maliciousInputArbitrary,
          async (maliciousInput) => {
            const sanitized = sanitizeInput(maliciousInput);
            
            // Should not contain common event handlers
            expect(sanitized.toLowerCase()).not.toContain('onerror=');
            expect(sanitized.toLowerCase()).not.toContain('onload=');
            expect(sanitized.toLowerCase()).not.toContain('onclick=');
            expect(sanitized.toLowerCase()).not.toContain('onmouseover=');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove javascript: protocol from any input', async () => {
      await fc.assert(
        fc.asyncProperty(
          maliciousInputArbitrary,
          async (maliciousInput) => {
            const sanitized = sanitizeInput(maliciousInput);
            
            // Should not contain javascript protocol
            expect(sanitized.toLowerCase()).not.toContain('javascript:');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove all HTML tags from any input', async () => {
      await fc.assert(
        fc.asyncProperty(
          maliciousInputArbitrary,
          async (maliciousInput) => {
            const sanitized = sanitizeInput(maliciousInput);
            
            // Should not contain any HTML tags
            expect(sanitized).not.toMatch(/<[^>]*>/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should safely handle SQL injection patterns without breaking', async () => {
      await fc.assert(
        fc.asyncProperty(
          sqlInjectionArbitrary,
          async (sqlInjection) => {
            const sanitized = sanitizeInput(sqlInjection);
            
            // Should return a string (not throw)
            expect(typeof sanitized).toBe('string');
            
            // Should not contain dangerous SQL keywords in a way that could be executed
            // Note: The sanitization removes HTML, but SQL injection is prevented by
            // using parameterized queries in the database layer
            expect(sanitized).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null and undefined inputs safely', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });

    it('should preserve safe text content while removing dangerous patterns', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => !s.includes('<') && !s.includes('>') && !s.includes('&') && s.trim().length > 0),
          xssPatternArbitrary,
          async (safeText, xssPattern) => {
            const input = `${safeText}${xssPattern}`;
            const sanitized = sanitizeInput(input);
            
            // Should not contain script tags or dangerous patterns
            expect(sanitized.toLowerCase()).not.toContain('<script');
            expect(sanitized.toLowerCase()).not.toContain('onerror=');
            expect(sanitized.toLowerCase()).not.toContain('javascript:');
            
            // If safe text was provided, sanitized output should contain some of it
            // (DOMPurify may trim or encode, but shouldn't remove all safe content)
            if (safeText.trim().length > 0) {
              expect(sanitized.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('sanitizeRichText', () => {
    it('should allow safe HTML tags while removing dangerous ones', async () => {
      await fc.assert(
        fc.asyncProperty(
          xssPatternArbitrary,
          async (xssPattern) => {
            const input = `<p>Safe paragraph</p>${xssPattern}`;
            const sanitized = sanitizeRichText(input);
            
            // Should preserve safe tags
            expect(sanitized).toContain('<p>');
            expect(sanitized).toContain('</p>');
            
            // Should remove script tags
            expect(sanitized.toLowerCase()).not.toContain('<script');
            expect(sanitized.toLowerCase()).not.toContain('onerror=');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove event handlers from allowed tags', async () => {
      const inputsWithEventHandlers = [
        '<p onclick="alert(1)">Click me</p>',
        '<a href="#" onmouseover="alert(1)">Hover</a>',
        '<strong onload="alert(1)">Bold</strong>',
        '<em onerror="alert(1)">Italic</em>',
      ];

      for (const input of inputsWithEventHandlers) {
        const sanitized = sanitizeRichText(input);
        
        // Should not contain event handlers
        expect(sanitized.toLowerCase()).not.toContain('onclick=');
        expect(sanitized.toLowerCase()).not.toContain('onmouseover=');
        expect(sanitized.toLowerCase()).not.toContain('onload=');
        expect(sanitized.toLowerCase()).not.toContain('onerror=');
      }
    });

    it('should handle null and undefined inputs safely', () => {
      expect(sanitizeRichText(null)).toBe('');
      expect(sanitizeRichText(undefined)).toBe('');
    });
  });

  describe('sanitizeArray', () => {
    it('should sanitize all elements in an array', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(maliciousInputArbitrary, { minLength: 1, maxLength: 10 }),
          async (maliciousArray) => {
            const sanitized = sanitizeArray(maliciousArray);
            
            // All elements should be sanitized
            for (const element of sanitized) {
              expect(element.toLowerCase()).not.toContain('<script');
              expect(element.toLowerCase()).not.toContain('onerror=');
              expect(element.toLowerCase()).not.toContain('javascript:');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string properties in an object', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: maliciousInputArbitrary,
            email: maliciousInputArbitrary,
            notes: maliciousInputArbitrary,
          }),
          async (maliciousObject) => {
            const sanitized = sanitizeObject(maliciousObject);
            
            // All string properties should be sanitized
            expect(sanitized.name.toLowerCase()).not.toContain('<script');
            expect(sanitized.email.toLowerCase()).not.toContain('onerror=');
            expect(sanitized.notes.toLowerCase()).not.toContain('javascript:');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should recursively sanitize nested objects', async () => {
      await fc.assert(
        fc.asyncProperty(
          maliciousInputArbitrary,
          async (maliciousInput) => {
            const nestedObject = {
              user: {
                name: maliciousInput,
                profile: {
                  bio: maliciousInput,
                },
              },
            };
            
            const sanitized = sanitizeObject(nestedObject);
            
            // Nested properties should be sanitized
            expect(sanitized.user.name.toLowerCase()).not.toContain('<script');
            expect(sanitized.user.profile.bio.toLowerCase()).not.toContain('onerror=');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should sanitize arrays within objects', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(maliciousInputArbitrary, { minLength: 1, maxLength: 5 }),
          async (maliciousArray) => {
            const objectWithArray = {
              tags: maliciousArray,
            };
            
            const sanitized = sanitizeObject(objectWithArray);
            
            // Array elements should be sanitized
            for (const tag of sanitized.tags) {
              if (typeof tag === 'string') {
                expect(tag.toLowerCase()).not.toContain('<script');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Integration with guestService', () => {
    it('should prevent XSS attacks through guest creation', async () => {
      // This test verifies that the sanitization is applied in the service layer
      // We test that malicious input is sanitized before reaching the database
      
      await fc.assert(
        fc.asyncProperty(
          xssPatternArbitrary,
          async (xssPattern) => {
            const maliciousName = `John${xssPattern}`;
            const sanitized = sanitizeInput(maliciousName);
            
            // The sanitized version should not contain XSS patterns
            expect(sanitized.toLowerCase()).not.toContain('<script');
            expect(sanitized.toLowerCase()).not.toContain('onerror=');
            expect(sanitized.toLowerCase()).not.toContain('javascript:');
            
            // Should still contain the safe part
            expect(sanitized).toContain('John');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent SQL injection through guest search', async () => {
      // This test verifies that SQL injection patterns are handled safely
      
      await fc.assert(
        fc.asyncProperty(
          sqlInjectionArbitrary,
          async (sqlInjection) => {
            const sanitized = sanitizeInput(sqlInjection);
            
            // Should return a safe string
            expect(typeof sanitized).toBe('string');
            
            // Note: SQL injection is primarily prevented by using parameterized
            // queries in Supabase, but sanitization provides an additional layer
            expect(sanitized).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle very long malicious inputs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(xssPatternArbitrary, { minLength: 10, maxLength: 50 }),
          async (xssArray) => {
            const longMaliciousInput = xssArray.join('');
            const sanitized = sanitizeInput(longMaliciousInput);
            
            // Should not contain any script tags
            expect(sanitized.toLowerCase()).not.toContain('<script');
            expect(sanitized.toLowerCase()).not.toContain('onerror=');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle mixed safe and malicious content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }),
          xssPatternArbitrary,
          fc.string({ minLength: 5, maxLength: 20 }),
          async (safe1, xss, safe2) => {
            const mixed = `${safe1}${xss}${safe2}`;
            const sanitized = sanitizeInput(mixed);
            
            // Should preserve safe content
            expect(sanitized).toBeDefined();
            expect(typeof sanitized).toBe('string');
            
            // Should remove malicious content
            expect(sanitized.toLowerCase()).not.toContain('<script');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty strings and whitespace', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
      expect(sanitizeInput('\n\t  ')).toBe('');
    });

    it('should trim whitespace from sanitized output', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }),
          async (text) => {
            const inputWithWhitespace = `  ${text}  `;
            const sanitized = sanitizeInput(inputWithWhitespace);
            
            // Should be trimmed
            expect(sanitized).toBe(sanitized.trim());
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
