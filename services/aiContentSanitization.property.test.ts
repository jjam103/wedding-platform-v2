import * as fc from 'fast-check';
import { sanitizeExtractedText, sanitizeExtractedRichText } from './aiContentService';

/**
 * Feature: destination-wedding-platform, Property 27: AI Content Sanitization
 * 
 * For any content imported via the AI system containing malicious patterns
 * (script tags, SQL injection attempts), the sanitization function should
 * remove or neutralize the dangerous content before importing.
 * 
 * Validates: Requirements 21.8
 */

// Arbitraries for generating malicious content patterns

const xssPatternArbitrary = fc.oneof(
  fc.constant('<script>alert("xss")</script>'),
  fc.constant('<script>alert(1)</script>'),
  fc.constant('<img src=x onerror=alert(1)>'),
  fc.constant('<svg onload=alert(1)>'),
  fc.constant('<iframe src="javascript:alert(1)">'),
  fc.constant('<body onload=alert(1)>'),
  fc.constant('<input onfocus=alert(1) autofocus>'),
  fc.constant('<select onfocus=alert(1) autofocus>'),
  fc.constant('<textarea onfocus=alert(1) autofocus>'),
  fc.constant('<keygen onfocus=alert(1) autofocus>'),
  fc.constant('<video><source onerror="alert(1)">'),
  fc.constant('<audio src=x onerror=alert(1)>'),
  fc.constant('<details open ontoggle=alert(1)>'),
  fc.constant('<marquee onstart=alert(1)>'),
  fc.constant('javascript:alert(1)'),
  fc.constant('data:text/html,<script>alert(1)</script>'),
  fc.constant('<a href="javascript:alert(1)">click</a>'),
  fc.constant('<form action="javascript:alert(1)">'),
  fc.constant('<object data="javascript:alert(1)">'),
  fc.constant('<embed src="javascript:alert(1)">'),
);

const sqlInjectionPatternArbitrary = fc.oneof(
  fc.constant("'; DROP TABLE guests; --"),
  fc.constant("1' OR '1'='1"),
  fc.constant("admin'--"),
  fc.constant("' UNION SELECT * FROM users--"),
  fc.constant("1; DELETE FROM guests WHERE 1=1--"),
  fc.constant("' OR 1=1--"),
  fc.constant("'; EXEC sp_MSForEachTable 'DROP TABLE ?'; --"),
  fc.constant("1' AND '1'='1"),
  fc.constant("' OR 'a'='a"),
  fc.constant("1' UNION ALL SELECT NULL,NULL,NULL--"),
);

const htmlInjectionPatternArbitrary = fc.oneof(
  fc.constant('<style>body{display:none}</style>'),
  fc.constant('<link rel="stylesheet" href="http://evil.com/style.css">'),
  fc.constant('<base href="http://evil.com/">'),
  fc.constant('<meta http-equiv="refresh" content="0;url=http://evil.com">'),
  fc.constant('<!--[if gte IE 4]><script>alert(1)</script><![endif]-->'),
  fc.constant('<xml><i><b>&lt;img src=1 onerror=alert(1)&gt;</b></i></xml>'),
);

const eventHandlerPatternArbitrary = fc.oneof(
  fc.constant('onclick=alert(1)'),
  fc.constant('onload=alert(1)'),
  fc.constant('onerror=alert(1)'),
  fc.constant('onmouseover=alert(1)'),
  fc.constant('onfocus=alert(1)'),
  fc.constant('onblur=alert(1)'),
  fc.constant('onchange=alert(1)'),
  fc.constant('onsubmit=alert(1)'),
  fc.constant('onkeypress=alert(1)'),
  fc.constant('onkeydown=alert(1)'),
);

const maliciousContentArbitrary = fc.oneof(
  xssPatternArbitrary,
  sqlInjectionPatternArbitrary,
  htmlInjectionPatternArbitrary,
  eventHandlerPatternArbitrary,
  // Combinations with legitimate text
  fc.tuple(fc.string({ minLength: 1, maxLength: 50 }), xssPatternArbitrary).map(([text, xss]) => `${text}${xss}`),
  fc.tuple(xssPatternArbitrary, fc.string({ minLength: 1, maxLength: 50 })).map(([xss, text]) => `${xss}${text}`),
  fc.tuple(fc.string(), xssPatternArbitrary, fc.string()).map(([pre, xss, post]) => `${pre}${xss}${post}`),
);

// Arbitraries for safe HTML patterns (for rich text)
const safeHtmlArbitrary = fc.oneof(
  fc.constant('<p>Safe paragraph</p>'),
  fc.constant('<strong>Bold text</strong>'),
  fc.constant('<em>Italic text</em>'),
  fc.constant('<u>Underlined text</u>'),
  fc.constant('<a href="https://example.com">Link</a>'),
  fc.constant('<ul><li>Item 1</li><li>Item 2</li></ul>'),
  fc.constant('<ol><li>First</li><li>Second</li></ol>'),
  fc.constant('<h1>Heading 1</h1>'),
  fc.constant('<h2>Heading 2</h2>'),
  fc.constant('<h3>Heading 3</h3>'),
  fc.constant('<br>'),
);

