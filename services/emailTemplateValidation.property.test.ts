import * as fc from 'fast-check';
import { createTemplate } from './emailService';
import type { CreateEmailTemplateDTO } from '@/schemas/emailSchemas';

/**
 * Property-Based Test for Email Template Validation
 * Feature: destination-wedding-platform, Property 17: Email Template Validation
 * 
 * Property: For any email template with invalid syntax (unclosed tags, malformed HTML) 
 * or undefined variable references (variables not in the allowed list), the validation 
 * function should reject the template and return specific errors.
 * 
 * Validates: Requirements 13.8
 */

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn((data) => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              id: 'test-id', 
              ...data,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, 
            error: null 
          })),
        })),
      })),
    })),
  })),
}));

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn(() => ({})),
}));

describe('Feature: destination-wedding-platform, Property 17: Email Template Validation', () => {
  // Arbitrary for valid template data
  const validTemplateArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    subject: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
    body_html: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    body_text: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    variables: fc.array(
      fc.string({ minLength: 1, maxLength: 20 })
        .filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)), // Valid variable names only
      { maxLength: 10 }
    ),
  });

  // Arbitrary for templates with undefined variables
  const undefinedVariableArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    subject: fc.string({ minLength: 1, maxLength: 200 }),
    body_html: fc.constantFrom(
      'Hello {{undefined_var}}',
      'Welcome {{missing_var}} to our wedding',
      'RSVP by {{unknown_date}}',
      '{{bad_var}} is not defined'
    ),
    body_text: fc.string({ minLength: 1, maxLength: 500 }),
    variables: fc.constant(['guest_name', 'event_name']), // Defined variables
  });

  // Arbitrary for templates with malformed HTML
  const malformedHTMLArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    subject: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
    body_html: fc.constantFrom(
      '<p>Unclosed paragraph',
      '<div><span>Unclosed span</div>',
      '<strong>Bold <em>italic</strong></em>',
      '<a href="test">Link without closing',
      '<script>alert("xss")</script>', // Should be sanitized
    ),
    body_text: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    variables: fc.array(
      fc.string({ minLength: 1, maxLength: 20 })
        .filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
      { maxLength: 5 }
    ),
  });

  it('should reject templates with undefined variable references', async () => {
    await fc.assert(
      fc.asyncProperty(undefinedVariableArbitrary, async (templateData) => {
        const result = await createTemplate(templateData);

        // Should fail validation
        expect(result.success).toBe(false);
        
        if (!result.success) {
          // Should return VALIDATION_ERROR
          expect(result.error.code).toBe('VALIDATION_ERROR');
          
          // Should mention undefined variables
          expect(
            result.error.message.toLowerCase().includes('undefined') ||
            result.error.message.toLowerCase().includes('variable')
          ).toBe(true);
          
          // Should provide details about which variables are undefined
          expect(result.error.details).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should accept templates with all variables properly defined', async () => {
    await fc.assert(
      fc.asyncProperty(validTemplateArbitrary, async (templateData) => {
        // Create template with variables that are all used in the body
        const variables = templateData.variables;
        const body_html = `<p>Hello {{${variables[0] || 'guest_name'}}}</p>`;
        const body_text = `Hello {{${variables[0] || 'guest_name'}}}`;

        const result = await createTemplate({
          ...templateData,
          body_html,
          body_text,
          variables: variables.length > 0 ? variables : ['guest_name'],
        });

        // Should succeed
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should sanitize malformed HTML but still accept template', async () => {
    await fc.assert(
      fc.asyncProperty(malformedHTMLArbitrary, async (templateData) => {
        const result = await createTemplate(templateData);

        // Malformed HTML should be sanitized, not rejected
        // (DOMPurify will clean it up)
        expect(result.success).toBe(true);
        
        if (result.success) {
          // Script tags should be removed
          expect(result.data.body_html).not.toContain('<script>');
          expect(result.data.body_html).not.toContain('alert');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should reject templates with variables in body but not in variables array', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          subject: fc.string({ minLength: 1, maxLength: 200 }),
          body_html: fc.constant('<p>Hello {{guest_name}}, welcome to {{event_name}}</p>'),
          body_text: fc.constant('Hello {{guest_name}}, welcome to {{event_name}}'),
          variables: fc.constant(['guest_name']), // Missing event_name
        }),
        async (templateData) => {
          const result = await createTemplate(templateData);

          // Should fail because event_name is not in variables array
          expect(result.success).toBe(false);
          
          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
            expect(result.error.details).toBeDefined();
            
            // Should identify event_name as undefined
            const details = result.error.details as any;
            if (details.undefinedVariables) {
              expect(details.undefinedVariables).toContain('event_name');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate both HTML and text bodies for undefined variables', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          subject: fc.string({ minLength: 1, maxLength: 200 }),
          body_html: fc.constant('<p>Hello {{guest_name}}</p>'),
          body_text: fc.constant('Hello {{undefined_var}}'), // Undefined in text
          variables: fc.constant(['guest_name']),
        }),
        async (templateData) => {
          const result = await createTemplate(templateData);

          // Should fail because text body has undefined variable
          expect(result.success).toBe(false);
          
          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle templates with no variables', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          subject: fc.string({ minLength: 1, maxLength: 200 }),
          body_html: fc.string({ minLength: 1, maxLength: 500 }).filter(s => !s.includes('{{')),
          body_text: fc.string({ minLength: 1, maxLength: 500 }).filter(s => !s.includes('{{')),
          variables: fc.constant([]),
        }),
        async (templateData) => {
          const result = await createTemplate(templateData);

          // Should succeed - no variables to validate
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject templates with missing required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.record({
            name: fc.constant(''),
            subject: fc.string({ minLength: 1, maxLength: 200 }),
            body_html: fc.string({ minLength: 1, maxLength: 500 }),
            body_text: fc.string({ minLength: 1, maxLength: 500 }),
            variables: fc.array(fc.string()),
          }),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            subject: fc.constant(''),
            body_html: fc.string({ minLength: 1, maxLength: 500 }),
            body_text: fc.string({ minLength: 1, maxLength: 500 }),
            variables: fc.array(fc.string()),
          }),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            subject: fc.string({ minLength: 1, maxLength: 200 }),
            body_html: fc.constant(''),
            body_text: fc.string({ minLength: 1, maxLength: 500 }),
            variables: fc.array(fc.string()),
          })
        ),
        async (templateData) => {
          const result = await createTemplate(templateData as CreateEmailTemplateDTO);

          // Should fail validation for missing required fields
          expect(result.success).toBe(false);
          
          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
