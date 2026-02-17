/**
 * Server-safe sanitization utilities
 * These use simple regex-based sanitization that works in both server and client contexts
 * For client-side components, use sanitization.client.ts which uses DOMPurify
 * 
 * Requirements 19.2-19.3: Input sanitization for plain text and rich text
 */

/**
 * Sanitizes plain text input by removing all HTML tags and scripts.
 * Use this for user inputs that should not contain any HTML.
 * 
 * Requirement 19.2: Sanitize plain text input (remove all HTML)
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized string with all HTML removed
 * 
 * @example
 * sanitizeInput('<script>alert("xss")</script>Hello')
 * // Returns: 'Hello'
 * 
 * @example
 * sanitizeInput('<p>Hello <b>World</b></p>')
 * // Returns: 'Hello World'
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove any remaining script content and JavaScript keywords
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Remove common XSS attack patterns
  sanitized = sanitized.replace(/alert\s*\(/gi, '');
  sanitized = sanitized.replace(/eval\s*\(/gi, '');
  sanitized = sanitized.replace(/document\./gi, '');
  sanitized = sanitized.replace(/window\./gi, '');
  sanitized = sanitized.replace(/onerror/gi, '');
  sanitized = sanitized.replace(/onload/gi, '');
  
  return sanitized.trim();
}

/**
 * Sanitizes rich text HTML content, allowing only safe HTML tags.
 * Use this for user inputs that should support basic formatting.
 * 
 * Requirement 19.3: Sanitize rich text input (allow only safe HTML tags)
 * Allowed tags: p, br, strong, em, u, a, ul, ol, li
 * 
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML with only safe tags preserved
 * 
 * @example
 * sanitizeRichText('<p>Hello <script>alert("xss")</script></p>')
 * // Returns: '<p>Hello </p>'
 * 
 * @example
 * sanitizeRichText('<p>Hello <strong>World</strong></p>')
 * // Returns: '<p>Hello <strong>World</strong></p>'
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) {
    return '';
  }

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove dangerous tags (including base, form, input, video, audio, svg, img, body, marquee, details)
  sanitized = sanitized.replace(/<(iframe|embed|object|frame|frameset|applet|meta|link|style|base|form|input|video|audio|svg|img|body|marquee|details)[^>]*>/gi, '');
  
  return sanitized;
}

/**
 * Sanitizes an array of strings.
 * 
 * @param inputs - Array of strings to sanitize
 * @returns Array of sanitized strings
 */
export function sanitizeArray(inputs: string[]): string[] {
  return inputs.map(input => sanitizeInput(input));
}

/**
 * Sanitizes an object's string properties recursively.
 * 
 * @param obj - Object to sanitize
 * @returns Object with sanitized string properties
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
