import { renderHook, waitFor } from '@testing-library/react';
import { useSections } from './useSections';

// Mock fetch globally
global.fetch = jest.fn();

describe('useSections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loading states', () => {
    it('should start with loading true when pageType and pageId provided', () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() =>
        useSections({ pageType: 'custom', pageId: 'page-1' })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should not fetch when pageType or pageId is missing', async () => {
      const { result } = renderHook(() =>
        useSections({ pageType: '', pageId: '' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.data).toEqual([]);
    });

    it('should set loading false after successful fetch', async () => {
      const mockData = [
        {
          id: 'section-1',
          pageType: 'custom' as const,
          pageId: 'page-1',
          displayOrder: 1,
          layout: 'two-column' as const,
          columns: [],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      });

      const { result } = renderHook(() =>
        useSections({ pageType: 'custom', pageId: 'page-1' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useSections({ pageType: 'custom', pageId: 'page-1' })
      );

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.loading).toBe(false);
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
        useSections({ pageType: 'custom', pageId: 'page-1' })
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
          id: 'section-1',
          pageType: 'custom' as const,
          pageId: 'page-1',
          displayOrder: 1,
          layout: 'one-column' as const,
          columns: [],
        },
      ];

      const updatedData = [
        ...initialData,
        {
          id: 'section-2',
          pageType: 'custom' as const,
          pageId: 'page-1',
          displayOrder: 2,
          layout: 'two-column' as const,
          columns: [],
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
        useSections({ pageType: 'custom', pageId: 'page-1' })
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
        useSections({ pageType: 'custom', pageId: 'page-1' })
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
    it('should optimistically add new section on create', async () => {
      const existingData = [
        {
          id: 'section-1',
          pageType: 'custom' as const,
          pageId: 'page-1',
          displayOrder: 1,
          layout: 'one-column' as const,
          columns: [],
        },
      ];

      const newSection = {
        id: 'section-2',
        pageType: 'custom' as const,
        pageId: 'page-1',
        displayOrder: 2,
        layout: 'two-column' as const,
        columns: [],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: existingData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: newSection }),
        });

      const { result } = renderHook(() =>
        useSections({ pageType: 'custom', pageId: 'page-1' })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(existingData);
      });

      const createResult = await result.current.create({
        layout: 'two-column',
        displayOrder: 2,
      });

      expect(createResult.success).toBe(true);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[1]).toEqual(newSection);
    });

    it('should sort sections by displayOrder after create', async () => {
      const existingData = [
        {
          id: 'section-2',
          pageType: 'custom' as const,
          pageId: 'page-1',
          displayOrder: 2,
          layout: 'one-column' as const,
          columns: [],
        },
      ];

      const newSection = {
        id: 'section-1',
        pageType: 'custom' as const,
        pageId: 'page-1',
        displayOrder: 1,
        layout: 'two-column' as const,
        columns: [],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: existingData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: newSection }),
        });

      const { result } = renderHook(() =>
        useSections({ pageType: 'custom', pageId: 'page-1' })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(existingData);
      });

      await result.current.create({
        layout: 'two-column',
        displayOrder: 1,
      });

      expect(result.current.data[0].displayOrder).toBe(1);
      expect(result.current.data[1].displayOrder).toBe(2);
    });

    it('should optimistically update existing section', async () => {
      const initialData = [
        {
          id: 'section-1',
          pageType: 'custom' as const,
          pageId: 'page-1',
          displayOrder: 1,
          layout: 'one-column' as const,
          columns: [],
        },
      ];

      const updatedSection = {
        ...initialData[0],
        layout: 'two-column' as const,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: initialData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: updatedSection }),
        });

      const { result } = renderHook(() =>
        useSections({ pageType: 'custom', pageId: 'page-1' })
      );

      await waitFor(() => {
        expect(result.current.data[0].layout).toBe('one-column');
      });

      const updateResult = await result.current.update('section-1', {
        layout: 'two-column',
      });

      expect(updateResult.success).toBe(true);
      expect(result.current.data[0].layout).toBe('two-column');
    });

    it('should optimistically remove section on delete', async () => {
      const initialData = [
        {
          id: 'section-1',
          pageType: 'custom' as const,
          pageId: 'page-1',
          displayOrder: 1,
          layout: 'one-column' as const,
          columns: [],
        },
        {
          id: 'section-2',
          pageType: 'custom' as const,
          pageId: 'page-1',
          displayOrder: 2,
          layout: 'two-column' as const,
          columns: [],
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
        useSections({ pageType: 'custom', pageId: 'page-1' })
      );

      await waitFor(() => {
        expect(result.current.data).toHaveLength(2);
      });

      const deleteResult = await result.current.remove('section-1');

      expect(deleteResult.success).toBe(true);
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].id).toBe('section-2');
    });

    it('should optimistically reorder sections', async () => {
      const initialData = [
        {
          id: 'section-1',
          pageType: 'custom' as const,
          pageId: 'page-1',
          displayOrder: 1,
          layout: 'one-column' as const,
          columns: [],
        },
        {
          id: 'section-2',
          pageType: 'custom' as const,
          pageId: 'page-1',
          displayOrder: 2,
          layout: 'two-column' as const,
          columns: [],
        },
        {
          id: 'section-3',
          pageType: 'custom' as const,
          pageId: 'page-1',
          displayOrder: 3,
          layout: 'one-column' as const,
          columns: [],
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
        useSections({ pageType: 'custom', pageId: 'page-1' })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(initialData);
      });

      const reorderResult = await result.current.reorder([
        'section-3',
        'section-1',
        'section-2',
      ]);

      expect(reorderResult.success).toBe(true);
      expect(result.current.data[0].id).toBe('section-3');
      expect(result.current.data[1].id).toBe('section-1');
      expect(result.current.data[2].id).toBe('section-2');
    });
  });
});
