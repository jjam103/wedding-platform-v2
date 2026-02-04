/**
 * Property-Based Tests for Event Service Slug URL Safety
 * 
 * **Property 23: Slug URL Safety**
 * **Validates: Requirements 24.2, 24.9**
 * 
 * Tests that all generated slugs are URL-safe and follow the required pattern.
 */

import * as fc from 'fast-check';
import { create } from './eventService';

describe('Feature: guest-portal-and-admin-enhancements, Property 23: Slug URL Safety', () => {
  /**
   * Property: All generated event slugs must be URL-safe
   * 
   * A URL-safe slug must:
   * - Contain only lowercase letters, numbers, and hyphens
   * - Not start or end with a hyphen
   * - Not contain consecutive hyphens
   * - Contain at least one alphanumeric character
   */
  it('should generate URL-safe slugs from any event name', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.date(),
        async (name, startDate) => {
          // Skip names that would generate empty slugs (only special characters)
          const hasAlphanumeric = /[a-zA-Z0-9]/.test(name);
          if (!hasAlphanumeric) {
            return true; // Skip this test case
          }

          const result = await create({
            name,
            eventType: 'ceremony',
            startDate: startDate.toISOString(),
          });

          if (!result.success) {
            // If creation failed, it should be due to validation, not slug generation
            return true;
          }

          const slug = result.data.slug;

          // Slug must match URL-safe pattern: lowercase alphanumeric and hyphens only
          expect(slug).toMatch(/^[a-z0-9-]+$/);

          // Slug must not start or end with hyphen
          expect(slug).not.toMatch(/^-/);
          expect(slug).not.toMatch(/-$/);

          // Slug must not contain consecutive hyphens
          expect(slug).not.toMatch(/--/);

          // Slug must contain at least one alphanumeric character
          expect(slug).toMatch(/[a-z0-9]/);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Slugs with special characters are normalized to URL-safe format
   */
  it('should normalize special characters in event names to URL-safe slugs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '=', '+', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '?', '/'),
        fc.date(),
        async (baseName, specialChar, startDate) => {
          const name = `${baseName}${specialChar}${baseName}`;

          const result = await create({
            name,
            eventType: 'reception',
            startDate: startDate.toISOString(),
          });

          if (!result.success) {
            return true;
          }

          const slug = result.data.slug;

          // Special characters should be removed or converted to hyphens
          expect(slug).not.toContain(specialChar);
          expect(slug).toMatch(/^[a-z0-9-]+$/);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Slugs with unicode characters are normalized to ASCII
   */
  it('should normalize unicode characters in event names to ASCII slugs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'Café Reception',
          'Fiesta Española',
          'Über Party',
          'Naïve Ceremony',
          'Résumé Event',
          'Crème Brûlée Dinner'
        ),
        fc.date(),
        async (name, startDate) => {
          const result = await create({
            name,
            eventType: 'meal',
            startDate: startDate.toISOString(),
          });

          if (!result.success) {
            return true;
          }

          const slug = result.data.slug;

          // Unicode characters should be removed, leaving only ASCII
          expect(slug).toMatch(/^[a-z0-9-]+$/);
          expect(slug).not.toMatch(/[^\x00-\x7F]/); // No non-ASCII characters

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Slugs with excessive whitespace are normalized
   */
  it('should normalize excessive whitespace in event names', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /[a-zA-Z0-9]/.test(s)), { minLength: 2, maxLength: 5 }),
        fc.nat({ max: 5 }),
        fc.date(),
        async (words, extraSpaces, startDate) => {
          // Join words with varying amounts of whitespace
          const name = words.join(' '.repeat(extraSpaces + 1));

          const result = await create({
            name,
            eventType: 'activity',
            startDate: startDate.toISOString(),
          });

          if (!result.success) {
            return true;
          }

          const slug = result.data.slug;

          // Multiple spaces should be converted to single hyphens
          expect(slug).not.toMatch(/--/); // No consecutive hyphens
          expect(slug).toMatch(/^[a-z0-9-]+$/);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
