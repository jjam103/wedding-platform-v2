/**
 * Unit Tests for Activity Service Slug Methods
 * 
 * Tests the slug-related functionality in activityService including:
 * - getBySlug method
 * - Slug generation on create
 * - Slug preservation on update
 * - Slug validation
 */

import { create, update, getBySlug, deleteActivity } from './activityService';

describe('activityService - Slug Methods', () => {
  // Clean up test activities after each test
  const createdActivityIds: string[] = [];

  afterEach(async () => {
    // Clean up all created activities
    for (const id of createdActivityIds) {
      await deleteActivity(id);
    }
    createdActivityIds.length = 0;
  });

  describe('getBySlug', () => {
    it('should retrieve activity by slug', async () => {
      // Create activity
      const createResult = await create({
        name: 'Beach Volleyball',
        activityType: 'activity',
        startTime: '2025-06-15T10:00:00Z',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      createdActivityIds.push(createResult.data.id);
      const slug = createResult.data.slug;

      // Retrieve by slug
      const getResult = await getBySlug(slug);

      expect(getResult.success).toBe(true);
      if (!getResult.success) return;

      expect(getResult.data.id).toBe(createResult.data.id);
      expect(getResult.data.name).toBe('Beach Volleyball');
      expect(getResult.data.slug).toBe(slug);
    });

    it('should return NOT_FOUND for non-existent slug', async () => {
      const result = await getBySlug('non-existent-activity-slug');

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
  });

  describe('Slug Generation on Create', () => {
    it('should generate slug from activity name', async () => {
      const result = await create({
        name: 'Sunset Cruise',
        activityType: 'activity',
        startTime: '2025-06-15T18:00:00Z',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      createdActivityIds.push(result.data.id);

      expect(result.data.slug).toBe('sunset-cruise');
    });

    it('should generate URL-safe slug from name with special characters', async () => {
      const result = await create({
        name: 'Yoga & Meditation Session!',
        activityType: 'activity',
        startTime: '2025-06-15T07:00:00Z',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      createdActivityIds.push(result.data.id);

      // Special characters should be removed
      expect(result.data.slug).toMatch(/^[a-z0-9-]+$/);
      expect(result.data.slug).not.toContain('&');
      expect(result.data.slug).not.toContain('!');
    });

    it('should generate unique slugs for duplicate names', async () => {
      // Create first activity
      const result1 = await create({
        name: 'Snorkeling',
        activityType: 'activity',
        startTime: '2025-06-15T09:00:00Z',
      });

      expect(result1.success).toBe(true);
      if (!result1.success) return;

      createdActivityIds.push(result1.data.id);

      // Create second activity with same name
      const result2 = await create({
        name: 'Snorkeling',
        activityType: 'activity',
        startTime: '2025-06-15T14:00:00Z',
      });

      expect(result2.success).toBe(true);
      if (!result2.success) return;

      createdActivityIds.push(result2.data.id);

      // Slugs should be different
      expect(result1.data.slug).toBe('snorkeling');
      expect(result2.data.slug).toBe('snorkeling-2');
    });

    it('should return VALIDATION_ERROR for name with no alphanumeric characters', async () => {
      const result = await create({
        name: '---',
        activityType: 'activity',
        startTime: '2025-06-15T10:00:00Z',
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('alphanumeric character');
    });

    it('should handle names with multiple spaces', async () => {
      const result = await create({
        name: 'Zip    Line    Adventure',
        activityType: 'activity',
        startTime: '2025-06-16T11:00:00Z',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      createdActivityIds.push(result.data.id);

      // Multiple spaces should be collapsed to single hyphens
      expect(result.data.slug).toBe('zip-line-adventure');
      expect(result.data.slug).not.toContain('--');
    });
  });

  describe('Slug Preservation on Update', () => {
    it('should preserve slug when updating activity name', async () => {
      // Create activity
      const createResult = await create({
        name: 'Original Activity',
        activityType: 'activity',
        startTime: '2025-06-15T10:00:00Z',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      createdActivityIds.push(createResult.data.id);
      const originalSlug = createResult.data.slug;

      // Update name
      const updateResult = await update(createResult.data.id, {
        name: 'Updated Activity',
      });

      expect(updateResult.success).toBe(true);
      if (!updateResult.success) return;

      // Slug should remain unchanged
      expect(updateResult.data.slug).toBe(originalSlug);
      expect(updateResult.data.name).toBe('Updated Activity');
    });

    it('should preserve slug when updating description', async () => {
      // Create activity
      const createResult = await create({
        name: 'Test Activity',
        activityType: 'activity',
        startTime: '2025-06-15T10:00:00Z',
        description: 'Original description',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      createdActivityIds.push(createResult.data.id);
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
      // Create activity
      const createResult = await create({
        name: 'Initial Activity',
        activityType: 'activity',
        startTime: '2025-06-15T10:00:00Z',
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      createdActivityIds.push(createResult.data.id);
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
        'simple-activity',
        'activity-with-numbers-123',
        'a',
        'activity-2',
      ];

      for (const name of validNames) {
        const result = await create({
          name,
          activityType: 'activity',
          startTime: '2025-06-15T10:00:00Z',
        });

        expect(result.success).toBe(true);
        if (!result.success) continue;

        createdActivityIds.push(result.data.id);
        expect(result.data.slug).toMatch(/^[a-z0-9-]+$/);
      }
    });

    it('should handle unicode characters in names', async () => {
      const result = await create({
        name: 'Piña Colada Making',
        activityType: 'activity',
        startTime: '2025-06-15T16:00:00Z',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      createdActivityIds.push(result.data.id);

      // Unicode should be removed, leaving only ASCII
      expect(result.data.slug).toMatch(/^[a-z0-9-]+$/);
      expect(result.data.slug).not.toMatch(/[^\x00-\x7F]/);
    });
  });
});
