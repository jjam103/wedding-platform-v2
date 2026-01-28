import { useState, useEffect, useCallback } from 'react';

interface RoomType {
  id: string;
  accommodationId: string;
  name: string;
  capacity: number;
  pricePerNight: number;
  description?: string;
  checkInDate: string;
  checkOutDate: string;
  occupancy?: number;
  createdAt: string;
  updatedAt: string;
}

interface UseRoomTypesParams {
  accommodationId?: string;
}

interface UseRoomTypesReturn {
  data: RoomType[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: Partial<RoomType>) => Promise<{ success: boolean; data?: RoomType; error?: string }>;
  update: (id: string, data: Partial<RoomType>) => Promise<{ success: boolean; data?: RoomType; error?: string }>;
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Custom hook for managing room types within accommodations
 * 
 * Provides:
 * - Data fetching with loading and error states
 * - CRUD operations (create, update, delete)
 * - Capacity tracking
 * - Automatic refetch after mutations
 */
export function useRoomTypes({ accommodationId }: UseRoomTypesParams = {}): UseRoomTypesReturn {
  const [data, setData] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!accommodationId) {
      setLoading(false);
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/accommodations/${accommodationId}/room-types`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch room types');
      }

      setData(result.data || []);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      console.error('Failed to fetch room types:', errorObj);
    } finally {
      setLoading(false);
    }
  }, [accommodationId]);

  const create = useCallback(async (roomTypeData: Partial<RoomType>) => {
    try {
      const response = await fetch('/api/admin/room-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roomTypeData,
          accommodationId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to create room type',
        };
      }

      // Optimistic update
      setData((prev) => [...prev, result.data]);

      return { success: true, data: result.data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to create room type:', err);
      return { success: false, error: errorMsg };
    }
  }, [accommodationId]);

  const update = useCallback(async (id: string, roomTypeData: Partial<RoomType>) => {
    try {
      const response = await fetch(`/api/admin/room-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomTypeData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to update room type',
        };
      }

      // Optimistic update
      setData((prev) =>
        prev.map((roomType) => (roomType.id === id ? { ...roomType, ...result.data } : roomType))
      );

      return { success: true, data: result.data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to update room type:', err);
      return { success: false, error: errorMsg };
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/room-types/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to delete room type',
        };
      }

      // Optimistic update
      setData((prev) => prev.filter((roomType) => roomType.id !== id));

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to delete room type:', err);
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
