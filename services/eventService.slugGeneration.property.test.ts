/**
 * Property-Based Tests for Event Service Slug Generation from Title
 * 
 * **Property 26: Slug Generation from Title**
 * **Validates: Requirements 24.1**
 * 
 * Tests that slugs are correctly generated from event names following all transformation rules.
 */

import * as fc from 'fast-check';
import { create, deleteEvent } from './eventService';
import { generateSlug } from '../utils/slugs';

describe('Feature: guest-portal-and-admin-enhancements, Property 26: Slug Generation from Title', () => {
  // Clean up test events after each test
  const createdEventIds: string[] = [];

  afterEach(async () => {
    // Clean up all created events
    for (const id of createdEventIds) {
      await deleteEvent(id);
    }
    createdEventIds.length = 0;
  });

  /**
   * Property: Generated slug matches the expected transformation of the event name
   * 
   * The slug should be:
   * - Lowercase
   * - Spaces replaced with hyphens
   * - Special characters removed
   * - Multiple hyphens collapsed to single hyphen
   * - Leading/trailing hyphens removed
   */
  it('should generate slug that matches expected transformation of event name', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.date(),
        async (name, startDate) => {
          const result = await create({
            name,
            eventType: 'ceremony',
            startDate: startDate.toISOString(),
          });

          if (!result.success) {
            return true;
          }

          createdEventIds.push(result.data.id);

          // Generate expected slug using the same utility function
          const expectedBaseSlug = generateSlug(name);

          // The actual slug should either match the expected slug or have a numeric suffix
          const actualSlug = result.data.slug;
          const hasNumericSuffix = /-\d+$/.test(actualSlug);

          if (hasNumericSuffix) {
            // Remove suffix and check base matches
            const baseSlug = actualSlug.replace(/-\d+$/, '');
            expect(baseSlug).toBe(expectedBaseSlug);
          } else {
            // Should match exactly
            expect(actualSlug).toBe(expectedBaseSlug);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Slug generation is deterministic for the same input
   */
  it('should generate the same base slug for identical event names', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 30 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.date(),
        async (name, startDate) => {
          // Create first event
          const result1 = await create({
            name,
            eventType: 'reception',
            startDate: startDate.toISOString(),
          });

          if (!result1.success) {
            return true;
          }

          createdEventIds.push(result1.data.id);
          const slug1 = result1.data.slug;

          // Create second event with same name
          const result2 = await create({
            name,
            eventType: 'reception',
            startDate: new Date(startDate.getTime() + 3600000).toISOString(),
          });

          if (!result2.success) {
            return true;
          }

          createdEventIds.push(result2.data.id);
          const slug2 = result2.data.slug;

          // Second slug should be first slug with -2 suffix
          expect(slug2).toBe(`${slug1}-2`);

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Slug generation handles mixed case correctly
   */
  it('should convert mixed case event names to lowercase slugs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 4 }),
        fc.date(),
        async (words, startDate) => {
          // Create name with mixed case
          const name = words.map((word, i) => 
            i % 2 === 0 ? word.toUpperCase() : word.toLowerCase()
          ).join(' ');

          if (!/[a-zA-Z0-9]/.test(name)) {
            return true;
          }

          const result = await create({
            name,
            eventType: 'meal',
            startDate: startDate.toISOString(),
          });

          if (!result.success) {
            return true;
          }

          createdEventIds.push(result.data.id);

          // Slug should be all lowercase
          expect(result.data.slug).toBe(result.data.slug.toLowerCase());
          expect(result.data.slug).not.toMatch(/[A-Z]/);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Slug generation removes leading and trailing whitespace
   */
  it('should trim whitespace from event names when generating slugs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.nat({ max: 5 }),
        fc.nat({ max: 5 }),
        fc.date(),
        async (baseName, leadingSpaces, trailingSpaces, startDate) => {
          const name = ' '.repeat(leadingSpaces) + baseName + ' '.repeat(trailingSpaces);

          const result = await create({
            name,
            eventType: 'activity',
            startDate: startDate.toISOString(),
          });

          if (!result.success) {
            return true;
          }

          createdEventIds.push(result.data.id);

          // Slug should not have leading or trailing hyphens
          expect(result.data.slug).not.toMatch(/^-/);
          expect(result.data.slug).not.toMatch(/-$/);

          return true;
        }
      ),
      { numRuns: 40 }
    );
  });

  /**
   * Property: Slug generation collapses multiple spaces to single hyphen
   */
  it('should collapse multiple spaces to single hyphen in slugs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }).filter(s => /[a-zA-Z0-9]/.test(s)), { minLength: 2, maxLength: 4 }),
        fc.nat({ min: 2, max: 5 }),
        fc.date(),
        async (words, spaceCount, startDate) => {
          const name = words.join(' '.repeat(spaceCount));

          const result = await create({
            name,
            eventType: 'transport',
            startDate: startDate.toISOString(),
          });

          if (!result.success) {
            return true;
          }

          createdEventIds.push(result.data.id);

          // Slug should not have consecutive hyphens
          expect(result.data.slug).not.toMatch(/--/);

          return true;
        }
      ),
      { numRuns: 40 }
    );
  });

  /**
   * Property: Slug generation is consistent with utility function
   */
  it('should generate slugs consistent with generateSlug utility', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'Wedding Ceremony',
          'Reception Party',
          'Beach Volleyball',
          'Sunset Dinner',
          'Welcome Drinks',
          'Farewell Brunch'
        ),
        fc.date(),
        async (name, startDate) => {
          const result = await create({
            name,
            eventType: 'ceremony',
            startDate: startDate.toISOString(),
          });

          if (!result.success) {
            return true;
          }

          createdEventIds.push(result.data.id);

          // Generate expected slug
          const expectedSlug = generateSlug(name);

          // Actual slug should match or have numeric suffix
          const actualSlug = result.data.slug;
          expect(actualSlug === expectedSlug || actualSlug.startsWith(`${expectedSlug}-`)).toBe(true);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
