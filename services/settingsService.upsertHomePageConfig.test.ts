import { upsertSetting, upsertHomePageConfig } from './settingsService';
import type { HomePageConfig } from '../schemas/settingsSchemas';

// Mock the supabase module
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('settingsService.upsertSetting', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { supabase } = require('../lib/supabase');
    mockSupabase = supabase;
  });

  it('should successfully upsert a setting', async () => {
    const mockSetting = {
      id: 'setting-1',
      key: 'test_key',
      value: 'test_value',
      description: 'Test setting',
      category: 'general',
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockSetting,
            error: null,
          }),
        }),
      }),
    });

    const result = await upsertSetting('test_key', 'test_value', 'Test setting', 'general', false);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.key).toBe('test_key');
      expect(result.data.value).toBe('test_value');
    }
    expect(mockSupabase.from).toHaveBeenCalledWith('system_settings');
  });

  it('should return DATABASE_ERROR when upsert fails', async () => {
    mockSupabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
          }),
        }),
      }),
    });

    const result = await upsertSetting('test_key', 'test_value');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
      expect(result.error.message).toBe('Database connection failed');
    }
  });

  it('should handle unexpected errors', async () => {
    mockSupabase.from.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const result = await upsertSetting('test_key', 'test_value');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('UNKNOWN_ERROR');
      expect(result.error.message).toBe('Unexpected error');
    }
  });
});

describe('settingsService.upsertHomePageConfig', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { supabase } = require('../lib/supabase');
    mockSupabase = supabase;
  });

  it('should successfully upsert home page configuration', async () => {
    const config: HomePageConfig = {
      title: 'Welcome to Our Wedding',
      subtitle: 'Join us in Costa Rica',
      welcomeMessage: '<p>We are excited to celebrate with you!</p>',
      heroImageUrl: 'https://example.com/hero.jpg',
    };

    const mockSetting = {
      id: 'setting-1',
      key: 'home_page_title',
      value: config.title,
      description: 'Home page title',
      category: 'home_page',
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockSetting,
            error: null,
          }),
        }),
      }),
    });

    const result = await upsertHomePageConfig(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe(config.title);
      expect(result.data.subtitle).toBe(config.subtitle);
      expect(result.data.welcomeMessage).toBe(config.welcomeMessage);
      expect(result.data.heroImageUrl).toBe(config.heroImageUrl);
    }
    // Should call upsert 4 times (once for each setting)
    expect(mockSupabase.from).toHaveBeenCalledTimes(4);
  });

  it('should successfully upsert partial home page configuration', async () => {
    const config: HomePageConfig = {
      title: 'New Title',
    };

    const mockSetting = {
      id: 'setting-1',
      key: 'home_page_title',
      value: config.title,
      description: 'Home page title',
      category: 'home_page',
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockSetting,
            error: null,
          }),
        }),
      }),
    });

    const result = await upsertHomePageConfig(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe(config.title);
    }
    // Should only call upsert once (only title provided)
    expect(mockSupabase.from).toHaveBeenCalledTimes(1);
  });

  it('should return VALIDATION_ERROR for invalid configuration', async () => {
    const invalidConfig = {
      title: '', // Empty string should fail min(1) validation
      heroImageUrl: 'not-a-valid-url', // Invalid URL
    } as HomePageConfig;

    const result = await upsertHomePageConfig(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('Invalid home page configuration');
      expect(result.error.details).toBeDefined();
    }
  });

  it('should return DATABASE_ERROR when one setting fails to upsert', async () => {
    const config: HomePageConfig = {
      title: 'Welcome',
      subtitle: 'Join us',
    };

    let callCount = 0;
    mockSupabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              // First call succeeds
              return Promise.resolve({
                data: {
                  id: 'setting-1',
                  key: 'home_page_title',
                  value: config.title,
                  description: 'Home page title',
                  category: 'home_page',
                  is_public: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              });
            } else {
              // Second call fails
              return Promise.resolve({
                data: null,
                error: { message: 'Database error', code: 'DB_ERROR' },
              });
            }
          }),
        }),
      }),
    });

    const result = await upsertHomePageConfig(config);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
      expect(result.error.message).toBe('Failed to update some home page settings');
    }
  });

  it('should handle null values correctly', async () => {
    const config: HomePageConfig = {
      title: null,
      subtitle: null,
      welcomeMessage: null,
      heroImageUrl: null,
    };

    const mockSetting = {
      id: 'setting-1',
      key: 'home_page_title',
      value: null,
      description: 'Home page title',
      category: 'home_page',
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockSetting,
            error: null,
          }),
        }),
      }),
    });

    const result = await upsertHomePageConfig(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBeNull();
      expect(result.data.subtitle).toBeNull();
      expect(result.data.welcomeMessage).toBeNull();
      expect(result.data.heroImageUrl).toBeNull();
    }
  });

  it('should handle unexpected errors', async () => {
    const config: HomePageConfig = {
      title: 'Test',
    };

    mockSupabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockImplementation(() => {
            throw new Error('Unexpected database error');
          }),
        }),
      }),
    });

    const result = await upsertHomePageConfig(config);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
      expect(result.error.message).toBe('Failed to update some home page settings');
    }
  });
});
