/**
 * Property-Based Tests for Event Service Slug Preservation
 * 
 * **Property 25: Slug Preservation on Update**
 * **Validates: Requirements 24.7**
 * 
 * Tests that slugs are preserved when updating event names and not regenerated automatically.
 */

import * as fc from 'fast-check';
import { create, update, deleteEvent } from './eventService';

describe('Feature: guest-portal-and-admin-enhancements, Property 25: Slug Preservation on Update', () => {
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
   * Property: Updating event name does not change the slug
   * 
   * When an event's name is updated, the slug should remain unchanged
   * to preserve existing URLs and references.
   */
  it('should preserve slug when updating event name', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 30 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.string({ minLength: 3, maxLength: 30 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.date(),
        async (originalName, newName, startDate) => {
          // Skip if names are the same
          if (originalName === newName) {
            return true;
          }

          // Create event with original name
          const createResult = await create({
            name: originalName,
            eventType: 'ceremony',
            startDate: startDate.toISOString(),
          });

          if (!createResult.success) {
            return true;
          }

          createdEventIds.push(createResult.data.id);
          const originalSlug = createResult.data.slug;

          // Update event name
          const updateResult = await update(createResult.data.id, {
            name: newName,
          });

          if (!updateResult.success) {
            return true;
          }

          // Slug should remain unchanged
          expect(updateResult.data.slug).toBe(originalSlug);
          expect(updateResult.data.name).toBe(newName);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Multiple updates preserve the original slug
   */
  it('should preserve slug across multiple name updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.array(fc.string({ minLength: 3, maxLength: 20 }).filter(s => /[a-zA-Z0-9]/.test(s)), { minLength: 2, maxLength: 5 }),
        fc.date(),
        async (originalName, newNames, startDate) => {
          // Create event
          const createResult = await create({
            name: originalName,
            eventType: 'reception',
            startDate: startDate.toISOString(),
          });

          if (!createResult.success) {
            return true;
          }

          createdEventIds.push(createResult.data.id);
          const originalSlug = createResult.data.slug;

          // Update name multiple times
          for (const newName of newNames) {
            const updateResult = await update(createResult.data.id, {
              name: newName,
            });

            if (!updateResult.success) {
              continue;
            }

            // Slug should always remain the original
            expect(updateResult.data.slug).toBe(originalSlug);
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Updating other fields does not affect slug
   */
  it('should preserve slug when updating non-name fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 30 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.date(),
        fc.date(),
        async (name, description, startDate, newStartDate) => {
          // Create event
          const createResult = await create({
            name,
            eventType: 'meal',
            startDate: startDate.toISOString(),
            description,
          });

          if (!createResult.success) {
            return true;
          }

          createdEventIds.push(createResult.data.id);
          const originalSlug = createResult.data.slug;

          // Update description and start date
          const updateResult = await update(createResult.data.id, {
            description: `${description} - Updated`,
            startDate: newStartDate.toISOString(),
          });

          if (!updateResult.success) {
            return true;
          }

          // Slug should remain unchanged
          expect(updateResult.data.slug).toBe(originalSlug);

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Slug preservation works with special characters in new names
   */
  it('should preserve slug even when new name contains special characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.constantFrom('!', '@', '#', '$', '%', '&', '*'),
        fc.date(),
        async (originalName, baseName, specialChar, startDate) => {
          // Create event
          const createResult = await create({
            name: originalName,
            eventType: 'activity',
            startDate: startDate.toISOString(),
          });

          if (!createResult.success) {
            return true;
          }

          createdEventIds.push(createResult.data.id);
          const originalSlug = createResult.data.slug;

          // Update with name containing special characters
          const newName = `${baseName}${specialChar}${baseName}`;
          const updateResult = await update(createResult.data.id, {
            name: newName,
          });

          if (!updateResult.success) {
            return true;
          }

          // Slug should remain unchanged despite special characters in new name
          expect(updateResult.data.slug).toBe(originalSlug);
          expect(updateResult.data.name).toBe(newName);

          return true;
        }
      ),
      { numRuns: 25 }
    );
  });

  /**
   * Property: Slug preservation is idempotent
   */
  it('should maintain slug consistency across repeated updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        fc.date(),
        async (originalName, newName, startDate) => {
          // Create event
          const createResult = await create({
            name: originalName,
            eventType: 'transport',
            startDate: startDate.toISOString(),
          });

          if (!createResult.success) {
            return true;
          }

          createdEventIds.push(createResult.data.id);
          const originalSlug = createResult.data.slug;

          // Update name back and forth multiple times
          for (let i = 0; i < 3; i++) {
            // Update to new name
            const update1 = await update(createResult.data.id, { name: newName });
            if (update1.success) {
              expect(update1.data.slug).toBe(originalSlug);
            }

            // Update back to original name
            const update2 = await update(createResult.data.id, { name: originalName });
            if (update2.success) {
              expect(update2.data.slug).toBe(originalSlug);
            }
          }

          return true;
        }
      ),
      { numRuns: 15 }
    );
  });
});
