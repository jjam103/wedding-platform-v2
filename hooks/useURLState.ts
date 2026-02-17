import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook for managing state in URL search parameters
 * 
 * Syncs component state with URL parameters for shareable/bookmarkable URLs
 */
export function useURLState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Update URL with new parameters
   * Uses window.history.pushState for immediate URL updates
   */
  const updateURL = useCallback((params: Record<string, string>) => {
    // Get current search params from the URL directly to avoid stale closure
    const currentParams = new URLSearchParams(window.location.search);
    
    // Update parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '') {
        currentParams.set(key, value);
      } else {
        currentParams.delete(key);
      }
    });

    const queryString = currentParams.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;
    
    // Use window.history.pushState for immediate URL update
    // This updates the browser URL synchronously
    window.history.replaceState(null, '', newURL);
    
    // Also notify Next.js router (but don't wait for it)
    router.replace(newURL, { scroll: false });
  }, [router, pathname]);

  /**
   * Get value from URL parameter
   */
  const getParam = useCallback((key: string): string => {
    return searchParams?.get(key) || '';
  }, [searchParams]);

  /**
   * Get all parameters as an object
   */
  const getAllParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    searchParams?.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  /**
   * Clear all URL parameters
   */
  const clearParams = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  return {
    updateURL,
    getParam,
    getAllParams,
    clearParams,
    isInitialized,
  };
}
