/**
 * Unit Tests for Event Service Slug Methods
 * 
 * Tests the slug-related functionality in eventService including:
 * - getBySlug method
 * - Slug generation on create
 * - Slug preservation on update
 * - Slug validation
 */

import { create, update, getBySlug, deleteEvent } from './eventService';

describe('eventService - Slug Methods', () => {
  // Clean up test events after each test
  const createdEventIds: string[] = [];

  afterEach(async () => {
    // Clean up all created events
    for (const id of createdEventIds) {
      await deleteEvent(id);
    }
    createdEventIds.length = 0;
  });

  describe('getBySlug', () => {
    it('should retrieve event by slug', async () => {
      // Create event
      const createResult = await create({
        name: 'Wedding Ceremony',
        eventType: 'ceremony',
        startDate: '2025-06-15T14:00:00Z',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      createdEventIds.push(createResult.data.id);
      const slug = createResult.data.slug;

      // Retrieve by slug
      const getResult = await getBySlug(slug);

      expect(getResult.success).toBe(true);
      if (!getResult.success) return;

      expect(getResult.data.id).toBe(createResult.data.id);
      expect(getResult.data.name).toBe('Wedding Ceremony');
      expect(getResult.data.slug).toBe(slug);
    });

    it('should return NOT_FOUND for non-existent slug', async () => {
      const result = await getBySlug('non-existent-event-slug');

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe('NOT_FOUND');
    });

    it('should return VALIDATION_ERROR for empty slug', async () => {
      const result = await getBySlug('');

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle slug lookup case-insensitively', async () => {
      // Create event
      const createResult = await create({
        name: 'Beach Party',
        eventType: 'reception',
        startDate: '2025-06-16T18:00:00Z',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      createdEventIds.push(createResult.data.id);
      const slug = createResult.data.slug;

      // Try with different case
      const getResult = await getBySlug(slug.toUpperCase());

      expect(getResult.success).toBe(true);
      if (!getResult.success) return;

      expect(getResult.data.id).toBe(createResult.data.id);
    });
  });

  describe('Slug Generation on Create', () => {
    it('should generate slug from event name', async () => {
      const result = await create({
        name: 'Welcome Dinner',
        eventType: 'meal',
        startDate: '2025-06-14T19:00:00Z',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      createdEventIds.push(result.data.id);

      expect(result.data.slug).toBe('welcome-dinner');
    });

    it('should generate URL-safe slug from name with special characters', async () => {
      const result = await create({
        name: 'Bride & Groom\'s Reception!',
        eventType: 'reception',
        startDate: '2025-06-15T20:00:00Z',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      createdEventIds.push(result.data.id);

      // Special characters should be removed
      expect(result.data.slug).toMatch(/^[a-z0-9-]+$/);
      expect(result.data.slug).not.toContain('&');
      expect(result.data.slug).not.toContain("'");
      expect(result.data.slug).not.toContain('!');
    });

    it('should generate unique slugs for duplicate names', async () => {
      // Create first event
      const result1 = await create({
        name: 'Ceremony',
        eventType: 'ceremony',
        startDate: '2025-06-15T14:00:00Z',
      });

      expect(result1.success).toBe(true);
      if (!result1.success) return;

      createdEventIds.push(result1.data.id);

      // Create second event with same name
      const result2 = await create({
        name: 'Ceremony',
        eventType: 'ceremony',
        startDate: '2025-06-15T15:00:00Z',
      });

      expect(result2.success).toBe(true);
      if (!result2.success) return;

      createdEventIds.push(result2.data.id);

      // Slugs should be different
      expect(result1.data.slug).toBe('ceremony');
      expect(result2.data.slug).toBe('ceremony-2');
    });

    it('should return VALIDATION_ERROR for name with no alphanumeric characters', async () => {
      const result = await create({
        name: '!!!',
        eventType: 'activity',
        startDate: '2025-06-15T10:00:00Z',
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('alphanumeric character');
    });

    it('should handle names with multiple spaces', async () => {
      const result = await create({
        name: 'Beach    Volleyball    Tournament',
        eventType: 'activity',
        startDate: '2025-06-16T10:00:00Z',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      createdEventIds.push(result.data.id);

      // Multiple spaces should be collapsed to single hyphens
      expect(result.data.slug).toBe('beach-volleyball-tournament');
      expect(result.data.slug).not.toContain('--');
    });

    it('should trim leading and trailing whitespace from name', async () => {
      const result = await create({
        name: '   Sunset Cruise   ',
        eventType: 'activity',
        startDate: '2025-06-17T18:00:00Z',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      createdEventIds.push(result.data.id);

      // Slug should not have leading or trailing hyphens
      expect(result.data.slug).toBe('sunset-cruise');
      expect(result.data.slug).not.toMatch(/^-/);
      expect(result.data.slug).not.toMatch(/-$/);
    });
  });

  describe('Slug Preservation on Update', () => {
    it('should preserve slug when updating event name', async () => {
      // Create event
      const createResult = await create({
        name: 'Original Name',
        eventType: 'ceremony',
        startDate: '2025-06-15T14:00:00Z',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      createdEventIds.push(createResult.data.id);
      const originalSlug = createResult.data.slug;

      // Update name
      const updateResult = await update(createResult.data.id, {
        name: 'New Name',
      });

      expect(updateResult.success).toBe(true);
      if (!updateResult.success) return;

      // Slug should remain unchanged
      expect(updateResult.data.slug).toBe(originalSlug);
      expect(updateResult.data.name).toBe('New Name');
    });

    it('should preserve slug when updating description', async () => {
      // Create event
      const createResult = await create({
        name: 'Test Event',
        eventType: 'reception',
        startDate: '2025-06-15T18:00:00Z',
        description: 'Original description',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      createdEventIds.push(createResult.data.id);
      const originalSlug = createResult.data.slug;

      // Update description
      const updateResult = await update(createResult.data.id, {
        description: 'Updated description',
      });

      expect(updateResult.success).toBe(true);
      if (!updateResult.success) return;

      // Slug should remain unchanged
      expect(updateResult.data.slug).toBe(originalSlug);
    });

    it('should preserve slug across multiple updates', async () => {
      // Create event
      const createResult = await create({
        name: 'Initial Name',
        eventType: 'meal',
        startDate: '2025-06-15T19:00:00Z',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      createdEventIds.push(createResult.data.id);
      const originalSlug = createResult.data.slug;

      // Update name multiple times
      const names = ['First Update', 'Second Update', 'Third Update'];
      for (const name of names) {
        const updateResult = await update(createResult.data.id, { name });

        expect(updateResult.success).toBe(true);
        if (!updateResult.success) continue;

        expect(updateResult.data.slug).toBe(originalSlug);
      }
    });
  });

  describe('Slug Validation', () => {
    it('should accept valid slug patterns', async () => {
      const validNames = [
        'simple-event',
        'event-with-numbers-123',
        'a',
        'event-2',
      ];

      for (const name of validNames) {
        const result = await create({
          name,
          eventType: 'activity',
          startDate: '2025-06-15T10:00:00Z',
        });

        expect(result.success).toBe(true);
        if (!result.success) continue;

        createdEventIds.push(result.data.id);
        expect(result.data.slug).toMatch(/^[a-z0-9-]+$/);
      }
    });

    it('should handle unicode characters in names', async () => {
      const result = await create({
        name: 'Café Reception',
        eventType: 'reception',
        startDate: '2025-06-15T18:00:00Z',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      createdEventIds.push(result.data.id);

      // Unicode should be removed, leaving only ASCII
      expect(result.data.slug).toMatch(/^[a-z0-9-]+$/);
      expect(result.data.slug).not.toMatch(/[^\x00-\x7F]/);
    });
  });
});
