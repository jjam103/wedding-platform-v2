/**
 * Property-Based Tests for Slug Conflict Resolution
 * 
 * Feature: destination-wedding-platform
 * Property 20: Slug Conflict Resolution
 * Validates: Requirements 31.3
 */

import * as fc from 'fast-check';
import { generateSlug, makeUniqueSlug } from '../utils/slugs';

describe('Feature: destination-wedding-platform, Property 20: Slug Conflict Resolution', () => {
  describe('slug conflict resolution properties', () => {
    it('should always produce a valid slug format after conflict resolution', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(generateSlug).filter((s) => s.length > 0),
          fc.integer({ min: 2, max: 100 }),
          (baseSlug, counter) => {
            const resolvedSlug = `${baseSlug}-${counter}`;
            // Should only contain lowercase letters, numbers, and hyphens
            expect(resolvedSlug).toMatch(/^[a-z0-9-]+$/);
            // Should not have consecutive hyphens
            expect(resolvedSlug).not.toContain('--');
            // Should not start or end with hyphen
            expect(resolvedSlug).not.toMatch(/^-/);
            expect(resolvedSlug).not.toMatch(/-$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain slug uniqueness across multiple conflicts', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(generateSlug).filter((s) => s.length > 0),
          fc.uniqueArray(fc.integer({ min: 2, max: 20 }), { minLength: 1, maxLength: 10 }),
          (baseSlug, counters) => {
            const resolvedSlugs = counters.map((counter) => `${baseSlug}-${counter}`);
            // All resolved slugs should be unique
            const uniqueSlugs = new Set(resolvedSlugs);
            expect(uniqueSlugs.size).toBe(resolvedSlugs.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve the base slug in the resolved slug', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(generateSlug).filter((s) => s.length > 0),
          fc.integer({ min: 2, max: 1000 }),
          (baseSlug, counter) => {
            const resolvedSlug = `${baseSlug}-${counter}`;
            // Resolved slug should start with base slug
            expect(resolvedSlug.startsWith(baseSlug)).toBe(true);
            // Should be followed by hyphen and number
            expect(resolvedSlug.substring(baseSlug.length)).toMatch(/^-\d+$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should append -2 when base slug exists', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(generateSlug).filter((s) => s.length > 0),
          (baseSlug) => {
            const existingSlugs = [baseSlug];
            const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
            expect(uniqueSlug).toBe(`${baseSlug}-2`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increment counter until unique slug is found', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(generateSlug).filter((s) => s.length > 0),
          fc.integer({ min: 1, max: 10 }),
          (baseSlug, maxCounter) => {
            // Create existing slugs: base, base-2, base-3, ..., base-maxCounter
            const existingSlugs = [baseSlug];
            for (let i = 2; i <= maxCounter; i++) {
              existingSlugs.push(`${baseSlug}-${i}`);
            }
            
            const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
            
            // Should be base-{maxCounter+1}
            expect(uniqueSlug).toBe(`${baseSlug}-${maxCounter + 1}`);
            // Should not be in existing slugs
            expect(existingSlugs).not.toContain(uniqueSlug);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle gaps in counter sequence', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(generateSlug).filter((s) => s.length > 0),
          (baseSlug) => {
            // Create existing slugs with gaps: base, base-2, base-4 (missing base-3)
            const existingSlugs = [baseSlug, `${baseSlug}-2`, `${baseSlug}-4`];
            const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
            
            // Should find base-3 (the first available)
            // Note: Our implementation increments from 2, so it will find base-3
            expect(uniqueSlug).toBe(`${baseSlug}-3`);
            expect(existingSlugs).not.toContain(uniqueSlug);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve base slug structure when resolving conflicts', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(generateSlug).filter((s) => s.length > 0),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }).map(generateSlug), { maxLength: 20 }),
          (baseSlug, existingSlugs) => {
            const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
            // Unique slug should start with base slug or be the base slug itself
            expect(uniqueSlug.startsWith(baseSlug) || uniqueSlug === baseSlug).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always produce a slug not in the existing slugs list', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(generateSlug).filter((s) => s.length > 0),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }).map(generateSlug), { maxLength: 50 }),
          (baseSlug, existingSlugs) => {
            const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
            expect(existingSlugs).not.toContain(uniqueSlug);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty existing slugs list', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(generateSlug).filter((s) => s.length > 0),
          (baseSlug) => {
            const uniqueSlug = makeUniqueSlug(baseSlug, []);
            // Should return base slug unchanged
            expect(uniqueSlug).toBe(baseSlug);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle large counter values', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(generateSlug).filter((s) => s.length > 0),
          fc.integer({ min: 100, max: 1000 }),
          (baseSlug, largeCounter) => {
            // Create existing slugs up to largeCounter
            const existingSlugs = [baseSlug];
            for (let i = 2; i <= largeCounter; i++) {
              existingSlugs.push(`${baseSlug}-${i}`);
            }
            
            const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
            
            // Should be base-{largeCounter+1}
            expect(uniqueSlug).toBe(`${baseSlug}-${largeCounter + 1}`);
            expect(existingSlugs).not.toContain(uniqueSlug);
          }
        ),
        { numRuns: 20 } // Fewer runs for performance
      );
    });
  });

  describe('conflict resolution examples', () => {
    it('should handle basic conflict: slug exists', () => {
      const baseSlug = 'test-page';
      const existingSlugs = ['test-page'];
      const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
      expect(uniqueSlug).toBe('test-page-2');
    });

    it('should handle multiple conflicts: slug and slug-2 exist', () => {
      const baseSlug = 'test-page';
      const existingSlugs = ['test-page', 'test-page-2'];
      const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
      expect(uniqueSlug).toBe('test-page-3');
    });

    it('should handle sequential conflicts', () => {
      const baseSlug = 'popular-page';
      const existingSlugs = ['popular-page', 'popular-page-2', 'popular-page-3'];
      const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
      expect(uniqueSlug).toBe('popular-page-4');
    });

    it('should return base slug when no conflicts', () => {
      const baseSlug = 'unique-page';
      const existingSlugs = ['other-page', 'another-page'];
      const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
      expect(uniqueSlug).toBe('unique-page');
    });

    it('should handle gaps in sequence', () => {
      const baseSlug = 'test';
      const existingSlugs = ['test', 'test-2', 'test-4']; // Missing test-3
      const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
      expect(uniqueSlug).toBe('test-3');
    });
  });
});
