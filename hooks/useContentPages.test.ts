import { renderHook, waitFor } from '@testing-library/react';
import { useContentPages } from './useContentPages';

// Mock fetch globally
global.fetch = jest.fn();

describe('useContentPages', () => {
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

      const { result } = renderHook(() => useContentPages());

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should set loading false after successful fetch', async () => {
      const mockData = [
        {
          id: 'page-1',
          slug: 'test-page',
          title: 'Test Page',
          status: 'published' as const,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      });

      const { result } = renderHook(() => useContentPages());

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

      const { result } = renderHook(() => useContentPages());

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

      const { result } = renderHook(() => useContentPages());

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

      const { result } = renderHook(() => useContentPages());

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.error?.message).toBe('Unauthorized');
    });

    it('should handle malformed response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false }),
      });

      const { result } = renderHook(() => useContentPages());

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.error?.message).toBe('Failed to fetch content pages');
    });
  });

  describe('data refetching', () => {
    it('should refetch data when refetch is called', async () => {
      const initialData = [
        {
          id: 'page-1',
          slug: 'initial',
          title: 'Initial',
          status: 'draft' as const,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const updatedData = [
        ...initialData,
        {
          id: 'page-2',
          slug: 'new-page',
          title: 'New Page',
          status: 'published' as const,
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

      const { result } = renderHook(() => useContentPages());

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

      const { result } = renderHook(() => useContentPages());

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
    it('should optimistically add new page on create', async () => {
      const existingData = [
        {
          id: 'page-1',
          slug: 'existing',
          title: 'Existing',
          status: 'published' as const,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const newPage = {
        id: 'page-2',
        slug: 'new-page',
        title: 'New Page',
        status: 'draft' as const,
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
          json: async () => ({ success: true, data: newPage }),
        });

      const { result } = renderHook(() => useContentPages());

      await waitFor(() => {
        expect(result.current.data).toEqual(existingData);
      });

      const createResult = await result.current.create({
        title: 'New Page',
        slug: 'new-page',
      });

      expect(createResult.success).toBe(true);
      
      await waitFor(() => {
        expect(result.current.data).toHaveLength(2);
      });
      
      expect(result.current.data[1]).toEqual(newPage);
    });

    it('should optimistically update existing page', async () => {
      const initialData = [
        {
          id: 'page-1',
          slug: 'test-page',
          title: 'Original Title',
          status: 'draft' as const,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const updatedPage = {
        ...initialData[0],
        title: 'Updated Title',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: initialData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: updatedPage }),
        });

      const { result } = renderHook(() => useContentPages());

      await waitFor(() => {
        expect(result.current.data[0].title).toBe('Original Title');
      });

      const updateResult = await result.current.update('page-1', {
        title: 'Updated Title',
      });

      expect(updateResult.success).toBe(true);
      
      await waitFor(() => {
        expect(result.current.data[0].title).toBe('Updated Title');
      });
    });

    it('should optimistically remove page on delete', async () => {
      const initialData = [
        {
          id: 'page-1',
          slug: 'page-1',
          title: 'Page 1',
          status: 'published' as const,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'page-2',
          slug: 'page-2',
          title: 'Page 2',
          status: 'draft' as const,
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

      const { result } = renderHook(() => useContentPages());

      await waitFor(() => {
        expect(result.current.data).toHaveLength(2);
      });

      const deleteResult = await result.current.remove('page-1');

      expect(deleteResult.success).toBe(true);
      
      await waitFor(() => {
        expect(result.current.data).toHaveLength(1);
      });
      
      expect(result.current.data[0].id).toBe('page-2');
    });

    it('should not update state on failed create', async () => {
      const initialData = [
        {
          id: 'page-1',
          slug: 'existing',
          title: 'Existing',
          status: 'published' as const,
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

      const { result } = renderHook(() => useContentPages());

      await waitFor(() => {
        expect(result.current.data).toEqual(initialData);
      });

      const createResult = await result.current.create({
        title: 'New Page',
      });

      expect(createResult.success).toBe(false);
      expect(createResult.error).toBe('Validation error');
      expect(result.current.data).toEqual(initialData);
    });
  });
});
