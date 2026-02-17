import {
  getSettings,
  upsertSettings,
  updateDisplayMode,
  updatePhotoOrder,
  configureGallery,
  deleteSettings,
} from './gallerySettingsService';
import { createMockSupabaseClient } from '../__tests__/helpers/mockSupabase';

// Mock the supabase lib at the module level
const mockSupabase = createMockSupabaseClient();
jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('gallerySettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return success with gallery settings when settings exist', async () => {
      const mockSettings = {
        id: 'settings-123',
        page_type: 'activity',
        page_id: 'activity-456',
        display_mode: 'gallery',
        show_captions: true,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSettings,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await getSettings('activity', 'activity-456');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockSettings);
      }
    });

    it('should return success with default settings when no settings found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }, // No rows found
              }),
            }),
          }),
        }),
      });

      const result = await getSettings('event', 'event-789');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page_type).toBe('event');
        expect(result.data.page_id).toBe('event-789');
        expect(result.data.display_mode).toBe('gallery');
        expect(result.data.show_captions).toBe(true);
        expect(result.data.id).toBe('');
      }
    });

    it('should return DATABASE_ERROR when query fails with other error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'OTHER_ERROR', message: 'Database error' },
              }),
            }),
          }),
        }),
      });

      const result = await getSettings('accommodation', 'accommodation-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await getSettings('room_type', 'room-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('upsertSettings', () => {
    it('should return success with created settings when valid data provided', async () => {
      const validData = {
        page_type: 'activity' as const,
        page_id: 'activity-456',
        display_mode: 'carousel' as const,
        photos_per_row: 3,
        show_captions: false,
        autoplay_interval: 5000,
        transition_effect: 'fade',
      };

      const mockCreatedSettings = {
        id: 'settings-123',
        ...validData,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedSettings,
              error: null,
            }),
          }),
        }),
      });

      const result = await upsertSettings(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockCreatedSettings);
      }
    });

    it('should return VALIDATION_ERROR when invalid data provided', async () => {
      const invalidData = {
        page_type: 'invalid' as any,
        page_id: '',
        display_mode: 'invalid' as any,
        show_captions: true,
      };

      const result = await upsertSettings(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when upsert fails', async () => {
      const validData = {
        page_type: 'activity' as const,
        page_id: 'activity-456',
        display_mode: 'gallery' as const,
        show_captions: true,
      };

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Upsert failed' },
            }),
          }),
        }),
      });

      const result = await upsertSettings(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      const validData = {
        page_type: 'activity' as const,
        page_id: 'activity-456',
        display_mode: 'gallery' as const,
        show_captions: true,
      };

      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await upsertSettings(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('updateDisplayMode', () => {
    it('should return success when display mode updated successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const result = await updateDisplayMode('page-123', 'carousel');

      expect(result.success).toBe(true);
    });

    it('should return DATABASE_ERROR when update fails', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        }),
      });

      const result = await updateDisplayMode('page-123', 'loop');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await updateDisplayMode('page-123', 'gallery');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('updatePhotoOrder', () => {
    it('should return success when photo order updated successfully', async () => {
      const photoIds = ['photo-1', 'photo-2', 'photo-3'];

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      const result = await updatePhotoOrder('page-123', photoIds);

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('photos');
    });

    it('should return DATABASE_ERROR when some updates fail', async () => {
      const photoIds = ['photo-1', 'photo-2'];

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn()
              .mockResolvedValueOnce({ error: null })
              .mockResolvedValueOnce({ error: { message: 'Update failed' } }),
          }),
        }),
      });

      const result = await updatePhotoOrder('page-123', photoIds);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await updatePhotoOrder('page-123', ['photo-1']);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('configureGallery', () => {
    it('should return success when gallery configured successfully', async () => {
      const options = {
        photos_per_row: 4,
        show_captions: true,
        autoplay_interval: 3000,
        transition_effect: 'slide',
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const result = await configureGallery('page-123', options);

      expect(result.success).toBe(true);
    });

    it('should return VALIDATION_ERROR when invalid options provided', async () => {
      const invalidOptions = {
        photos_per_row: -1, // Invalid: negative number
        show_captions: 'invalid' as any, // Invalid: not boolean
      };

      const result = await configureGallery('page-123', invalidOptions);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when update fails', async () => {
      const options = {
        photos_per_row: 3,
        show_captions: false,
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        }),
      });

      const result = await configureGallery('page-123', options);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await configureGallery('page-123', {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('deleteSettings', () => {
    it('should return success when settings deleted successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const result = await deleteSettings('page-123');

      expect(result.success).toBe(true);
    });

    it('should return DATABASE_ERROR when delete fails', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      });

      const result = await deleteSettings('page-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await deleteSettings('page-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });
});