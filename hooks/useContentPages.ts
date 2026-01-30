import { useState, useEffect, useCallback } from 'react';
import type { ContentPage } from '@/schemas/cmsSchemas';

interface UseContentPagesReturn {
  data: ContentPage[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: Partial<ContentPage>) => Promise<{ success: boolean; data?: ContentPage; error?: string }>;
  update: (id: string, data: Partial<ContentPage>) => Promise<{ success: boolean; data?: ContentPage; error?: string }>;
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Custom hook for managing content pages
 * 
 * Provides:
 * - Data fetching with loading and error states
 * - CRUD operations (create, update, delete)
 * - Automatic refetch after mutations
 * - Optimistic updates
 */
export function useContentPages(): UseContentPagesReturn {
  const [data, setData] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/content-pages');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch content pages');
      }

      setData(result.data.items || result.data || []);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      console.error('Failed to fetch content pages:', errorObj);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (pageData: Partial<ContentPage>) => {
    try {
      const response = await fetch('/api/admin/content-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to create content page',
        };
      }

      // Optimistic update
      setData((prev) => [...prev, result.data]);

      return { success: true, data: result.data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to create content page:', err);
      return { success: false, error: errorMsg };
    }
  }, []);

  const update = useCallback(async (id: string, pageData: Partial<ContentPage>) => {
    try {
      const response = await fetch(`/api/admin/content-pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to update content page',
        };
      }

      // Optimistic update
      setData((prev) =>
        prev.map((page) => (page.id === id ? { ...page, ...result.data } : page))
      );

      return { success: true, data: result.data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to update content page:', err);
      return { success: false, error: errorMsg };
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/content-pages/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to delete content page',
        };
      }

      // Optimistic update
      setData((prev) => prev.filter((page) => page.id !== id));

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to delete content page:', err);
      return { success: false, error: errorMsg };
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
  };
}
