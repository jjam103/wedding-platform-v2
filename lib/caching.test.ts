/**
 * Caching Module Tests
 * 
 * Tests for caching utilities and strategies
 */

import {
  CACHE_TTL,
  CacheKeys,
  CacheTags,
  getCache,
  CacheInvalidation,
} from './caching';

describe('Caching Module', () => {
  describe('CACHE_TTL', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.RSVPS).toBe(300); // 5 minutes
      expect(CACHE_TTL.GUESTS).toBe(300);
      expect(CACHE_TTL.CONTENT_PAGES).toBe(3600); // 1 hour
      expect(CACHE_TTL.LOCATIONS).toBe(3600);
      expect(CACHE_TTL.PHOTOS).toBe(900); // 15 minutes
      expect(CACHE_TTL.RSVP_ANALYTICS).toBe(600); // 10 minutes
    });

    it('should have dynamic data with shorter TTL than static data', () => {
      expect(CACHE_TTL.RSVPS).toBeLessThan(CACHE_TTL.CONTENT_PAGES);
      expect(CACHE_TTL.GUESTS).toBeLessThan(CACHE_TTL.LOCATIONS);
      expect(CACHE_TTL.ACTIVITIES).toBeLessThan(CACHE_TTL.SETTINGS);
    });
  });

  describe('CacheKeys', () => {
    it('should generate correct guest keys', () => {
      expect(CacheKeys.guest('123')).toBe('guest:123');
      expect(CacheKeys.guestsByGroup('group-1')).toBe('guests:group:group-1');
      expect(CacheKeys.guestRSVPs('guest-1')).toBe('guest:guest-1:rsvps');
    });

    it('should generate correct event keys', () => {
      expect(CacheKeys.event('event-1')).toBe('event:event-1');
      expect(CacheKeys.eventBySlug('ceremony')).toBe('event:slug:ceremony');
      expect(CacheKeys.events()).toBe('events');
      expect(CacheKeys.events('active')).toBe('events:active');
      expect(CacheKeys.eventActivities('event-1')).toBe('event:event-1:activities');
    });

    it('should generate correct activity keys', () => {
      expect(CacheKeys.activity('activity-1')).toBe('activity:activity-1');
      expect(CacheKeys.activityBySlug('beach-volleyball')).toBe('activity:slug:beach-volleyball');
      expect(CacheKeys.activityRSVPs('activity-1')).toBe('activity:activity-1:rsvps');
      expect(CacheKeys.activityCapacity('activity-1')).toBe('activity:activity-1:capacity');
    });

    it('should generate correct content page keys', () => {
      expect(CacheKeys.contentPage('page-1')).toBe('content_page:page-1');
      expect(CacheKeys.contentPageBySlug('our-story')).toBe('content_page:slug:our-story');
      expect(CacheKeys.contentPages()).toBe('content_pages');
      expect(CacheKeys.contentPages('published')).toBe('content_pages:published');
      expect(CacheKeys.pageSections('content_page', 'page-1')).toBe('sections:content_page:page-1');
    });

    it('should generate correct photo keys', () => {
      expect(CacheKeys.photo('photo-1')).toBe('photo:photo-1');
      expect(CacheKeys.photos()).toBe('photos');
      expect(CacheKeys.photos('approved')).toBe('photos:approved');
      expect(CacheKeys.photosByPage('event', 'event-1')).toBe('photos:event:event-1');
    });
  });

  describe('CacheTags', () => {
    it('should have all required tags', () => {
      expect(CacheTags.GUESTS).toBe('guests');
      expect(CacheTags.EVENTS).toBe('events');
      expect(CacheTags.ACTIVITIES).toBe('activities');
      expect(CacheTags.RSVPS).toBe('rsvps');
      expect(CacheTags.CONTENT_PAGES).toBe('content_pages');
      expect(CacheTags.SECTIONS).toBe('sections');
      expect(CacheTags.PHOTOS).toBe('photos');
      expect(CacheTags.LOCATIONS).toBe('locations');
      expect(CacheTags.SETTINGS).toBe('settings');
      expect(CacheTags.ANALYTICS).toBe('analytics');
    });
  });

  describe('InMemoryCache', () => {
    let cache: any;

    beforeEach(() => {
      cache = getCache();
    });

    it('should set and get values', async () => {
      await cache.set('test-key', { data: 'test' }, 60);
      const value = await cache.get('test-key');
      expect(value).toEqual({ data: 'test' });
    });

    it('should return null for non-existent keys', async () => {
      const value = await cache.get('non-existent');
      expect(value).toBeNull();
    });

    it('should expire values after TTL', async () => {
      await cache.set('expire-test', { data: 'test' }, 1); // 1 second TTL
      
      // Should exist immediately
      let value = await cache.get('expire-test');
      expect(value).toEqual({ data: 'test' });
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be expired
      value = await cache.get('expire-test');
      expect(value).toBeNull();
    });

    it('should delete values', async () => {
      await cache.set('delete-test', { data: 'test' }, 60);
      await cache.del('delete-test');
      
      const value = await cache.get('delete-test');
      expect(value).toBeNull();
    });

    it('should delete by pattern', async () => {
      await cache.set('guest:1', { id: '1' }, 60);
      await cache.set('guest:2', { id: '2' }, 60);
      await cache.set('event:1', { id: '1' }, 60);
      
      await cache.delByPattern('guest:*');
      
      expect(await cache.get('guest:1')).toBeNull();
      expect(await cache.get('guest:2')).toBeNull();
      expect(await cache.get('event:1')).not.toBeNull();
    });
  });

  describe('CacheInvalidation', () => {
    let cache: any;

    beforeEach(async () => {
      cache = getCache();
      
      // Set up test data
      await cache.set(CacheKeys.guest('guest-1'), { id: 'guest-1' }, 60);
      await cache.set(CacheKeys.guestRSVPs('guest-1'), [], 60);
      await cache.set(CacheKeys.event('event-1'), { id: 'event-1' }, 60);
      await cache.set(CacheKeys.eventBySlug('ceremony'), { id: 'event-1' }, 60);
      await cache.set(CacheKeys.activity('activity-1'), { id: 'activity-1' }, 60);
      await cache.set(CacheKeys.activityBySlug('beach-volleyball'), { id: 'activity-1' }, 60);
    });

    it('should invalidate guest caches', async () => {
      await CacheInvalidation.invalidateGuest('guest-1');
      
      expect(await cache.get(CacheKeys.guest('guest-1'))).toBeNull();
      expect(await cache.get(CacheKeys.guestRSVPs('guest-1'))).toBeNull();
    });

    it('should invalidate event caches', async () => {
      await CacheInvalidation.invalidateEvent('event-1', 'ceremony');
      
      expect(await cache.get(CacheKeys.event('event-1'))).toBeNull();
      expect(await cache.get(CacheKeys.eventBySlug('ceremony'))).toBeNull();
    });

    it('should invalidate activity caches', async () => {
      await CacheInvalidation.invalidateActivity('activity-1', 'beach-volleyball');
      
      expect(await cache.get(CacheKeys.activity('activity-1'))).toBeNull();
      expect(await cache.get(CacheKeys.activityBySlug('beach-volleyball'))).toBeNull();
    });

    it('should invalidate RSVP-related caches', async () => {
      await cache.set(CacheKeys.activityRSVPs('activity-1'), [], 60);
      await cache.set(CacheKeys.activityCapacity('activity-1'), { remaining: 10 }, 60);
      
      await CacheInvalidation.invalidateRSVP('guest-1', 'activity-1');
      
      expect(await cache.get(CacheKeys.guestRSVPs('guest-1'))).toBeNull();
      expect(await cache.get(CacheKeys.activityRSVPs('activity-1'))).toBeNull();
      expect(await cache.get(CacheKeys.activityCapacity('activity-1'))).toBeNull();
    });
  });

  describe('Cache Performance', () => {
    it('should have fast get operations', async () => {
      const cache = getCache();
      await cache.set('perf-test', { data: 'test' }, 60);
      
      const start = performance.now();
      await cache.get('perf-test');
      const end = performance.now();
      
      const duration = end - start;
      expect(duration).toBeLessThan(10); // < 10ms
    });

    it('should have fast set operations', async () => {
      const cache = getCache();
      
      const start = performance.now();
      await cache.set('perf-test', { data: 'test' }, 60);
      const end = performance.now();
      
      const duration = end - start;
      expect(duration).toBeLessThan(10); // < 10ms
    });
  });
});

/**
 * Cache Testing Guidelines:
 * 
 * 1. Test cache hit/miss scenarios
 * 2. Test TTL expiration
 * 3. Test cache invalidation
 * 4. Test pattern-based deletion
 * 5. Test tag-based invalidation
 * 6. Test cache performance (< 10ms)
 * 7. Test concurrent access
 * 8. Test cache size limits
 * 9. Test cache warming
 * 10. Monitor cache hit rates in production
 * 
 * Performance Targets:
 * - Cache get: < 10ms
 * - Cache set: < 10ms
 * - Cache invalidation: < 100ms
 * - Cache hit rate: > 80%
 */
