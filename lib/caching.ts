/**
 * Caching Strategy Implementation
 * 
 * This module provides caching utilities for optimizing performance.
 * Supports both server-side (Redis) and client-side (React Query) caching.
 * 
 * Requirements: 19.6, 18.9
 */

/**
 * Cache TTL (Time To Live) configuration
 */
export const CACHE_TTL = {
  // Dynamic data - 5 minutes
  RSVPS: 5 * 60, // 300 seconds
  GUESTS: 5 * 60,
  ACTIVITIES: 5 * 60,
  EVENTS: 5 * 60,
  
  // Static data - 1 hour
  CONTENT_PAGES: 60 * 60, // 3600 seconds
  LOCATIONS: 60 * 60,
  SETTINGS: 60 * 60,
  
  // Semi-static data - 15 minutes
  PHOTOS: 15 * 60, // 900 seconds
  ACCOMMODATIONS: 15 * 60,
  
  // Analytics data - 10 minutes
  RSVP_ANALYTICS: 10 * 60, // 600 seconds
  CAPACITY_STATS: 10 * 60,
} as const;

/**
 * Cache key generators
 */
export const CacheKeys = {
  // Guest data
  guest: (id: string) => `guest:${id}`,
  guestsByGroup: (groupId: string) => `guests:group:${groupId}`,
  guestRSVPs: (guestId: string) => `guest:${guestId}:rsvps`,
  
  // Event data
  event: (id: string) => `event:${id}`,
  eventBySlug: (slug: string) => `event:slug:${slug}`,
  events: (filters?: string) => `events${filters ? `:${filters}` : ''}`,
  eventActivities: (eventId: string) => `event:${eventId}:activities`,
  
  // Activity data
  activity: (id: string) => `activity:${id}`,
  activityBySlug: (slug: string) => `activity:slug:${slug}`,
  activities: (filters?: string) => `activities${filters ? `:${filters}` : ''}`,
  activityRSVPs: (activityId: string) => `activity:${activityId}:rsvps`,
  activityCapacity: (activityId: string) => `activity:${activityId}:capacity`,
  
  // Content pages
  contentPage: (id: string) => `content_page:${id}`,
  contentPageBySlug: (slug: string) => `content_page:slug:${slug}`,
  contentPages: (status?: string) => `content_pages${status ? `:${status}` : ''}`,
  pageSections: (pageType: string, pageId: string) => `sections:${pageType}:${pageId}`,
  
  // Photos
  photo: (id: string) => `photo:${id}`,
  photos: (filters?: string) => `photos${filters ? `:${filters}` : ''}`,
  photosByPage: (pageType: string, pageId: string) => `photos:${pageType}:${pageId}`,
  
  // Analytics
  rsvpAnalytics: () => 'analytics:rsvps',
  capacityStats: () => 'analytics:capacity',
  
  // Settings
  settings: () => 'settings',
  
  // Locations
  location: (id: string) => `location:${id}`,
  locations: () => 'locations',
  locationHierarchy: (parentId?: string) => `locations:hierarchy${parentId ? `:${parentId}` : ''}`,
} as const;

/**
 * Cache tags for invalidation
 */
export const CacheTags = {
  GUESTS: 'guests',
  EVENTS: 'events',
  ACTIVITIES: 'activities',
  RSVPS: 'rsvps',
  CONTENT_PAGES: 'content_pages',
  SECTIONS: 'sections',
  PHOTOS: 'photos',
  LOCATIONS: 'locations',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
} as const;

/**
 * Server-side cache interface (Redis)
 * 
 * Note: This is a placeholder interface. Actual Redis implementation
 * would require installing and configuring Redis client.
 * 
 * For Next.js deployment on Vercel, consider using:
 * - Vercel KV (Redis-compatible)
 * - Upstash Redis
 * - Redis Cloud
 */
export interface ServerCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
  delByTag(tag: string): Promise<void>;
}

/**
 * In-memory cache implementation (fallback when Redis not available)
 */
class InMemoryCache implements ServerCache {
  private cache = new Map<string, { value: any; expires: number }>();
  private tags = new Map<string, Set<string>>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    const expires = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expires });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  async delByTag(tag: string): Promise<void> {
    const keys = this.tags.get(tag);
    
    if (keys) {
      for (const key of keys) {
        this.cache.delete(key);
      }
      this.tags.delete(tag);
    }
  }

  addTag(key: string, tag: string): void {
    if (!this.tags.has(tag)) {
      this.tags.set(tag, new Set());
    }
    this.tags.get(tag)!.add(key);
  }
}

/**
 * Cache instance (singleton)
 */
let cacheInstance: ServerCache | null = null;

/**
 * Get cache instance
 */
