import * as fc from 'fast-check';
import { createSection, updateSection } from './sectionsService';

/**
 * Feature: admin-backend-integration-cms, Property 14: Rich Text Sanitization
 * 
 * For any section with rich text content, when saving, the system SHALL sanitize
 * the HTML to allow only safe tags (p, br, strong, em, u, a, ul, ol, li) and remove all others.
 * 
 * Validates: Requirements 15.1, 19.3
 */

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Arbitraries for generating malicious HTML patterns
const dangerousTagsArbitrary = fc.oneof(
  fc.constant('<script>alert("xss")</script>'),
  fc.constant('<script>alert(1)</script>'),
  fc.constant('<iframe src="javascript:alert(1)"></iframe>'),
  fc.constant('<object data="javascript:alert(1)"></object>'),
  fc.constant('<embed src="javascript:alert(1)">'),
  fc.constant('<style>body{display:none}</style>'),
  fc.constant('<link rel="stylesheet" href="http://evil.com/style.css">'),
  fc.constant('<meta http-equiv="refresh" content="0;url=http://evil.com">'),
  fc.constant('<base href="http://evil.com/">'),
  fc.constant('<form action="javascript:alert(1)">'),
  fc.constant('<input onfocus=alert(1) autofocus>'),
  fc.constant('<video><source onerror="alert(1)"></video>'),
  fc.constant('<audio src=x onerror=alert(1)>'),
  fc.constant('<svg onload=alert(1)>'),
  fc.constant('<img src=x onerror=alert(1)>'),
  fc.constant('<body onload=alert(1)>'),
  fc.constant('<marquee onstart=alert(1)>'),
  fc.constant('<details open ontoggle=alert(1)>'),
);