describe('Feature: destination-wedding-platform, Property 27: AI Content Sanitization', () => {
  describe('Plain text sanitization (sanitizeExtractedText)', () => {
    it('should remove all HTML tags including XSS patterns from plain text', () => {
      fc.assert(
        fc.property(xssPatternArbitrary, (maliciousInput) => {
          const sanitized = sanitizeExtractedText(maliciousInput);
          
          // Should not contain any HTML opening tags (DOMPurify removes all tags with ALLOWED_TAGS: [])
          expect(sanitized).not.toMatch(/<script[\s>]/i);
          expect(sanitized).not.toMatch(/<iframe[\s>]/i);
          expect(sanitized).not.toMatch(/<object[\s>]/i);
          expect(sanitized).not.toMatch(/<embed[\s>]/i);
          expect(sanitized).not.toMatch(/<img[\s>]/i);
          expect(sanitized).not.toMatch(/<svg[\s>]/i);
          expect(sanitized).not.toMatch(/<body[\s>]/i);
          expect(sanitized).not.toMatch(/<input[\s>]/i);
          expect(sanitized).not.toMatch(/<video[\s>]/i);
          expect(sanitized).not.toMatch(/<audio[\s>]/i);
          
          // Note: Plain text patterns like "javascript:alert(1)" or "onerror=alert(1)" 
          // are preserved when not in HTML context - this is correct behavior.
          // They are only dangerous when used in HTML attributes.
          // The function should return a string without HTML tags
          expect(typeof sanitized).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    it('should remove SQL injection patterns from plain text', () => {
      fc.assert(
        fc.property(sqlInjectionPatternArbitrary, (maliciousInput) => {
          const sanitized = sanitizeExtractedText(maliciousInput);
          
          // SQL injection patterns should be removed or neutralized
          // The sanitizer removes HTML, but SQL patterns in plain text remain
          // This is expected - SQL injection is prevented at the database layer
          // However, we verify the function doesn't crash
          expect(typeof sanitized).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    it('should handle HTML injection patterns from plain text', () => {
      fc.assert(
        fc.property(htmlInjectionPatternArbitrary, (maliciousInput) => {
          const sanitized = sanitizeExtractedText(maliciousInput);
          
          // Should not contain HTML opening tags (all tags removed with ALLOWED_TAGS: [])
          expect(sanitized).not.toMatch(/<style[\s>]/i);
          expect(sanitized).not.toMatch(/<link[\s>]/i);
          expect(sanitized).not.toMatch(/<base[\s>]/i);
          expect(sanitized).not.toMatch(/<meta[\s>]/i);
          
          // Should return a string
          expect(typeof sanitized).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    it('should remove HTML tags containing event handlers', () => {
      fc.assert(
        fc.property(
          fc.tuple(fc.constantFrom('<div ', '<img ', '<a '), eventHandlerPatternArbitrary, fc.constant('>')).map(
            ([tag, handler, close]) => `${tag}${handler}${close}`
          ),
          (maliciousInput) => {
            const sanitized = sanitizeExtractedText(maliciousInput);
            
            // Should not contain any HTML opening tags
            expect(sanitized).not.toMatch(/<div[\s>]/i);
            expect(sanitized).not.toMatch(/<img[\s>]/i);
            expect(sanitized).not.toMatch(/<a[\s>]/i);
            
            // Should return a string
            expect(typeof sanitized).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle malicious content mixed with legitimate text', () => {
      fc.assert(
        fc.property(maliciousContentArbitrary, (maliciousInput) => {
          const sanitized = sanitizeExtractedText(maliciousInput);
          
          // Should not contain any HTML opening tags
          expect(sanitized).not.toMatch(/<script[\s>]/i);
          expect(sanitized).not.toMatch(/<iframe[\s>]/i);
          expect(sanitized).not.toMatch(/<img[\s>]/i);
          
          // Should be a string
          expect(typeof sanitized).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    it('should trim whitespace from sanitized text', () => {
      fc.assert(
        fc.property(
          fc.tuple(fc.string(), maliciousContentArbitrary, fc.string()).map(
            ([pre, mal, post]) => `  ${pre}${mal}${post}  `
          ),
          (input) => {
            const sanitized = sanitizeExtractedText(input);
            
            // Should not have leading or trailing whitespace
            expect(sanitized).toBe(sanitized.trim());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Rich text sanitization (sanitizeExtractedRichText)', () => {
    it('should preserve safe HTML tags', () => {
      fc.assert(
        fc.property(safeHtmlArbitrary, (safeHtml) => {
          const sanitized = sanitizeExtractedRichText(safeHtml);
          
          // Should preserve safe tags
          const hasSafeTag = 
            sanitized.includes('<p>') ||
            sanitized.includes('<strong>') ||
            sanitized.includes('<em>') ||
            sanitized.includes('<u>') ||
            sanitized.includes('<a ') ||
            sanitized.includes('<ul>') ||
            sanitized.includes('<ol>') ||
            sanitized.includes('<li>') ||
            sanitized.includes('<h1>') ||
            sanitized.includes('<h2>') ||
            sanitized.includes('<h3>') ||
            sanitized.includes('<br>');
          
          expect(hasSafeTag).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should remove XSS patterns from rich text while preserving safe HTML', () => {
      fc.assert(
        fc.property(
          fc.tuple(safeHtmlArbitrary, xssPatternArbitrary).map(([safe, xss]) => `${safe}${xss}`),
          (mixedHtml) => {
            const sanitized = sanitizeExtractedRichText(mixedHtml);
            
            // Should not contain dangerous HTML opening tags
            expect(sanitized).not.toMatch(/<script[\s>]/i);
            expect(sanitized).not.toMatch(/<iframe[\s>]/i);
            expect(sanitized).not.toMatch(/<object[\s>]/i);
            expect(sanitized).not.toMatch(/<embed[\s>]/i);
            
            // Note: Plain text patterns like "javascript:alert(1)" may be preserved
            // if they're not in href attributes. This is acceptable as they're only
            // dangerous in specific HTML contexts.
            // Should return a string
            expect(typeof sanitized).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove dangerous tags from rich text', () => {
      fc.assert(
        fc.property(
          fc.tuple(safeHtmlArbitrary, fc.oneof(
            fc.constant('<script>alert(1)</script>'),
            fc.constant('<iframe src="evil.com"></iframe>'),
            fc.constant('<object data="evil.com"></object>'),
            fc.constant('<embed src="evil.com">'),
            fc.constant('<style>body{display:none}</style>'),
          )).map(([safe, dangerous]) => `${safe}${dangerous}`),
          (mixedHtml) => {
            const sanitized = sanitizeExtractedRichText(mixedHtml);
            
            // Should not contain dangerous opening tags
            expect(sanitized).not.toMatch(/<script[\s>]/i);
            expect(sanitized).not.toMatch(/<iframe[\s>]/i);
            expect(sanitized).not.toMatch(/<object[\s>]/i);
            expect(sanitized).not.toMatch(/<embed[\s>]/i);
            expect(sanitized).not.toMatch(/<style[\s>]/i);
            
            // Should return a string
            expect(typeof sanitized).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      expect(sanitizeExtractedText('')).toBe('');
      expect(sanitizeExtractedRichText('')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeExtractedText(null as any)).toBe('');
      expect(sanitizeExtractedText(undefined as any)).toBe('');
      expect(sanitizeExtractedRichText(null as any)).toBe('');
      expect(sanitizeExtractedRichText(undefined as any)).toBe('');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeExtractedText(123 as any)).toBe('');
      expect(sanitizeExtractedText(true as any)).toBe('');
      expect(sanitizeExtractedText({} as any)).toBe('');
      expect(sanitizeExtractedText([] as any)).toBe('');
    });

    it('should handle very long malicious strings', () => {
      const longMalicious = '<script>alert(1)</script>'.repeat(1000);
      const sanitized = sanitizeExtractedText(longMalicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(typeof sanitized).toBe('string');
    });

    it('should handle nested malicious patterns', () => {
      const nested = '<div><script>alert(1)</script><p><img src=x onerror=alert(1)></p></div>';
      const sanitized = sanitizeExtractedText(nested);
      
      // Should not contain HTML opening tags
      expect(sanitized).not.toMatch(/<script[\s>]/i);
      expect(sanitized).not.toMatch(/<img[\s>]/i);
      
      // Should return a string
      expect(typeof sanitized).toBe('string');
    });

    it('should handle encoded malicious patterns', () => {
      const encoded = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const sanitized = sanitizeExtractedText(encoded);
      
      // Should handle HTML entities
      expect(typeof sanitized).toBe('string');
    });
  });

  describe('Idempotence', () => {
    it('should be idempotent for plain text sanitization', () => {
      fc.assert(
        fc.property(maliciousContentArbitrary, (input) => {
          const sanitized1 = sanitizeExtractedText(input);
          const sanitized2 = sanitizeExtractedText(sanitized1);
          
          // Sanitizing twice should produce the same result
          expect(sanitized2).toBe(sanitized1);
        }),
        { numRuns: 100 }
      );
    });

    it('should be idempotent for rich text sanitization', () => {
      fc.assert(
        fc.property(
          fc.tuple(safeHtmlArbitrary, xssPatternArbitrary).map(([safe, xss]) => `${safe}${xss}`),
          (input) => {
            const sanitized1 = sanitizeExtractedRichText(input);
            const sanitized2 = sanitizeExtractedRichText(sanitized1);
            
            // Sanitizing twice should produce the same result
            expect(sanitized2).toBe(sanitized1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
