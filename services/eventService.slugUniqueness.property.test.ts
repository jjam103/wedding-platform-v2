/**
 * Property-Based Tests for Event Service Slug Uniqueness
 * 
 * **Property 24: Slug Uniqueness**
 * **Validates: Requirements 24.3, 24.4, 24.5**
 * 
 * Tests that slugs are unique across all events and conflicts are resolved with numeric suffixes.
 */

import * as fc from 'fast-check';
import { create, deleteEvent } from './eventService';

describe('Feature: guest-portal-and-admin-enhancements, Property 24: Slug Uniqueness', () => {
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
   * Property: Creating multiple events with the same name generates unique slugs
   * 
   * When multiple events have the same name, the system should append numeric
   * suffixes (-2, -3, etc.) to ensure uniqueness.
   */
  it('should generate unique slugs for events with duplicate names', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 30 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.integer({ min: 2, max: 5 }),
        fc.date(),
        async (baseName, count, startDate) => {
          const slugs = new Set<string>();

          // Create multiple events with the same name
          for (let i = 0; i < count; i++) {
            const result = await create({
              name: baseName,
              eventType: 'ceremony',
              startDate: new Date(startDate.getTime() + i * 3600000).toISOString(), // Offset by hours
            });

            if (!result.success) {
              // If creation failed, skip this iteration
              continue;
            }

            createdEventIds.push(result.data.id);
            const slug = result.data.slug;

            // Each slug must be unique
            expect(slugs.has(slug)).toBe(false);
            slugs.add(slug);

            // First event should have base slug, subsequent should have -2, -3, etc.
            if (i === 0) {
              expect(slug).not.toMatch(/-\d+$/);
            } else {
              expect(slug).toMatch(/-\d+$/);
            }
          }

          // Verify we got the expected number of unique slugs
          expect(slugs.size).toBe(count);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Slug uniqueness is maintained across different event types
   */
  it('should ensure slug uniqueness across all event types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 30 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.date(),
        async (name, startDate) => {
          const eventTypes = ['ceremony', 'reception', 'meal', 'transport', 'activity'] as const;
          const slugs = new Set<string>();

          // Create events with same name but different types
          for (const eventType of eventTypes) {
            const result = await create({
              name,
              eventType,
              startDate: startDate.toISOString(),
            });

            if (!result.success) {
              continue;
            }

            createdEventIds.push(result.data.id);
            const slug = result.data.slug;

            // Each slug must be unique even across different event types
            expect(slugs.has(slug)).toBe(false);
            slugs.add(slug);
          }

          return true;
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Numeric suffix increments correctly for multiple duplicates
   */
  it('should increment numeric suffixes correctly for multiple duplicates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.date(),
        async (name, startDate) => {
          const events: Array<{ id: string; slug: string }> = [];

          // Create 5 events with the same name
          for (let i = 0; i < 5; i++) {
            const result = await create({
              name,
              eventType: 'ceremony',
              startDate: new Date(startDate.getTime() + i * 3600000).toISOString(),
            });

            if (!result.success) {
              continue;
            }

            createdEventIds.push(result.data.id);
            events.push({ id: result.data.id, slug: result.data.slug });
          }

          if (events.length < 2) {
            return true; // Skip if we couldn't create enough events
          }

          // Verify slug pattern
          const baseSlug = events[0].slug;
          expect(baseSlug).not.toMatch(/-\d+$/);

          for (let i = 1; i < events.length; i++) {
            const expectedSuffix = i + 1;
            expect(events[i].slug).toBe(`${baseSlug}-${expectedSuffix}`);
          }

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Slug uniqueness handles edge cases with similar names
   */
  it('should maintain uniqueness for names that differ only in special characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.constantFrom('!', '@', '#', '-', '_', ' '),
        fc.date(),
        async (baseName, separator, startDate) => {
          const names = [
            baseName,
            `${baseName}${separator}${baseName}`,
            `${baseName}${separator}${separator}${baseName}`,
          ];

          const slugs = new Set<string>();

          for (const name of names) {
            const result = await create({
              name,
              eventType: 'reception',
              startDate: startDate.toISOString(),
            });

            if (!result.success) {
              continue;
            }

            createdEventIds.push(result.data.id);
            const slug = result.data.slug;

            // Each slug must be unique
            expect(slugs.has(slug)).toBe(false);
            slugs.add(slug);
          }

          return true;
        }
      ),
      { numRuns: 15 }
    );
  });
});
