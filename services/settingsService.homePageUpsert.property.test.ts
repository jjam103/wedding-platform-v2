import * as fc from 'fast-check';
import { upsertHomePageConfig } from './settingsService';
import type { HomePageConfig } from '../schemas/settingsSchemas';

/**
 * Feature: admin-ux-enhancements, Property 2: Home Page Settings Upsert
 * 
 * **Validates: Requirements 2.1, 2.2**
 * 
 * For any home page configuration update, the API should successfully create or update 
 * settings without returning 500 errors, regardless of whether settings previously existed
 */

// Mock the supabase module
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Feature: admin-ux-enhancements, Property 2: Home Page Settings Upsert', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { supabase } = require('../lib/supabase');
    mockSupabase = supabase;
  });

  // Arbitrary for valid home page configuration
  const validHomePageConfigArbitrary = fc.record({
    title: fc.oneof(
      fc.constant(null),
      fc.string({ minLength: 1, maxLength: 200 })
    ),
    subtitle: fc.oneof(
      fc.constant(null),
      fc.string({ maxLength: 500 })
    ),
    welcomeMessage: fc.oneof(
      fc.constant(null),
      fc.string({ maxLength: 1000 })
    ),
    heroImageUrl: fc.oneof(
      fc.constant(null),
      fc.webUrl()
    ),
  });

  // Arbitrary for partial home page configuration (at least one field)
  const partialHomePageConfigArbitrary = fc.oneof(
    fc.record({ title: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 200 })) }),
    fc.record({ subtitle: fc.oneof(fc.constant(null), fc.string({ maxLength: 500 })) }),
    fc.record({ welcomeMessage: fc.oneof(fc.constant(null), fc.string({ maxLength: 1000 })) }),
    fc.record({ heroImageUrl: fc.oneof(fc.constant(null), fc.webUrl()) }),
    validHomePageConfigArbitrary
  );

  it('should successfully upsert any valid home page configuration', async () => {
    await fc.assert(
      fc.asyncProperty(validHomePageConfigArbitrary, async (config) => {
        // Mock successful upsert for all settings
        mockSupabase.from.mockReturnValue({
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'setting-1',
                  key: 'test_key',
                  value: 'test_value',
                  description: 'Test',
                  category: 'home_page',
                  is_public: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const result = await upsertHomePageConfig(config);

        // Property: Should always succeed with valid configuration
        expect(result.success).toBe(true);
        
        if (result.success) {
          // Property: Returned data should match input
          expect(result.data.title).toBe(config.title);
          expect(result.data.subtitle).toBe(config.subtitle);
          expect(result.data.welcomeMessage).toBe(config.welcomeMessage);
          expect(result.data.heroImageUrl).toBe(config.heroImageUrl);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should successfully upsert partial home page configuration', async () => {
    await fc.assert(
      fc.asyncProperty(partialHomePageConfigArbitrary, async (config) => {
        // Mock successful upsert
        mockSupabase.from.mockReturnValue({
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'setting-1',
                  key: 'test_key',
                  value: 'test_value',
                  description: 'Test',
                  category: 'home_page',
                  is_public: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const result = await upsertHomePageConfig(config);

        // Property: Should always succeed with partial configuration
        expect(result.success).toBe(true);
        
        if (result.success) {
          // Property: Only provided fields should be in result
          if (config.title !== undefined) {
            expect(result.data.title).toBe(config.title);
          }
          if (config.subtitle !== undefined) {
            expect(result.data.subtitle).toBe(config.subtitle);
          }
          if (config.welcomeMessage !== undefined) {
            expect(result.data.welcomeMessage).toBe(config.welcomeMessage);
          }
          if (config.heroImageUrl !== undefined) {
            expect(result.data.heroImageUrl).toBe(config.heroImageUrl);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should be idempotent - upserting same config multiple times produces same result', async () => {
    await fc.assert(
      fc.asyncProperty(validHomePageConfigArbitrary, async (config) => {
        // Mock successful upsert
        mockSupabase.from.mockReturnValue({
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'setting-1',
                  key: 'test_key',
                  value: 'test_value',
                  description: 'Test',
                  category: 'home_page',
                  is_public: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        // Upsert the same config twice
        const result1 = await upsertHomePageConfig(config);
        const result2 = await upsertHomePageConfig(config);

        // Property: Both operations should succeed
        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);

        // Property: Results should be identical
        if (result1.success && result2.success) {
          expect(result1.data).toEqual(result2.data);
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should reject invalid configurations with VALIDATION_ERROR', async () => {
    // Arbitrary for invalid configurations
    const invalidConfigArbitrary = fc.oneof(
      // Empty title (fails min(1) validation)
      fc.record({ title: fc.constant('') }),
      // Title too long (fails max(200) validation)
      fc.record({ title: fc.string({ minLength: 201, maxLength: 300 }) }),
      // Subtitle too long (fails max(500) validation)
      fc.record({ subtitle: fc.string({ minLength: 501, maxLength: 600 }) }),
      // Invalid URL
      fc.record({ heroImageUrl: fc.string().filter(s => !s.startsWith('http')) })
    );

    await fc.assert(
      fc.asyncProperty(invalidConfigArbitrary, async (config) => {
        const result = await upsertHomePageConfig(config as HomePageConfig);

        // Property: Invalid configurations should always fail validation
        expect(result.success).toBe(false);
        
        if (!result.success) {
          expect(result.error.code).toBe('VALIDATION_ERROR');
          expect(result.error.message).toBe('Invalid home page configuration');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle null values correctly without errors', async () => {
    const nullConfigArbitrary = fc.record({
      title: fc.constant(null),
      subtitle: fc.constant(null),
      welcomeMessage: fc.constant(null),
      heroImageUrl: fc.constant(null),
    });

    await fc.assert(
      fc.asyncProperty(nullConfigArbitrary, async (config) => {
        // Mock successful upsert
        mockSupabase.from.mockReturnValue({
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'setting-1',
                  key: 'test_key',
                  value: null,
                  description: 'Test',
                  category: 'home_page',
                  is_public: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const result = await upsertHomePageConfig(config);

        // Property: Null values should be accepted
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.title).toBeNull();
          expect(result.data.subtitle).toBeNull();
          expect(result.data.welcomeMessage).toBeNull();
          expect(result.data.heroImageUrl).toBeNull();
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should return DATABASE_ERROR when database operation fails, not 500 error', async () => {
    await fc.assert(
      fc.asyncProperty(validHomePageConfigArbitrary, async (config) => {
        // Mock database failure
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

        const result = await upsertHomePageConfig(config);

        // Property: Database errors should be handled gracefully
        expect(result.success).toBe(false);
        
        if (!result.success) {
          // Should return structured error, not throw 500
          expect(result.error.code).toBe('DATABASE_ERROR');
          expect(result.error.message).toBe('Failed to update some home page settings');
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should handle sequential updates correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        validHomePageConfigArbitrary,
        validHomePageConfigArbitrary,
        async (config1, config2) => {
          // Mock successful upsert
          mockSupabase.from.mockReturnValue({
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'setting-1',
                    key: 'test_key',
                    value: 'test_value',
                    description: 'Test',
                    category: 'home_page',
                    is_public: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          });

          // Update with first config
          const result1 = await upsertHomePageConfig(config1);
          
          // Update with second config
          const result2 = await upsertHomePageConfig(config2);

          // Property: Both operations should succeed
          expect(result1.success).toBe(true);
          expect(result2.success).toBe(true);

          // Property: Second result should reflect second config
          if (result2.success) {
            expect(result2.data.title).toBe(config2.title);
            expect(result2.data.subtitle).toBe(config2.subtitle);
            expect(result2.data.welcomeMessage).toBe(config2.welcomeMessage);
            expect(result2.data.heroImageUrl).toBe(config2.heroImageUrl);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
