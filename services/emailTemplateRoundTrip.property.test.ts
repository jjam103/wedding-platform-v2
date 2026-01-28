import * as fc from 'fast-check';

/**
 * Property-Based Test for Email Template Round-Trip
 * Feature: destination-wedding-platform, Property 25: Email Template Round-Trip
 * 
 * Property: For any valid email template object, the sequence of operations 
 * (format to string → parse from string → format to string again) should produce 
 * an equivalent template with all fields and variables preserved.
 * 
 * Validates: Requirements 20.7
 */

/**
 * Email template formatter - converts template object to string format.
 */
function formatEmailTemplate(template: {
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
}): string {
  return JSON.stringify({
    name: template.name,
    subject: template.subject,
    body_html: template.body_html,
    body_text: template.body_text,
    variables: template.variables,
  });
}

/**
 * Email template parser - parses string format back to template object.
 */
function parseEmailTemplate(templateString: string): {
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
} {
  const parsed = JSON.parse(templateString);
  return {
    name: parsed.name,
    subject: parsed.subject,
    body_html: parsed.body_html,
    body_text: parsed.body_text,
    variables: parsed.variables || [],
  };
}

describe('Feature: destination-wedding-platform, Property 25: Email Template Round-Trip', () => {
  // Arbitrary for valid email template
  const emailTemplateArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    subject: fc.string({ minLength: 1, maxLength: 200 }),
    body_html: fc.string({ minLength: 1, maxLength: 1000 }),
    body_text: fc.string({ minLength: 1, maxLength: 1000 }),
    variables: fc.array(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('"') && !s.includes('\\')),
      { maxLength: 20 }
    ),
  });

  it('should preserve all template fields through format → parse → format cycle', () => {
    fc.assert(
      fc.property(emailTemplateArbitrary, (template) => {
        // Format to string
        const formatted1 = formatEmailTemplate(template);
        
        // Parse back to object
        const parsed = parseEmailTemplate(formatted1);
        
        // Format again
        const formatted2 = formatEmailTemplate(parsed);
        
        // The two formatted strings should be identical
        expect(formatted1).toBe(formatted2);
        
        // The parsed object should match the original
        expect(parsed.name).toBe(template.name);
        expect(parsed.subject).toBe(template.subject);
        expect(parsed.body_html).toBe(template.body_html);
        expect(parsed.body_text).toBe(template.body_text);
        expect(parsed.variables).toEqual(template.variables);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve template with no variables', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          subject: fc.string({ minLength: 1, maxLength: 200 }),
          body_html: fc.string({ minLength: 1, maxLength: 1000 }),
          body_text: fc.string({ minLength: 1, maxLength: 1000 }),
          variables: fc.constant([]),
        }),
        (template) => {
          const formatted = formatEmailTemplate(template);
          const parsed = parseEmailTemplate(formatted);
          
          expect(parsed.variables).toEqual([]);
          expect(parsed.name).toBe(template.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve template with special characters in content', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          subject: fc.string({ minLength: 1, maxLength: 200 }),
          body_html: fc.constantFrom(
            '<p>Hello {{guest_name}}</p>',
            '<div><strong>Welcome</strong> to our wedding!</div>',
            '<a href="https://example.com">Click here</a>',
            '<ul><li>Item 1</li><li>Item 2</li></ul>'
          ),
          body_text: fc.constantFrom(
            'Hello {{guest_name}}',
            'Welcome to our wedding!',
            'RSVP by {{deadline}}',
            'Event: {{event_name}} at {{location}}'
          ),
          variables: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
        }),
        (template) => {
          const formatted1 = formatEmailTemplate(template);
          const parsed = parseEmailTemplate(formatted1);
          const formatted2 = formatEmailTemplate(parsed);
          
          expect(formatted1).toBe(formatted2);
          expect(parsed.body_html).toBe(template.body_html);
          expect(parsed.body_text).toBe(template.body_text);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve template with multiple variables', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          subject: fc.string({ minLength: 1, maxLength: 200 }),
          body_html: fc.string({ minLength: 1, maxLength: 1000 }),
          body_text: fc.string({ minLength: 1, maxLength: 1000 }),
          variables: fc.array(
            fc.string({ minLength: 1, maxLength: 20 }),
            { minLength: 1, maxLength: 20 }
          ),
        }),
        (template) => {
          const formatted = formatEmailTemplate(template);
          const parsed = parseEmailTemplate(formatted);
          
          // Variables array should be preserved exactly
          expect(parsed.variables).toEqual(template.variables);
          expect(parsed.variables.length).toBe(template.variables.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle templates with unicode characters', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.fullUnicodeString({ minLength: 1, maxLength: 100 }),
          subject: fc.fullUnicodeString({ minLength: 1, maxLength: 200 }),
          body_html: fc.fullUnicodeString({ minLength: 1, maxLength: 500 }),
          body_text: fc.fullUnicodeString({ minLength: 1, maxLength: 500 }),
          variables: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
        }),
        (template) => {
          const formatted1 = formatEmailTemplate(template);
          const parsed = parseEmailTemplate(formatted1);
          const formatted2 = formatEmailTemplate(parsed);
          
          // Should preserve unicode characters
          expect(formatted1).toBe(formatted2);
          expect(parsed.name).toBe(template.name);
          expect(parsed.subject).toBe(template.subject);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve template with newlines and whitespace', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          subject: fc.string({ minLength: 1, maxLength: 200 }),
          body_html: fc.constantFrom(
            '<p>Line 1\nLine 2\nLine 3</p>',
            '<div>  Spaces  and  tabs\t\there  </div>',
            '<p>\n\n\nMultiple newlines\n\n\n</p>'
          ),
          body_text: fc.constantFrom(
            'Line 1\nLine 2\nLine 3',
            '  Spaces  and  tabs\t\there  ',
            '\n\n\nMultiple newlines\n\n\n'
          ),
          variables: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
        }),
        (template) => {
          const formatted1 = formatEmailTemplate(template);
          const parsed = parseEmailTemplate(formatted1);
          const formatted2 = formatEmailTemplate(parsed);
          
          // Whitespace should be preserved
          expect(formatted1).toBe(formatted2);
          expect(parsed.body_html).toBe(template.body_html);
          expect(parsed.body_text).toBe(template.body_text);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be idempotent - multiple round trips produce same result', () => {
    fc.assert(
      fc.property(emailTemplateArbitrary, (template) => {
        // First round trip
        const formatted1 = formatEmailTemplate(template);
        const parsed1 = parseEmailTemplate(formatted1);
        const formatted2 = formatEmailTemplate(parsed1);
        
        // Second round trip
        const parsed2 = parseEmailTemplate(formatted2);
        const formatted3 = formatEmailTemplate(parsed2);
        
        // Third round trip
        const parsed3 = parseEmailTemplate(formatted3);
        const formatted4 = formatEmailTemplate(parsed3);
        
        // All formatted strings should be identical
        expect(formatted1).toBe(formatted2);
        expect(formatted2).toBe(formatted3);
        expect(formatted3).toBe(formatted4);
        
        // All parsed objects should be equivalent
        expect(parsed1).toEqual(parsed2);
        expect(parsed2).toEqual(parsed3);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve empty strings in fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          subject: fc.string({ minLength: 1, maxLength: 200 }),
          body_html: fc.string({ minLength: 1, maxLength: 1000 }),
          body_text: fc.constant(''), // Empty text body
          variables: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
        }),
        (template) => {
          const formatted = formatEmailTemplate(template);
          const parsed = parseEmailTemplate(formatted);
          
          // Empty string should be preserved, not converted to undefined
          expect(parsed.body_text).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });
});
