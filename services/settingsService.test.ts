import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { UpdateSystemSettingsDTO } from '@/schemas/settingsSchemas';

// Mock Supabase lib
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Import after mocking
import * as settingsService from './settingsService';

describe('settingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return success with settings data when settings exist', async () => {
      const mockSettings = {
        id: 'settings-1',
        wedding_date: '2024-06-15T00:00:00Z',
        venue_name: 'Dreams Las Mareas',
        couple_name_1: 'John',
        couple_name_2: 'Jane',
        timezone: 'America/Costa_Rica',
        send_rsvp_confirmations: true,
        send_activity_reminders: true,
        send_deadline_reminders: true,
        reminder_days_before: 7,
        require_photo_moderation: true,
        max_photos_per_guest: 20,
        allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
        home_page_title: 'Welcome to Our Wedding',
        home_page_subtitle: 'Join us in Costa Rica',
        home_page_welcome_message: 'We are excited to celebrate with you!',
        home_page_hero_image_url: 'https://example.com/hero.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockSettings,
        error: null,
      });

      const result = await settingsService.getSettings();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('settings-1');
        expect(result.data.wedding_date).toBe('2024-06-15T00:00:00Z');
        expect(result.data.venue_name).toBe('Dreams Las Mareas');
        expect(result.data.couple_name_1).toBe('John');
        expect(result.data.couple_name_2).toBe('Jane');
      }
    });

    it('should return success with default settings when no settings exist', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows found
      });

      const result = await settingsService.getSettings();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('');
        expect(result.data.wedding_date).toBeNull();
        expect(result.data.venue_name).toBeNull();
        expect(result.data.timezone).toBe('America/Costa_Rica');
        expect(result.data.send_rsvp_confirmations).toBe(true);
        expect(result.data.require_photo_moderation).toBe(true);
        expect(result.data.max_photos_per_guest).toBe(20);
        expect(result.data.allowed_photo_formats).toEqual(['jpg', 'jpeg', 'png', 'heic']);
      }
    });

    it('should return DATABASE_ERROR when database query fails', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed', code: 'CONNECTION_ERROR' },
      });

      const result = await settingsService.getSettings();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Connection failed');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      mockSupabase.single.mockRejectedValue(new Error('Unexpected error'));

      const result = await settingsService.getSettings();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('Unexpected error');
      }
    });
  });

  describe('updateSettings', () => {
    const validUpdateData: UpdateSystemSettingsDTO = {
      wedding_date: '2024-06-15T00:00:00Z',
      venue_name: 'Dreams Las Mareas',
      couple_name_1: 'John',
      couple_name_2: 'Jane',
      timezone: 'America/Costa_Rica',
      send_rsvp_confirmations: true,
      reminder_days_before: 7,
    };

    it('should return success with updated settings when updating existing settings', async () => {
      const existingSettings = { id: 'settings-1' };
      const updatedSettings = {
        id: 'settings-1',
        ...validUpdateData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      // Mock check for existing settings
      mockSupabase.single.mockResolvedValueOnce({
        data: existingSettings,
        error: null,
      });

      // Mock update operation
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedSettings,
        error: null,
      });

      const result = await settingsService.updateSettings(validUpdateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('settings-1');
        expect(result.data.wedding_date).toBe('2024-06-15T00:00:00Z');
        expect(result.data.venue_name).toBe('Dreams Las Mareas');
      }

      expect(mockSupabase.update).toHaveBeenCalledWith(validUpdateData);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'settings-1');
    });

    it('should return success with created settings when no existing settings', async () => {
      const createdSettings = {
        id: 'settings-1',
        ...validUpdateData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock check for existing settings (none found)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock insert operation
      mockSupabase.single.mockResolvedValueOnce({
        data: createdSettings,
        error: null,
      });

      const result = await settingsService.updateSettings(validUpdateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('settings-1');
        expect(result.data.wedding_date).toBe('2024-06-15T00:00:00Z');
      }

      expect(mockSupabase.insert).toHaveBeenCalledWith(validUpdateData);
    });

    it('should return VALIDATION_ERROR when wedding_date format is invalid', async () => {
      const invalidData = { ...validUpdateData, wedding_date: 'invalid-date' };
      
      const result = await settingsService.updateSettings(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.details).toBeDefined();
      }
    });

    it('should return VALIDATION_ERROR when reminder_days_before is negative', async () => {
      const invalidData = { ...validUpdateData, reminder_days_before: -1 };
      
      const result = await settingsService.updateSettings(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when max_photos_per_guest exceeds limit', async () => {
      const invalidData = { ...validUpdateData, max_photos_per_guest: 101 };
      
      const result = await settingsService.updateSettings(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when update operation fails', async () => {
      const existingSettings = { id: 'settings-1' };

      // Mock check for existing settings
      mockSupabase.single.mockResolvedValueOnce({
        data: existingSettings,
        error: null,
      });

      // Mock update operation failure
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await settingsService.updateSettings(validUpdateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Update failed');
      }
    });

    it('should return DATABASE_ERROR when insert operation fails', async () => {
      // Mock check for existing settings (none found)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock insert operation failure
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insert failed' },
      });

      const result = await settingsService.updateSettings(validUpdateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Insert failed');
      }
    });

    it('should handle partial updates correctly', async () => {
      const partialUpdateData = {
        venue_name: 'New Venue Name',
        send_rsvp_confirmations: false,
      };

      const existingSettings = { id: 'settings-1' };
      const updatedSettings = {
        id: 'settings-1',
        venue_name: 'New Venue Name',
        send_rsvp_confirmations: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      // Mock check for existing settings
      mockSupabase.single.mockResolvedValueOnce({
        data: existingSettings,
        error: null,
      });

      // Mock update operation
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedSettings,
        error: null,
      });

      const result = await settingsService.updateSettings(partialUpdateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.venue_name).toBe('New Venue Name');
        expect(result.data.send_rsvp_confirmations).toBe(false);
      }

      expect(mockSupabase.update).toHaveBeenCalledWith(partialUpdateData);
    });

    it('should handle empty update data correctly', async () => {
      const emptyUpdateData = {};

      const existingSettings = { id: 'settings-1' };
      const unchangedSettings = {
        id: 'settings-1',
        wedding_date: '2024-06-15T00:00:00Z',
        venue_name: 'Dreams Las Mareas',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock check for existing settings
      mockSupabase.single.mockResolvedValueOnce({
        data: existingSettings,
        error: null,
      });

      // Mock update operation
      mockSupabase.single.mockResolvedValueOnce({
        data: unchangedSettings,
        error: null,
      });

      const result = await settingsService.updateSettings(emptyUpdateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('settings-1');
      }

      expect(mockSupabase.update).toHaveBeenCalledWith(emptyUpdateData);
    });
  });
});