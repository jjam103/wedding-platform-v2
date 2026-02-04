# Performance Optimization Guide

This document provides comprehensive guidelines for optimizing performance across the Costa Rica Wedding Management System.

## Performance Targets

### Database Performance
- **Query execution time**: < 100ms (p95)
- **API response time**: < 500ms (p95)
- **Pagination**: 50 items per page

### Frontend Performance
- **Lighthouse score**: > 90
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Time to Interactive (TTI)**: < 3.5s

### Bundle Size
- **Initial bundle**: < 200KB
- **Total page weight**: < 1MB
- **Individual chunks**: < 50KB

### Caching
- **Cache hit rate**: > 80%
- **Cache response time**: < 10ms
- **Cache invalidation time**: < 100ms

## Database Optimization

### 1. Indexes

All frequently queried columns have indexes:

```sql
-- Guests table
CREATE INDEX idx_guests_group_id ON guests(group_id);
CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_last_name ON guests(last_name);

-- Events table
CREATE UNIQUE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_is_active ON events(is_active);

-- Activities table
CREATE UNIQUE INDEX idx_activities_slug ON activities(slug);
CREATE INDEX idx_activities_activity_date ON activities(activity_date);
CREATE INDEX idx_activities_event_id ON activities(event_id);

-- RSVPs table
CREATE INDEX idx_rsvps_guest_id ON rsvps(guest_id);
CREATE INDEX idx_rsvps_activity_id ON rsvps(activity_id);
CREATE INDEX idx_rsvps_response_status ON rsvps(response_status);
```

### 2. N+1 Query Prevention

Use joins to fetch related data in a single query:

```typescript
// ❌ BAD: N+1 query pattern
const guests = await supabase.from('guests').select('*');
for (const guest of guests.data) {
  const rsvps = await supabase.from('rsvps').select('*').eq('guest_id', guest.id);
}

// ✅ GOOD: Single query with join
const guests = await supabase
  .from('guests')
  .select(`
    *,
    rsvps (
      id,
      activity_id,
      response_status
    )
  `);
```

Use the query optimization utilities in `lib/queryOptimization.ts`:

```typescript
import { fetchGuestsWithRSVPs } from '@/lib/queryOptimization';

const { data, count } = await fetchGuestsWithRSVPs(supabase, {
  groupId: 'group-123',
  page: 1,
  pageSize: 50,
});
```

### 3. Pagination

Always paginate large result sets:

```typescript
import { getPaginationRange, PAGINATION_DEFAULTS } from '@/lib/queryOptimization';

const { from, to } = getPaginationRange(page, PAGINATION_DEFAULTS.GUESTS_PER_PAGE);

const { data, count } = await supabase
  .from('guests')
  .select('*', { count: 'exact' })
  .range(from, to);
```

### 4. Query Optimization Best Practices

- Use `select()` with specific fields instead of `*`
- Use `.single()` only when expecting exactly one result
- Use `.maybeSingle()` when expecting 0 or 1 results
- Use `count: 'exact'` only when you need the total count
- Avoid complex joins in hot paths
- Use materialized views for complex aggregations

## Caching Strategy

### 1. Server-Side Caching (Redis)

Use the caching utilities in `lib/caching.ts`:

```typescript
import { getCache, CacheKeys, CACHE_TTL } from '@/lib/caching';

const cache = getCache();

// Get from cache
const cached = await cache.get(CacheKeys.event('event-123'));
if (cached) {
  return cached;
}

// Fetch from database
const event = await fetchEvent('event-123');

// Store in cache
await cache.set(
  CacheKeys.event('event-123'),
  event,
  CACHE_TTL.EVENTS
);
```

### 2. Cache Invalidation

Invalidate caches when data changes:

```typescript
import { CacheInvalidation } from '@/lib/caching';

// After updating an event
await CacheInvalidation.invalidateEvent(eventId, slug);

// After updating an RSVP
await CacheInvalidation.invalidateRSVP(guestId, activityId, eventId);
```

### 3. Client-Side Caching (React Query)

Configure React Query for optimal caching:

```typescript
import { useQuery } from '@tanstack/react-query';
import { CACHE_TTL, CacheKeys } from '@/lib/caching';

const { data, isLoading } = useQuery({
  queryKey: [CacheKeys.contentPages('published')],
  queryFn: () => fetchContentPages(),
  staleTime: CACHE_TTL.CONTENT_PAGES * 1000,
  cacheTime: CACHE_TTL.CONTENT_PAGES * 1000 * 2,
});
```

### 4. Cache TTL Guidelines

- **Dynamic data** (RSVPs, guests): 5 minutes
- **Semi-static data** (photos, accommodations): 15 minutes
- **Static data** (content pages, locations): 1 hour
- **Analytics data**: 10 minutes

## Frontend Optimization

### 1. Code Splitting

Use dynamic imports for heavy components:

```typescript
import dynamic from 'next/dynamic';

const PhotoGallery = dynamic(() => import('@/components/PhotoGallery'), {
  loading: () => <PhotoGallerySkeleton />,
  ssr: false, // Disable SSR for client-only components
});
```

Split by route (automatic with Next.js App Router):
- Each page in `app/` directory is automatically code-split
- Shared components are bundled separately

Lazy load below-the-fold content:

