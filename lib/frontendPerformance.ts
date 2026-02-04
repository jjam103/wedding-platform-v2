/**
 * Frontend Performance Optimization Utilities
 * 
 * This module provides utilities and guidelines for optimizing
 * frontend performance including code splitting, image optimization,
 * and bundle size reduction.
 * 
 * Requirements: 19.5, 19.8, 19.9
 */

/**
 * Dynamic import helper for code splitting
 * 
 * Usage:
 * const PhotoGallery = dynamicImport(() => import('@/components/PhotoGallery'));
 */
export function dynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: React.ComponentType;
    ssr?: boolean;
  }
) {
  // This is a placeholder - actual implementation uses next/dynamic
  // See next.config.ts for configuration
  return importFn;
}

/**
 * Image optimization configuration
 * 
 * Next.js Image component automatically optimizes images:
 * - Converts to WebP format
 * - Generates responsive sizes
 * - Lazy loads below-the-fold images
 * - Serves from CDN
 * 
 * Usage:
 * import Image from 'next/image';
 * 
 * <Image
 *   src="/photo.jpg"
 *   alt="Description"
 *   width={800}
 *   height={600}
 *   loading="lazy"
 *   quality={85}
 * />
 */
export const IMAGE_OPTIMIZATION = {
  // Image quality (1-100)
  DEFAULT_QUALITY: 85,
  THUMBNAIL_QUALITY: 75,
  HERO_QUALITY: 90,
  
  // Responsive breakpoints
  BREAKPOINTS: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  
  // Lazy loading threshold
  LAZY_LOAD_THRESHOLD: '200px', // Load when 200px from viewport
  
  // Blur placeholder
  BLUR_DATA_URL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==',
} as const;

/**
 * Bundle size optimization guidelines
 * 
 * 1. Tree shaking:
 *    - Use ES6 imports (not require)
 *    - Import only what you need: import { Button } from 'ui' not import * as UI
 *    - Mark side-effect-free packages in package.json
 * 
 * 2. Code splitting:
 *    - Use dynamic imports for heavy components
 *    - Split by route (automatic with Next.js App Router)
 *    - Split by feature (lazy load below-the-fold content)
 * 
 * 3. Minification:
 *    - Enabled by default in production builds
 *    - Uses SWC minifier (faster than Terser)
 * 
 * 4. Compression:
 *    - Enable Gzip/Brotli in next.config.ts
 *    - Serve compressed assets from CDN
 * 
 * 5. Critical CSS:
 *    - Inline critical CSS in <head>
 *    - Defer non-critical CSS
 *    - Use CSS modules for component-scoped styles
 */

/**
 * Performance budgets
 */
export const PERFORMANCE_BUDGETS = {
  // Bundle sizes
  INITIAL_BUNDLE_KB: 200,
  TOTAL_PAGE_KB: 1024,
  
  // Timing metrics
  FCP_MS: 1500, // First Contentful Paint
  LCP_MS: 2500, // Largest Contentful Paint
  TTI_MS: 3500, // Time to Interactive
  CLS: 0.1, // Cumulative Layout Shift
  FID_MS: 100, // First Input Delay
  
  // API performance
  API_RESPONSE_MS: 500, // p95
  DB_QUERY_MS: 100, // p95
} as const;

/**
 * Lazy loading helper for below-the-fold content
 * 
 * Usage:
 * const isVisible = useLazyLoad(ref);
 * 
 * {isVisible && <HeavyComponent />}
 */
export function useLazyLoad(
  ref: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
) {
  // Placeholder - actual implementation uses IntersectionObserver
  // See hooks/useLazyLoad.ts for full implementation
  return true;
}

