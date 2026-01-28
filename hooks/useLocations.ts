import { useState, useEffect, useCallback } from 'react';

interface Location {
  id: string;
  name: string;
  address?: string;
  description?: string;
  parentLocationId?: string;
  children?: Location[];
  createdAt: string;
  updatedAt: string;
}

interface UseLocationsReturn {
  data: Location[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: Partial<Location>) => Promise<{ success: boolean; data?: Location; error?: string }>;
  update: (id: string, data: Partial<Location>) => Promise<{ success: boolean; data?: Location; error?: string }>;
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
  validateParent: (id: string, parentId: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Custom hook for managing hierarchical locations
 * 
 * Provides:
 * - Data fetching with loading and error states
 * - CRUD operations (create, update, delete)
 * - Parent validation (circular reference prevention)
 * - Tree structure support
 * - Automatic refetch after mutations
 */
export function useLocations(): UseLocationsReturn {
  const [data, setData] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/locations');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch locations');
      }

      setData(result.data || []);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      console.error('Failed to fetch locations:', errorObj);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (locationData: Partial<Location>) => {
    try {
      const response = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to create location',
        };
      }

      // Refetch to get updated tree structure
      await refetch();

      return { success: true, data: result.data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to create location:', err);
      return { success: false, error: errorMsg };
    }
  }, [refetch]);

  const update = useCallback(async (id: string, locationData: Partial<Location>) => {
    try {
      const response = await fetch(`/api/admin/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to update location',
        };
      }

      // Refetch to get updated tree structure
      await refetch();

      return { success: true, data: result.data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to update location:', err);
      return { success: false, error: errorMsg };
    }
  }, [refetch]);

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/locations/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to delete location',
        };
      }

      // Refetch to get updated tree structure
      await refetch();

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to delete location:', err);
      return { success: false, error: errorMsg };
    }
  }, [refetch]);

  const validateParent = useCallback(async (id: string, parentId: string) => {
    try {
      const response = await fetch(`/api/admin/locations/${id}/validate-parent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Invalid parent location',
        };
      }

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to validate parent location:', err);
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
    validateParent,
  };
}
