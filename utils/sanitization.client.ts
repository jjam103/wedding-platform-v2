'use client';

import DOMPurify from 'isomorphic-dompurify';

/**
 * Client-side sanitization utilities using DOMPurify
 * This file must be imported only in client components
 */

/**
 * Sanitizes plain text input by removing all HTML tags and scripts.
 * Use this for user inputs that should not contain any HTML.
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized string with all HTML removed
 * 
 * @example
 * sanitizeInput('<script>alert("xss")</script>Hello')
 * // Returns: 'Hello'
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Sanitizes rich text HTML content, allowing only safe HTML tags.
 * Use this for user inputs that should support basic formatting.
 * 
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML with only safe tags preserved
 * 
 * @example
 * sanitizeRichText('<p>Hello <script>alert("xss")</script></p>')
 * // Returns: '<p>Hello </p>'
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'target'],
  });
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
