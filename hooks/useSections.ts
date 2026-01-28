import { useState, useEffect, useCallback } from 'react';

interface Column {
  id: string;
  columnNumber: 1 | 2;
  contentType: 'rich_text' | 'photos' | 'references';
  contentData: any;
}

interface Section {
  id: string;
  pageType: 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom' | 'home';
  pageId: string;
  displayOrder: number;
  layout: 'one-column' | 'two-column';
  columns: Column[];
}

interface UseSectionsParams {
  pageType: string;
  pageId: string;
}

interface UseSectionsReturn {
  data: Section[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: Partial<Section>) => Promise<{ success: boolean; data?: Section; error?: string }>;
  update: (id: string, data: Partial<Section>) => Promise<{ success: boolean; data?: Section; error?: string }>;
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
  reorder: (sectionIds: string[]) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Custom hook for managing page sections
 * 
 * Provides:
 * - Data fetching with loading and error states
 * - CRUD operations (create, update, delete)
 * - Section reordering
 * - Automatic refetch after mutations
 */
export function useSections({ pageType, pageId }: UseSectionsParams): UseSectionsReturn {
  const [data, setData] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!pageType || !pageId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/sections/by-page/${pageType}/${pageId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch sections');
      }

      setData(result.data || []);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      console.error('Failed to fetch sections:', errorObj);
    } finally {
      setLoading(false);
    }
  }, [pageType, pageId]);

  const create = useCallback(async (sectionData: Partial<Section>) => {
    try {
      const response = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sectionData,
          pageType,
          pageId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to create section',
        };
      }

      // Optimistic update
      setData((prev) => [...prev, result.data].sort((a, b) => a.displayOrder - b.displayOrder));

      return { success: true, data: result.data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to create section:', err);
      return { success: false, error: errorMsg };
    }
  }, [pageType, pageId]);

  const update = useCallback(async (id: string, sectionData: Partial<Section>) => {
    try {
      const response = await fetch(`/api/admin/sections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to update section',
        };
      }

      // Optimistic update
      setData((prev) =>
        prev.map((section) => (section.id === id ? { ...section, ...result.data } : section))
      );

      return { success: true, data: result.data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to update section:', err);
      return { success: false, error: errorMsg };
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/sections/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to delete section',
        };
      }

      // Optimistic update
      setData((prev) => prev.filter((section) => section.id !== id));

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to delete section:', err);
      return { success: false, error: errorMsg };
    }
  }, []);

  const reorder = useCallback(async (sectionIds: string[]) => {
    try {
      const response = await fetch('/api/admin/sections/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionIds }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to reorder sections',
        };
      }

      // Optimistic update
      setData((prev) => {
        const ordered = sectionIds
          .map((id) => prev.find((s) => s.id === id))
          .filter((s): s is Section => s !== undefined);
        return ordered;
      });

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to reorder sections:', err);
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
    reorder,
  };
}
