/**
 * Unit tests for auth method configuration in settingsService
 * 
 * Tests:
 * - getDefaultAuthMethod
 * - updateDefaultAuthMethod
 * - Bulk guest updates
 */

import * as settingsService from './settingsService';

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

describe('settingsService - Auth Method Configuration', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { supabase } = require('../lib/supabase');
    mockSupabase = supabase;
  });

  describe('getDefaultAuthMethod', () => {
    it('should return email_matching when setting exists', async () => {
      // Mock getSetting to return email_matching
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { value: 'email_matching' },
              error: null,
            }),
          }),
        }),
      });

      const result = await settingsService.getDefaultAuthMethod();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('email_matching');
      }
    });

    it('should return magic_link when setting exists', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { value: 'magic_link' },
              error: null,
            }),
          }),
        }),
      });

      const result = await settingsService.getDefaultAuthMethod();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('magic_link');
      }
    });

    it('should return email_matching as default when setting not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await settingsService.getDefaultAuthMethod();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('email_matching');
      }
    });

    it('should return VALIDATION_ERROR for invalid auth method value', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { value: 'invalid_method' },
              error: null,
            }),
          }),
        }),
      });

      const result = await settingsService.getDefaultAuthMethod();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Invalid auth method value');
      }
    });

    it('should return DATABASE_ERROR when database query fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST000', message: 'Database error' },
            }),
          }),
        }),
      });

      const result = await settingsService.getDefaultAuthMethod();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('updateDefaultAuthMethod', () => {
    it('should update default auth method to email_matching without updating guests', async () => {
      // Mock upsert for setting
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                key: 'default_auth_method',
                value: 'email_matching',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await settingsService.updateDefaultAuthMethod('email_matching', false);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedGuestsCount).toBe(0);
      }
    });

    it('should update default auth method to magic_link without updating guests', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                key: 'default_auth_method',
                value: 'magic_link',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await settingsService.updateDefaultAuthMethod('magic_link', false);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedGuestsCount).toBe(0);
      }
    });

    it('should update default auth method and bulk update existing guests', async () => {
      // Mock upsert for setting
      const mockFrom = jest.fn();
      mockSupabase.from = mockFrom;

      // First call: upsert setting
      mockFrom.mockReturnValueOnce({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                key: 'default_auth_method',
                value: 'magic_link',
              },
              error: null,
            }),
          }),
        }),
      });

      // Second call: update guests
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{ id: '1' }, { id: '2' }, { id: '3' }],
              error: null,
            }),
          }),
        }),
      });

      const result = await settingsService.updateDefaultAuthMethod('magic_link', true);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedGuestsCount).toBe(3);
      }
    });

    it('should return VALIDATION_ERROR for invalid auth method', async () => {
      const result = await settingsService.updateDefaultAuthMethod(
        'invalid_method' as any,
        false
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Invalid auth method');
      }
    });

    it('should return DATABASE_ERROR when setting update fails', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const result = await settingsService.updateDefaultAuthMethod('email_matching', false);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return DATABASE_ERROR when guest bulk update fails', async () => {
      const mockFrom = jest.fn();
      mockSupabase.from = mockFrom;

      // First call: upsert setting (success)
      mockFrom.mockReturnValueOnce({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                key: 'default_auth_method',
                value: 'magic_link',
              },
              error: null,
            }),
          }),
        }),
      });

      // Second call: update guests (failure)
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Failed to update guests' },
            }),
          }),
        }),
      });

      const result = await settingsService.updateDefaultAuthMethod('magic_link', true);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toContain('Failed to update existing guests');
      }
    });

    it('should handle zero guests needing update', async () => {
      const mockFrom = jest.fn();
      mockSupabase.from = mockFrom;

      // First call: upsert setting
      mockFrom.mockReturnValueOnce({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                key: 'default_auth_method',
                value: 'email_matching',
              },
              error: null,
            }),
          }),
        }),
      });

      // Second call: update guests (no guests to update)
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await settingsService.updateDefaultAuthMethod('email_matching', true);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedGuestsCount).toBe(0);
      }
    });
  });
});