/**
 * Debounce helper for reducing unnecessary renders
 * 
 * Usage:
 * const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delay: number): T {
  // Placeholder - see hooks/useDebounce.ts for full implementation
  return value;
}

/**
 * Memoization helpers
 * 
 * Use React.memo for components that render often with same props
 * Use useMemo for expensive computations
 * Use useCallback for callbacks passed to children
 * 
 * Example:
 * const MemoizedComponent = React.memo(MyComponent);
 * 
 * const sortedData = useMemo(() => 
 *   data.sort((a, b) => a.name.localeCompare(b.name)),
 *   [data]
 * );
 * 
 * const handleClick = useCallback(() => {
 *   doSomething(id);
 * }, [id]);
 */

/**
 * Web Vitals monitoring
 * 
 * Next.js provides built-in Web Vitals reporting.
 * Configure in app/layout.tsx:
 * 
 * export function reportWebVitals(metric: NextWebVitalsMetric) {
 *   console.log(metric);
 *   // Send to analytics
 * }
 */
export interface WebVitalsMetric {
  id: string;
  name: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Performance monitoring helper
 */
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  
  return duration;
}

/**
 * Resource hints for preloading critical assets
 * 
 * Add to <head> in app/layout.tsx:
 * 
 * <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
 * <link rel="preconnect" href="https://fonts.googleapis.com" />
 * <link rel="dns-prefetch" href="https://api.example.com" />
 */

/**
 * Frontend Performance Checklist:
 * 
 * ✓ Code Splitting
 *   - Dynamic imports for heavy components
 *   - Route-based splitting (automatic)
 *   - Lazy load below-the-fold content
 * 
 * ✓ Image Optimization
 *   - Use Next.js Image component
 *   - Convert to WebP format
 *   - Implement lazy loading
 *   - Add responsive srcset
 *   - Use blur placeholders
 * 
 * ✓ Bundle Size
 *   - Enable tree shaking
 *   - Minify code (production)
 *   - Enable Gzip/Brotli compression
 *   - Inline critical CSS
 *   - Remove unused dependencies
 * 
 * ✓ Caching
 *   - Cache static assets (1 year)
 *   - Use CDN for photos
 *   - Implement service workers
 *   - Use React Query for API caching
 * 
 * ✓ Rendering
 *   - Use Server Components where possible
 *   - Implement streaming SSR
 *   - Prefetch critical resources
 *   - Optimize font loading
 * 
 * ✓ JavaScript
 *   - Defer non-critical scripts
 *   - Use async for third-party scripts
 *   - Minimize main thread work
 *   - Avoid long tasks (> 50ms)
 * 
 * ✓ Monitoring
 *   - Track Web Vitals
 *   - Set up performance budgets
 *   - Monitor bundle sizes
 *   - Track API response times
 * 
 * Performance Targets:
 * - Lighthouse score: > 90
 * - FCP: < 1.5s
 * - LCP: < 2.5s
 * - CLS: < 0.1
 * - FID: < 100ms
 * - Initial bundle: < 200KB
 * - Total page: < 1MB
 */

/**
 * Common Performance Anti-Patterns to Avoid:
 * 
 * ❌ Importing entire libraries
 *    import _ from 'lodash'; // Imports entire library
 *    ✓ import { debounce } from 'lodash-es'; // Tree-shakeable
 * 
 * ❌ Not memoizing expensive computations
 *    const sorted = data.sort(...); // Runs on every render
 *    ✓ const sorted = useMemo(() => data.sort(...), [data]);
 * 
 * ❌ Not lazy loading heavy components
 *    import PhotoGallery from './PhotoGallery'; // Loaded immediately
 *    ✓ const PhotoGallery = dynamic(() => import('./PhotoGallery'));
 * 
 * ❌ Not optimizing images
 *    <img src="/photo.jpg" /> // No optimization
 *    ✓ <Image src="/photo.jpg" width={800} height={600} />
 * 
 * ❌ Inline functions in render
 *    <Button onClick={() => handleClick(id)} /> // New function every render
 *    ✓ const onClick = useCallback(() => handleClick(id), [id]);
 * 
 * ❌ Not using production builds
 *    npm run dev // Development mode (slow)
 *    ✓ npm run build && npm start // Production mode (optimized)
 */
