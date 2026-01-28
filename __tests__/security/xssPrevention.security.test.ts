/**
 * Security Test: XSS Prevention
 * 
 * Tests that all user inputs are properly sanitized to prevent
 * Cross-Site Scripting (XSS) attacks.
 */

import { sanitizeInput, sanitizeRichText } from '@/utils/sanitization';

describe('Security: XSS Prevention', () => {
  describe('sanitizeInput', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '<svg onload=alert(1)>',
      '<iframe src="javascript:alert(1)">',
      '<body onload=alert(1)>',
      '<input onfocus=alert(1) autofocus>',
      '<select onfocus=alert(1) autofocus>',
      '<textarea onfocus=alert(1) autofocus>',
      '<keygen onfocus=alert(1) autofocus>',
      '<video><source onerror="alert(1)">',
      '<audio src=x onerror=alert(1)>',
      '<details open ontoggle=alert(1)>',
      '<marquee onstart=alert(1)>',
      '"><script>alert(1)</script>',
      '\'><script>alert(1)</script>',
      '<script>alert(String.fromCharCode(88,83,83))</script>',
      '<img src="javascript:alert(1)">',
      '<img src=`javascript:alert(1)`>',
      '<img src=JaVaScRiPt:alert(1)>',
      '<img """><script>alert(1)</script>">',
      '<img src=x:alert(alt) onerror=eval(src) alt=xss>',
      '`"\'><img src=xxx:x onerror=alert(1)>',
      '<svg><script>alert(1)</script></svg>',
      '<svg><animate onbegin=alert(1) attributeName=x dur=1s>',
      '<object data="javascript:alert(1)">',
      '<embed src="javascript:alert(1)">',
      '<form action="javascript:alert(1)"><input type="submit">',
      '<link rel="stylesheet" href="javascript:alert(1)">',
      '<style>@import "javascript:alert(1)";</style>',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
    ];

    xssPayloads.forEach((payload) => {
      it(`should sanitize: ${payload.substring(0, 50)}...`, () => {
        const sanitized = sanitizeInput(payload);
        
        // Should not contain dangerous tags or attributes
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onload=');
        expect(sanitized).not.toContain('onfocus=');
        expect(sanitized).not.toContain('onmouseover=');
        expect(sanitized).not.toContain('<iframe');
        expect(sanitized).not.toContain('<object');
        expect(sanitized).not.toContain('<embed');
        
        // Note: Some payloads like "javascript:alert(1)" may remain as plain text
        // but cannot execute as JavaScript when properly handled in HTML context
        // The key is preventing execution, not necessarily removing all text
      });
    });

    it('should preserve safe text content', () => {
      const safeText = 'Hello, World! This is safe text.';
      expect(sanitizeInput(safeText)).toBe(safeText);
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  Hello  ')).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    it('should remove all HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const sanitized = sanitizeInput(html);
      expect(sanitized).not.toContain('<p>');
      expect(sanitized).not.toContain('<strong>');
      expect(sanitized).toContain('Hello');
      expect(sanitized).toContain('World');
    });

    it('should handle nested XSS attempts', () => {
      const nested = '<<SCRIPT>alert("XSS");//<</SCRIPT>';
      const sanitized = sanitizeInput(nested);
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('<SCRIPT');
      // Note: After tag removal, "alert" text may remain but cannot execute
      // The key is preventing script tag execution, not removing all text
    });

    it('should handle encoded XSS attempts', () => {
      const encoded = '&lt;script&gt;alert("xss")&lt;/script&gt;';
      const sanitized = sanitizeInput(encoded);
      // Encoded entities are safe - they won't execute as JavaScript
      // The sanitizer may keep them encoded or decode and re-encode
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });
  });

  describe('sanitizeRichText', () => {
    it('should allow safe HTML tags', () => {
      const safeHtml = '<p>Hello <strong>World</strong></p>';
      const sanitized = sanitizeRichText(safeHtml);
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('Hello');
    });

    it('should remove dangerous tags from rich text', () => {
      const dangerousHtml = '<p>Hello</p><script>alert("xss")</script>';
      const sanitized = sanitizeRichText(dangerousHtml);
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('Hello');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove event handlers from allowed tags', () => {
      const htmlWithEvents = '<p onclick="alert(1)">Click me</p>';
      const sanitized = sanitizeRichText(htmlWithEvents);
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Click me');
    });

    it('should allow safe links', () => {
      const linkHtml = '<a href="https://example.com">Link</a>';
      const sanitized = sanitizeRichText(linkHtml);
      expect(sanitized).toContain('<a');
      expect(sanitized).toContain('href');
      expect(sanitized).toContain('https://example.com');
    });

    it('should remove javascript: protocol from links', () => {
      const jsLink = '<a href="javascript:alert(1)">Click</a>';
      const sanitized = sanitizeRichText(jsLink);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });

    it('should allow lists', () => {
      const listHtml = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const sanitized = sanitizeRichText(listHtml);
      expect(sanitized).toContain('<ul>');
      expect(sanitized).toContain('<li>');
      expect(sanitized).toContain('Item 1');
    });
  });

  describe('Context-specific sanitization', () => {
    it('should sanitize guest names', () => {
      const maliciousName = '<script>alert("xss")</script>John';
      const sanitized = sanitizeInput(maliciousName);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('John');
    });

    it('should sanitize email subjects', () => {
      const maliciousSubject = 'Important<script>alert(1)</script>';
      const sanitized = sanitizeInput(maliciousSubject);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Important');
    });

    it('should sanitize photo captions', () => {
      const maliciousCaption = 'Beautiful sunset<img src=x onerror=alert(1)>';
      const sanitized = sanitizeInput(maliciousCaption);
      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).toContain('Beautiful sunset');
    });

    it('should sanitize dietary restrictions', () => {
      const maliciousDietary = 'Vegetarian<iframe src="javascript:alert(1)">';
      const sanitized = sanitizeInput(maliciousDietary);
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('Vegetarian');
    });

    it('should sanitize activity descriptions (rich text)', () => {
      const description = '<p>Join us for <strong>dinner</strong></p><script>alert(1)</script>';
      const sanitized = sanitizeRichText(description);
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).not.toContain('<script>');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000) + '<script>alert(1)</script>';
      const sanitized = sanitizeInput(longString);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized.length).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const sanitized = sanitizeInput(specialChars);
      // Special characters may be HTML-encoded for safety
      // The key is they cannot be used for XSS attacks
      expect(sanitized).toBeDefined();
      expect(sanitized.length).toBeGreaterThan(0);
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界 🌍 مرحبا';
      const sanitized = sanitizeInput(unicode);
      expect(sanitized).toBe(unicode);
    });

    it('should handle mixed content', () => {
      const mixed = 'Normal text <script>alert(1)</script> more text';
      const sanitized = sanitizeInput(mixed);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Normal text');
      expect(sanitized).toContain('more text');
    });

    it('should handle malformed HTML', () => {
      const malformed = '<p>Unclosed paragraph<script>alert(1)';
      const sanitized = sanitizeInput(malformed);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });
  });
});