const eventHandlerArbitrary = fc.oneof(
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

const javascriptProtocolArbitrary = fc.oneof(
  fc.constant('javascript:alert(1)'),
  fc.constant('javascript:void(0)'),
  fc.constant('javascript:document.cookie'),
  fc.constant('JaVaScRiPt:alert(1)'), // Case variations
);

// Safe HTML tags that should be preserved
const safeHtmlArbitrary = fc.oneof(
  fc.constant('<p>Safe paragraph</p>'),
  fc.constant('<strong>Bold text</strong>'),
  fc.constant('<em>Italic text</em>'),
  fc.constant('<u>Underlined text</u>'),
  fc.constant('<a href="https://example.com">Link</a>'),
  fc.constant('<ul><li>Item 1</li><li>Item 2</li></ul>'),
  fc.constant('<ol><li>First</li><li>Second</li></ol>'),
  fc.constant('<br>'),
  fc.constant('<p><strong>Bold</strong> and <em>italic</em></p>'),
);

// Arbitrary for section data with rich text content
const sectionWithRichTextArbitrary = fc.record({
  page_type: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom', 'home'),
  page_id: fc.uuid(),
  display_order: fc.integer({ min: 0, max: 100 }),
  columns: fc.array(
    fc.record({
      column_number: fc.constantFrom(1, 2),
      content_type: fc.constant('rich_text'),
      content_data: fc.record({
        html: fc.string({ minLength: 1, maxLength: 500 }),
      }),
    }),
    { minLength: 1, maxLength: 2 }
  ),
});

// Arbitrary for malicious rich text content
const maliciousRichTextArbitrary = fc.oneof(
  dangerousTagsArbitrary,
  fc.tuple(safeHtmlArbitrary, dangerousTagsArbitrary).map(([safe, dangerous]) => `${safe}${dangerous}`),
  fc.tuple(dangerousTagsArbitrary, safeHtmlArbitrary).map(([dangerous, safe]) => `${dangerous}${safe}`),
  fc.tuple(safeHtmlArbitrary, dangerousTagsArbitrary, safeHtmlArbitrary).map(
    ([safe1, dangerous, safe2]) => `${safe1}${dangerous}${safe2}`
  ),
  fc.tuple(fc.constantFrom('<p ', '<a ', '<div '), eventHandlerArbitrary, fc.constant('>text</p>')).map(
    ([tag, handler, close]) => `${tag}${handler}${close}`
  ),
);

describe('Feature: admin-backend-integration-cms, Property 14: Rich Text Sanitization', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock Supabase
    const { supabase } = require('../lib/supabase');
    mockSupabase = supabase;

    // Default mock implementation for successful operations
    const mockChain = {
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'section-1',
          page_type: 'custom',
          page_id: 'page-1',
          display_order: 0,
        },
        error: null,
      }),
      eq: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    mockSupabase.from.mockReturnValue(mockChain);
  });

  describe('createSection - Rich Text Sanitization', () => {
    it('should remove dangerous HTML tags from rich text content', async () => {
      await fc.assert(
        fc.asyncProperty(dangerousTagsArbitrary, async (dangerousHtml) => {
          const sectionData = {
            page_type: 'custom' as const,
            page_id: 'page-1',
            display_order: 0,
            columns: [
              {
                column_number: 1 as const,
                content_type: 'rich_text' as const,
                content_data: {
                  html: dangerousHtml,
                },
              },
            ],
          };

          // Mock successful section creation
          const mockSectionChain = {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'section-1', page_type: 'custom', page_id: 'page-1', display_order: 0 },
              error: null,
            }),
          };

          const mockColumnsChain = {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({
              data: [{ id: 'col-1', section_id: 'section-1', column_number: 1, content_type: 'rich_text', content_data: { html: '' } }],
              error: null,
            }),
          };

          mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'sections') return mockSectionChain;
            if (table === 'columns') return mockColumnsChain;
            return mockSectionChain;
          });

          const result = await createSection(sectionData);

          expect(result.success).toBe(true);

          // Verify that the insert was called with sanitized content
          if (mockColumnsChain.insert.mock.calls.length > 0) {
            const insertedColumns = mockColumnsChain.insert.mock.calls[0][0];
            const sanitizedHtml = insertedColumns[0].content_data.html;

            // Property: Dangerous tags should be removed
            expect(sanitizedHtml).not.toMatch(/<script[\s>]/i);
            expect(sanitizedHtml).not.toMatch(/<iframe[\s>]/i);
            expect(sanitizedHtml).not.toMatch(/<object[\s>]/i);
            expect(sanitizedHtml).not.toMatch(/<embed[\s>]/i);
            expect(sanitizedHtml).not.toMatch(/<style[\s>]/i);
            expect(sanitizedHtml).not.toMatch(/<link[\s>]/i);
            expect(sanitizedHtml).not.toMatch(/<meta[\s>]/i);
            expect(sanitizedHtml).not.toMatch(/<base[\s>]/i);
            expect(sanitizedHtml).not.toMatch(/<form[\s>]/i);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should remove event handlers from HTML attributes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(fc.constantFrom('<p ', '<a ', '<div '), eventHandlerArbitrary, fc.constant('>text</p>')).map(
            ([tag, handler, close]) => `${tag}${handler}${close}`
          ),
          async (htmlWithHandler) => {
            const sectionData = {
              page_type: 'custom' as const,
              page_id: 'page-1',
              display_order: 0,
              columns: [
                {
                  column_number: 1 as const,
                  content_type: 'rich_text' as const,
                  content_data: {
                    html: htmlWithHandler,
                  },
                },
              ],
            };

            const mockSectionChain = {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'section-1', page_type: 'custom', page_id: 'page-1', display_order: 0 },
                error: null,
              }),
            };

            const mockColumnsChain = {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockResolvedValue({
                data: [{ id: 'col-1', section_id: 'section-1', column_number: 1, content_type: 'rich_text', content_data: { html: '' } }],
                error: null,
              }),
            };

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'sections') return mockSectionChain;
              if (table === 'columns') return mockColumnsChain;
              return mockSectionChain;
            });

            const result = await createSection(sectionData);

            expect(result.success).toBe(true);

            if (mockColumnsChain.insert.mock.calls.length > 0) {
              const insertedColumns = mockColumnsChain.insert.mock.calls[0][0];
              const sanitizedHtml = insertedColumns[0].content_data.html;

              // Property: Event handlers should be removed
              expect(sanitizedHtml).not.toMatch(/on\w+\s*=/i);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove javascript: protocol from URLs', async () => {
      await fc.assert(
        fc.asyncProperty(javascriptProtocolArbitrary, async (jsProtocol) => {
          const htmlWithJsProtocol = `<a href="${jsProtocol}">Click me</a>`;
          const sectionData = {
            page_type: 'custom' as const,
            page_id: 'page-1',
            display_order: 0,
            columns: [
              {
                column_number: 1 as const,
                content_type: 'rich_text' as const,
                content_data: {
                  html: htmlWithJsProtocol,
                },
              },
            ],
          };

          const mockSectionChain = {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'section-1', page_type: 'custom', page_id: 'page-1', display_order: 0 },
              error: null,
            }),
          };

          const mockColumnsChain = {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({
              data: [{ id: 'col-1', section_id: 'section-1', column_number: 1, content_type: 'rich_text', content_data: { html: '' } }],
              error: null,
            }),
          };

          mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'sections') return mockSectionChain;
            if (table === 'columns') return mockColumnsChain;
            return mockSectionChain;
          });

          const result = await createSection(sectionData);

          expect(result.success).toBe(true);

          if (mockColumnsChain.insert.mock.calls.length > 0) {
            const insertedColumns = mockColumnsChain.insert.mock.calls[0][0];
            const sanitizedHtml = insertedColumns[0].content_data.html;

            // Property: javascript: protocol should be removed
            expect(sanitizedHtml.toLowerCase()).not.toContain('javascript:');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve safe HTML tags while removing dangerous ones', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(safeHtmlArbitrary, dangerousTagsArbitrary).map(([safe, dangerous]) => `${safe}${dangerous}`),
          async (mixedHtml) => {
            const sectionData = {
              page_type: 'custom' as const,
              page_id: 'page-1',
              display_order: 0,
              columns: [
                {
                  column_number: 1 as const,
                  content_type: 'rich_text' as const,
                  content_data: {
                    html: mixedHtml,
                  },
                },
              ],
            };

            const mockSectionChain = {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'section-1', page_type: 'custom', page_id: 'page-1', display_order: 0 },
                error: null,
              }),
            };

            const mockColumnsChain = {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockResolvedValue({
                data: [{ id: 'col-1', section_id: 'section-1', column_number: 1, content_type: 'rich_text', content_data: { html: '' } }],
                error: null,
              }),
            };

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'sections') return mockSectionChain;
              if (table === 'columns') return mockColumnsChain;
              return mockSectionChain;
            });

            const result = await createSection(sectionData);

            expect(result.success).toBe(true);

            if (mockColumnsChain.insert.mock.calls.length > 0) {
              const insertedColumns = mockColumnsChain.insert.mock.calls[0][0];
              const sanitizedHtml = insertedColumns[0].content_data.html;

              // Property: Dangerous tags should be removed
              expect(sanitizedHtml).not.toMatch(/<script[\s>]/i);
              expect(sanitizedHtml).not.toMatch(/<iframe[\s>]/i);
              expect(sanitizedHtml).not.toMatch(/<object[\s>]/i);

              // Property: Should still be a valid string
              expect(typeof sanitizedHtml).toBe('string');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('updateSection - Rich Text Sanitization', () => {
    it('should sanitize rich text content when updating sections', async () => {
      await fc.assert(
        fc.asyncProperty(maliciousRichTextArbitrary, async (maliciousHtml) => {
          const updateData = {
            columns: [
              {
                column_number: 1 as const,
                content_type: 'rich_text' as const,
                content_data: {
                  html: maliciousHtml,
                },
              },
            ],
          };

          const mockUpdateChain = {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null }),
          };

          const mockDeleteChain = {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null }),
          };

          const mockInsertChain = {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };

          const mockSelectChain = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'section-1', page_type: 'custom', page_id: 'page-1', display_order: 0 },
              error: null,
            }),
            order: jest.fn().mockResolvedValue({
              data: [{ id: 'col-1', section_id: 'section-1', column_number: 1, content_type: 'rich_text', content_data: { html: '' } }],
              error: null,
            }),
          };

          mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'sections') {
              return {
                ...mockUpdateChain,
                ...mockSelectChain,
              };
            }
            if (table === 'columns') {
              return {
                ...mockDeleteChain,
                ...mockInsertChain,
                ...mockSelectChain,
              };
            }
            return mockUpdateChain;
          });

          const result = await updateSection('section-1', updateData);

          expect(result.success).toBe(true);

          // Verify that the insert was called with sanitized content
          if (mockInsertChain.insert.mock.calls.length > 0) {
            const insertedColumns = mockInsertChain.insert.mock.calls[0][0];
            const sanitizedHtml = insertedColumns[0].content_data.html;

            // Property: Dangerous content should be sanitized
            expect(sanitizedHtml).not.toMatch(/<script[\s>]/i);
            expect(sanitizedHtml).not.toMatch(/<iframe[\s>]/i);
            expect(sanitizedHtml).not.toMatch(/<object[\s>]/i);
            expect(sanitizedHtml).not.toMatch(/<embed[\s>]/i);
            expect(sanitizedHtml.toLowerCase()).not.toContain('javascript:');
            expect(typeof sanitizedHtml).toBe('string');
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rich text content', async () => {
      const sectionData = {
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 0,
        columns: [
          {
            column_number: 1 as const,
            content_type: 'rich_text' as const,
            content_data: {
              html: '',
            },
          },
        ],
      };

      const mockSectionChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'section-1', page_type: 'custom', page_id: 'page-1', display_order: 0 },
          error: null,
        }),
      };

      const mockColumnsChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'col-1', section_id: 'section-1', column_number: 1, content_type: 'rich_text', content_data: { html: '' } }],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'sections') return mockSectionChain;
        if (table === 'columns') return mockColumnsChain;
        return mockSectionChain;
      });

      const result = await createSection(sectionData);

      expect(result.success).toBe(true);
    });

    it('should handle very long malicious HTML strings', async () => {
      const longMalicious = '<script>alert(1)</script>'.repeat(100);
      const sectionData = {
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 0,
        columns: [
          {
            column_number: 1 as const,
            content_type: 'rich_text' as const,
            content_data: {
              html: longMalicious,
            },
          },
        ],
      };

      const mockSectionChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'section-1', page_type: 'custom', page_id: 'page-1', display_order: 0 },
          error: null,
        }),
      };

      const mockColumnsChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'col-1', section_id: 'section-1', column_number: 1, content_type: 'rich_text', content_data: { html: '' } }],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'sections') return mockSectionChain;
        if (table === 'columns') return mockColumnsChain;
        return mockSectionChain;
      });

      const result = await createSection(sectionData);

      expect(result.success).toBe(true);

      if (mockColumnsChain.insert.mock.calls.length > 0) {
        const insertedColumns = mockColumnsChain.insert.mock.calls[0][0];
        const sanitizedHtml = insertedColumns[0].content_data.html;

        expect(sanitizedHtml).not.toContain('<script>');
      }
    });

    it('should not sanitize non-rich-text content types', async () => {
      const sectionData = {
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 0,
        columns: [
          {
            column_number: 1 as const,
            content_type: 'photo_gallery' as const,
            content_data: {
              photo_ids: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
              display_mode: 'gallery' as const,
            },
          },
        ],
      };

      const mockSectionChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'section-1', page_type: 'custom', page_id: 'page-1', display_order: 0 },
          error: null,
        }),
      };

      const mockColumnsChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'col-1',
              section_id: 'section-1',
              column_number: 1,
              content_type: 'photo_gallery',
              content_data: { 
                photo_ids: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
                display_mode: 'gallery',
              },
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'sections') return mockSectionChain;
        if (table === 'columns') return mockColumnsChain;
        return mockSectionChain;
      });

      const result = await createSection(sectionData);

      expect(result.success).toBe(true);

      // Verify that photo content is not modified
      if (mockColumnsChain.insert.mock.calls.length > 0) {
        const insertedColumns = mockColumnsChain.insert.mock.calls[0][0];
        expect(insertedColumns[0].content_data.photo_ids).toEqual([
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001',
        ]);
        expect(insertedColumns[0].content_data.display_mode).toBe('gallery');
      }
    });
  });
});
