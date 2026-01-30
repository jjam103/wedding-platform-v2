import { renderHook, waitFor } from '@testing-library/react';
import { useLocations } from './useLocations';

// Mock fetch globally
global.fetch = jest.fn();

describe('useLocations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loading states', () => {
    it('should start with loading true', () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useLocations());

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should set loading false after successful fetch', async () => {
      const mockData = [
        {
          id: 'loc-1',
          name: 'Costa Rica',
          address: '',
          description: 'Country',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          children: [],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      });

      const { result } = renderHook(() => useLocations());

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

      const { result } = renderHook(() => useLocations());

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

      const { result } = renderHook(() => useLocations());

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
          error: { message: 'Unauthorized' },
        }),
      });

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.error?.message).toBe('Unauthorized');
    });
  });

  describe('data refetching', () => {
    it('should refetch data when refetch is called', async () => {
      const initialData = [
        {
          id: 'loc-1',
          name: 'Costa Rica',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          children: [],
        },
      ];

      const updatedData = [
        ...initialData,
        {
          id: 'loc-2',
          name: 'Guanacaste',
          parentLocationId: 'loc-1',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
          children: [],
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

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.data).toEqual(initialData);
      });

      await waitFor(async () => {
        await result.current.refetch();
      });

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

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      await waitFor(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it('should refetch after successful create', async () => {
      const initialData = [
        {
          id: 'loc-1',
          name: 'Costa Rica',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          children: [],
        },
      ];

      const updatedData = [
        {
          ...initialData[0],
          children: [
            {
              id: 'loc-2',
              name: 'Guanacaste',
              parentLocationId: 'loc-1',
              createdAt: '2025-01-02T00:00:00Z',
              updatedAt: '2025-01-02T00:00:00Z',
              children: [],
            },
          ],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: initialData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'loc-2', name: 'Guanacaste' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: updatedData }),
        });

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.data).toEqual(initialData);
      });

      let createResult;
      await waitFor(async () => {
        createResult = await result.current.create({
          name: 'Guanacaste',
          parentLocationId: 'loc-1',
        });
      });

      expect(createResult.success).toBe(true);

      await waitFor(() => {
        expect(result.current.data).toEqual(updatedData);
      });
    });

    it('should refetch after successful update', async () => {
      const initialData = [
        {
          id: 'loc-1',
          name: 'Costa Rica',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          children: [],
        },
      ];

      const updatedData = [
        {
          ...initialData[0],
          name: 'República de Costa Rica',
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
          json: async () => ({
            success: true,
            data: updatedData[0],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: updatedData }),
        });

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.data[0].name).toBe('Costa Rica');
      });

      let updateResult;
      await waitFor(async () => {
        updateResult = await result.current.update('loc-1', {
          name: 'República de Costa Rica',
        });
      });

      expect(updateResult.success).toBe(true);

      await waitFor(() => {
        expect(result.current.data[0].name).toBe('República de Costa Rica');
      });
    });

    it('should refetch after successful delete', async () => {
      const initialData = [
        {
          id: 'loc-1',
          name: 'Costa Rica',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          children: [
            {
              id: 'loc-2',
              name: 'Guanacaste',
              parentLocationId: 'loc-1',
              createdAt: '2025-01-02T00:00:00Z',
              updatedAt: '2025-01-02T00:00:00Z',
              children: [],
            },
          ],
        },
      ];

      const updatedData = [
        {
          ...initialData[0],
          children: [],
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
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: updatedData }),
        });

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.data[0].children).toHaveLength(1);
      });

      let deleteResult;
      await waitFor(async () => {
        deleteResult = await result.current.remove('loc-2');
      });

      expect(deleteResult.success).toBe(true);

      await waitFor(() => {
        expect(result.current.data[0].children).toHaveLength(0);
      });
    });
  });

  describe('parent validation', () => {
    it('should validate parent successfully', async () => {
      const mockData = [
        {
          id: 'loc-1',
          name: 'Costa Rica',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          children: [],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let validationResult;
      await waitFor(async () => {
        validationResult = await result.current.validateParent(
          'loc-2',
          'loc-1'
        );
      });

      expect(validationResult.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/locations/loc-2/validate-parent',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ parentId: 'loc-1' }),
        })
      );
    });

    it('should handle circular reference validation error', async () => {
      const mockData = [
        {
          id: 'loc-1',
          name: 'Costa Rica',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          children: [],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockData }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            error: { message: 'Circular reference detected' },
          }),
        });

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let validationResult;
      await waitFor(async () => {
        validationResult = await result.current.validateParent(
          'loc-1',
          'loc-2'
        );
      });

      expect(validationResult.success).toBe(false);
      expect(validationResult.error).toBe('Circular reference detected');
    });

    it('should handle validation network errors', async () => {
      const mockData = [
        {
          id: 'loc-1',
          name: 'Costa Rica',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          children: [],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockData }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let validationResult;
      await waitFor(async () => {
        validationResult = await result.current.validateParent(
          'loc-2',
          'loc-1'
        );
      });

      expect(validationResult.success).toBe(false);
      expect(validationResult.error).toBe('Network error');
    });
  });
});