export function getCache(): ServerCache {
  if (!cacheInstance) {
    // In production, initialize Redis client here
    // For now, use in-memory cache as fallback
    cacheInstance = new InMemoryCache();
  }
  
  return cacheInstance;
}

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  /**
   * Invalidate guest-related caches
   */
  async invalidateGuest(guestId: string): Promise<void> {
    const cache = getCache();
    await cache.del(CacheKeys.guest(guestId));
    await cache.del(CacheKeys.guestRSVPs(guestId));
  },

  /**
   * Invalidate event-related caches
   */
  async invalidateEvent(eventId: string, slug?: string): Promise<void> {
    const cache = getCache();
    await cache.del(CacheKeys.event(eventId));
    if (slug) {
      await cache.del(CacheKeys.eventBySlug(slug));
    }
    await cache.del(CacheKeys.eventActivities(eventId));
    await cache.delByPattern('events:*');
  },

  /**
   * Invalidate activity-related caches
   */
  async invalidateActivity(activityId: string, slug?: string): Promise<void> {
    const cache = getCache();
    await cache.del(CacheKeys.activity(activityId));
    if (slug) {
      await cache.del(CacheKeys.activityBySlug(slug));
    }
    await cache.del(CacheKeys.activityRSVPs(activityId));
    await cache.del(CacheKeys.activityCapacity(activityId));
    await cache.delByPattern('activities:*');
  },

  /**
   * Invalidate RSVP-related caches
   */
  async invalidateRSVP(guestId: string, activityId?: string, eventId?: string): Promise<void> {
    const cache = getCache();
    await cache.del(CacheKeys.guestRSVPs(guestId));
    
    if (activityId) {
      await cache.del(CacheKeys.activityRSVPs(activityId));
      await cache.del(CacheKeys.activityCapacity(activityId));
    }
    
    if (eventId) {
      await cache.del(CacheKeys.eventActivities(eventId));
    }
    
    await cache.del(CacheKeys.rsvpAnalytics());
    await cache.del(CacheKeys.capacityStats());
  },

  /**
   * Invalidate content page caches
   */
  async invalidateContentPage(pageId: string, slug?: string): Promise<void> {
    const cache = getCache();
    await cache.del(CacheKeys.contentPage(pageId));
    if (slug) {
      await cache.del(CacheKeys.contentPageBySlug(slug));
    }
    await cache.delByPattern('content_pages:*');
  },

  /**
   * Invalidate section caches
   */
  async invalidateSections(pageType: string, pageId: string): Promise<void> {
    const cache = getCache();
    await cache.del(CacheKeys.pageSections(pageType, pageId));
  },

  /**
   * Invalidate photo caches
   */
  async invalidatePhotos(pageType?: string, pageId?: string): Promise<void> {
    const cache = getCache();
    
    if (pageType && pageId) {
      await cache.del(CacheKeys.photosByPage(pageType, pageId));
    }
    
    await cache.delByPattern('photos:*');
  },

  /**
   * Invalidate all caches (use sparingly)
   */
  async invalidateAll(): Promise<void> {
    const cache = getCache();
    await cache.delByPattern('*');
  },
};

/**
 * Cache warming helpers
 */
export const CacheWarming = {
  /**
   * Warm cache for published content pages
   */
  async warmContentPages(supabase: any): Promise<void> {
    const cache = getCache();
    
    const { data: pages } = await supabase
      .from('content_pages')
      .select('*')
      .eq('status', 'published');
    
    if (pages) {
      for (const page of pages) {
        await cache.set(
          CacheKeys.contentPage(page.id),
          page,
          CACHE_TTL.CONTENT_PAGES
        );
        
        if (page.slug) {
          await cache.set(
            CacheKeys.contentPageBySlug(page.slug),
            page,
            CACHE_TTL.CONTENT_PAGES
          );
        }
      }
    }
  },

  /**
   * Warm cache for active events
   */
  async warmEvents(supabase: any): Promise<void> {
    const cache = getCache();
    
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true);
    
    if (events) {
      for (const event of events) {
        await cache.set(
          CacheKeys.event(event.id),
          event,
          CACHE_TTL.EVENTS
        );
        
        if (event.slug) {
          await cache.set(
            CacheKeys.eventBySlug(event.slug),
            event,
            CACHE_TTL.EVENTS
          );
        }
      }
    }
  },

  /**
   * Warm cache for locations
   */
  async warmLocations(supabase: any): Promise<void> {
    const cache = getCache();
    
    const { data: locations } = await supabase
      .from('locations')
      .select('*');
    
    if (locations) {
      await cache.set(
        CacheKeys.locations(),
        locations,
        CACHE_TTL.LOCATIONS
      );
      
      for (const location of locations) {
        await cache.set(
          CacheKeys.location(location.id),
          location,
          CACHE_TTL.LOCATIONS
        );
      }
    }
  },
};

/**
 * Client-side caching configuration for React Query
 * 
 * Usage in components:
 * 
 * import { useQuery } from '@tanstack/react-query';
 * import { CACHE_TTL, CacheKeys } from '@/lib/caching';
 * 
 * const { data } = useQuery({
 *   queryKey: [CacheKeys.contentPages('published')],
 *   queryFn: () => fetchContentPages(),
 *   staleTime: CACHE_TTL.CONTENT_PAGES * 1000,
 *   cacheTime: CACHE_TTL.CONTENT_PAGES * 1000 * 2,
 * });
 */
export const ReactQueryConfig = {
  defaultOptions: {
    queries: {
      // RSVP data - 5 minutes
      staleTime: CACHE_TTL.RSVPS * 1000,
      cacheTime: CACHE_TTL.RSVPS * 1000 * 2,
      
      // Retry failed requests
      retry: 2,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
    },
  },
};

/**
 * Caching best practices:
 * 
 * 1. Cache frequently accessed data
 * 2. Use appropriate TTL based on data volatility
 * 3. Invalidate cache on mutations
 * 4. Use cache tags for bulk invalidation
 * 5. Warm cache on deployment
 * 6. Monitor cache hit/miss rates
 * 7. Use stale-while-revalidate pattern
 * 8. Implement cache versioning for breaking changes
 * 9. Set cache size limits to prevent memory issues
 * 10. Log cache operations for debugging
 * 
 * Performance targets:
 * - Cache hit rate: > 80%
 * - Cache response time: < 10ms
 * - Cache invalidation time: < 100ms
 */