```typescript
import { useLazyLoad } from '@/hooks/useLazyLoad';

const ref = useRef<HTMLDivElement>(null);
const isVisible = useLazyLoad(ref);

return (
  <div ref={ref}>
    {isVisible && <HeavyComponent />}
  </div>
);
```

### 2. Image Optimization

Always use Next.js Image component:

```typescript
import Image from 'next/image';

<Image
  src="/photo.jpg"
  alt="Wedding photo"
  width={800}
  height={600}
  loading="lazy"
  quality={85}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

Image optimization features:
- Automatic WebP conversion
- Responsive images with srcset
- Lazy loading below the fold
- Blur placeholders for better UX
- CDN delivery

### 3. Bundle Size Optimization

**Tree shaking:**
```typescript
// ❌ BAD: Imports entire library
import _ from 'lodash';

// ✅ GOOD: Tree-shakeable import
import { debounce } from 'lodash-es';
```

**Remove unused dependencies:**
```bash
npm run build -- --analyze
# Review bundle analyzer report
# Remove unused packages
```

**Minification and compression:**
- Enabled automatically in production builds
- Uses SWC minifier (faster than Terser)
- Gzip/Brotli compression configured in `next.config.ts`

### 4. Critical CSS

Inline critical CSS in `app/layout.tsx`:

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 5. Font Optimization

Use Next.js font optimization:

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### 6. React Performance

**Memoization:**
```typescript
// Memoize expensive computations
const sortedGuests = useMemo(() => 
  guests.sort((a, b) => a.lastName.localeCompare(b.lastName)),
  [guests]
);

// Memoize callbacks
const handleEdit = useCallback((id: string) => {
  setEditingId(id);
}, []);

// Memoize components
const MemoizedGuestCard = React.memo(GuestCard);
```

**Avoid inline functions:**
```typescript
// ❌ BAD: New function on every render
<Button onClick={() => handleClick(id)} />

// ✅ GOOD: Memoized callback
const onClick = useCallback(() => handleClick(id), [id]);
<Button onClick={onClick} />
```

## Performance Monitoring

### 1. Web Vitals

Monitor Core Web Vitals in production:

```typescript
// app/layout.tsx
export function reportWebVitals(metric: NextWebVitalsMetric) {
  // Send to analytics
  if (metric.name === 'LCP' && metric.value > 2500) {
    console.warn('LCP exceeded target:', metric.value);
  }
}
```

### 2. Performance Budgets

Set up performance budgets in CI/CD:

```yaml
# .github/workflows/performance.yml
- name: Check bundle size
  run: |
    npm run build
    SIZE=$(du -sk .next/static | cut -f1)
    if [ $SIZE -gt 200 ]; then
      echo "Bundle size exceeded: ${SIZE}KB > 200KB"
      exit 1
    fi
```

### 3. Lighthouse CI

Run Lighthouse in CI:

```yaml
- name: Run Lighthouse
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      http://localhost:3000
      http://localhost:3000/guest/dashboard
    uploadArtifacts: true
    temporaryPublicStorage: true
```

### 4. Real User Monitoring (RUM)

Use Vercel Analytics for production monitoring:

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Performance Testing

### 1. Database Performance Tests

Run performance tests:

```bash
npm run test:performance
```

Tests verify:
- Query execution time < 100ms (p95)
- Pagination performance
- Index effectiveness
- N+1 query prevention

### 2. Frontend Performance Tests

Use Lighthouse:

```bash
npm run lighthouse
```

Targets:
- Performance score > 90
- FCP < 1.5s
- LCP < 2.5s
- CLS < 0.1

### 3. Load Testing

Use k6 for load testing:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100, // 100 virtual users
  duration: '30s',
};

export default function () {
  let res = http.get('http://localhost:3000/api/guests');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Performance Checklist

### Before Deployment

- [ ] Run `npm run build` successfully
- [ ] Bundle size < 200KB
- [ ] All performance tests pass
- [ ] Lighthouse score > 90
- [ ] Database indexes created
- [ ] Caching configured
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Critical CSS inlined
- [ ] Fonts optimized

### After Deployment

- [ ] Monitor Web Vitals
- [ ] Check cache hit rates
- [ ] Monitor API response times
- [ ] Track database query performance
- [ ] Review error rates
- [ ] Monitor bundle sizes
- [ ] Check CDN performance

## Troubleshooting

### Slow Database Queries

1. Check query execution plan:
```sql
EXPLAIN ANALYZE SELECT * FROM guests WHERE group_id = 'xxx';
```

2. Verify indexes are being used:
```sql
SELECT * FROM pg_stat_user_indexes WHERE tablename = 'guests';
```

3. Add missing indexes if needed

### Large Bundle Size

1. Analyze bundle:
```bash
npm run build -- --analyze
```

2. Identify large dependencies
3. Use dynamic imports for heavy components
4. Remove unused dependencies

### Poor Lighthouse Score

1. Run Lighthouse audit
2. Review opportunities and diagnostics
3. Fix issues in order of impact
4. Re-run audit to verify improvements

### Low Cache Hit Rate

1. Check cache TTL configuration
2. Verify cache invalidation logic
3. Monitor cache size and eviction
4. Adjust TTL based on data volatility

## Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Supabase Performance](https://supabase.com/docs/guides/database/performance)
