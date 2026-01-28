import { renderHook, waitFor } from '@testing-library/react';
import { useRoomTypes } from './useRoomTypes';

// Mock fetch globally
global.fetch = jest.fn();

describe('useRoomTypes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loading states', () => {
    it('should start with loading true when accommodationId provided', () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() =>
        useRoomTypes({ accommodationId: 'acc-1' })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should not fetch when accommodationId is missing', async () => {
      const { result } = renderHook(() => useRoomTypes({}));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.data).toEqual([]);
    });

    it('should set loading false after successful fetch', async () => {
      const mockData = [
        {
          id: 'room-1',
          accommodationId: 'acc-1',
          name: 'Ocean View',
          capacity: 2,
          pricePerNight: 150,
          checkInDate: '2025-06-14',
          checkOutDate: '2025-06-16',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      });

      const { result } = renderHook(() =>
        useRoomTypes({ accommodationId: 'acc-1' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });

    it('should set loading false after failed fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { message: 'Failed to fetch' },
        }),
      });

      const { result } = renderHook(() =>
        useRoomTypes({ accommodationId: 'acc-1' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useRoomTypes({ accommodationId: 'acc-1' })
      );

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual([]);
    });

    it('should handle API error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { message: 'Not found' },
        }),
      });

      const { result } = renderHook(() =>
        useRoomTypes({ accommodationId: 'acc-1' })
      );

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.error?.message).toBe('Not found');
    });
  });

  describe('data refetching', () => {
    it('should refetch data when refetch is called', async () => {
      const initialData = [
        {
          id: 'room-1',
          accommodationId: 'acc-1',
          name: 'Ocean View',
          capacity: 2,
          pricePerNight: 150,
          checkInDate: '2025-06-14',
          checkOutDate: '2025-06-16',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const updatedData = [
        ...initialData,
        {
          id: 'room-2',
          accommodationId: 'acc-1',
          name: 'Suite',
          capacity: 4,
          pricePerNight: 250,
          checkInDate: '2025-06-14',
          checkOutDate: '2025-06-16',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: initialData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: updatedData }),
        });

      const { result } = renderHook(() =>
        useRoomTypes({ accommodationId: 'acc-1' })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(initialData);
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.data).toEqual(updatedData);
      });
    });

    it('should reset error state on refetch', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Initial error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      const { result } = renderHook(() =>
        useRoomTypes({ accommodationId: 'acc-1' })
      );

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('optimistic updates', () => {
    it('should optimistically add new room type on create', async () => {
      const existingData = [
        {
          id: 'room-1',
          accommodationId: 'acc-1',
          name: 'Ocean View',
          capacity: 2,
          pricePerNight: 150,
          checkInDate: '2025-06-14',
          checkOutDate: '2025-06-16',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const newRoomType = {
        id: 'room-2',
        accommodationId: 'acc-1',
        name: 'Suite',
        capacity: 4,
        pricePerNight: 250,
        checkInDate: '2025-06-14',
        checkOutDate: '2025-06-16',
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: existingData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: newRoomType }),
        });

      const { result } = renderHook(() =>
        useRoomTypes({ accommodationId: 'acc-1' })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(existingData);
      });

      const createResult = await result.current.create({
        name: 'Suite',
        capacity: 4,
        pricePerNight: 250,
        checkInDate: '2025-06-14',
        checkOutDate: '2025-06-16',
      });

      expect(createResult.success).toBe(true);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[1]).toEqual(newRoomType);
    });

    it('should include accommodationId in create request', async () => {
      const mockData = [
        {
          id: 'room-1',
          accommodationId: 'acc-1',
          name: 'Ocean View',
          capacity: 2,
          pricePerNight: 150,
          checkInDate: '2025-06-14',
          checkOutDate: '2025-06-16',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'room-2', name: 'Suite' },
          }),
        });

      const { result } = renderHook(() =>
        useRoomTypes({ accommodationId: 'acc-1' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.create({
        name: 'Suite',
        capacity: 4,
        pricePerNight: 250,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/room-types',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"accommodationId":"acc-1"'),
        })
      );
    });

    it('should optimistically update existing room type', async () => {
      const initialData = [
        {
          id: 'room-1',
          accommodationId: 'acc-1',
          name: 'Ocean View',
          capacity: 2,
          pricePerNight: 150,
          checkInDate: '2025-06-14',
          checkOutDate: '2025-06-16',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const updatedRoomType = {
        ...initialData[0],
        pricePerNight: 175,
        updatedAt: '2025-01-02T00:00:00Z',
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: initialData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: updatedRoomType }),
        });

      const { result } = renderHook(() =>
        useRoomTypes({ accommodationId: 'acc-1' })
      );

      await waitFor(() => {
        expect(result.current.data[0].pricePerNight).toBe(150);
      });

      const updateResult = await result.current.update('room-1', {
        pricePerNight: 175,
      });

      expect(updateResult.success).toBe(true);
      expect(result.current.data[0].pricePerNight).toBe(175);
    });

    it('should optimistically remove room type on delete', async () => {
      const initialData = [
        {
          id: 'room-1',
          accommodationId: 'acc-1',
          name: 'Ocean View',
          capacity: 2,
          pricePerNight: 150,
          checkInDate: '2025-06-14',
          checkOutDate: '2025-06-16',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'room-2',
          accommodationId: 'acc-1',
          name: 'Suite',
          capacity: 4,
          pricePerNight: 250,
          checkInDate: '2025-06-14',
          checkOutDate: '2025-06-16',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: initialData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { result } = renderHook(() =>
        useRoomTypes({ accommodationId: 'acc-1' })
      );

      await waitFor(() => {
        expect(result.current.data).toHaveLength(2);
      });

      const deleteResult = await result.current.remove('room-1');

      expect(deleteResult.success).toBe(true);
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].id).toBe('room-2');
    });

    it('should not update state on failed create', async () => {
      const initialData = [
        {
          id: 'room-1',
          accommodationId: 'acc-1',
          name: 'Ocean View',
          capacity: 2,
          pricePerNight: 150,
          checkInDate: '2025-06-14',
          checkOutDate: '2025-06-16',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: initialData }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            error: { message: 'Validation error' },
          }),
        });

      const { result } = renderHook(() =>
        useRoomTypes({ accommodationId: 'acc-1' })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(initialData);
      });

      const createResult = await result.current.create({
        name: 'Invalid Room',
      });

      expect(createResult.success).toBe(false);
      expect(createResult.error).toBe('Validation error');
      expect(result.current.data).toEqual(initialData);
    });
  });
});
