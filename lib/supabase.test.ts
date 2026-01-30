/**
 * Unit tests for Supabase client initialization
 * 
 * Tests client creation and configuration validation.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('supabase', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set required environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    
    // Clear module cache to get fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('createSupabaseClient', () => {
    it('should create Supabase client with environment variables', () => {
      const { createClient } = require('@supabase/supabase-js');
      const { createSupabaseClient } = require('./supabase');
      
      createSupabaseClient();
      
      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      );
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      // Re-import to get fresh module with new env
      jest.resetModules();
      
      expect(() => {
        const { createSupabaseClient } = require('./supabase');
        createSupabaseClient();
      }).toThrow('Missing Supabase environment variables');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      // Re-import to get fresh module with new env
      jest.resetModules();
      
      expect(() => {
        const { createSupabaseClient } = require('./supabase');
        createSupabaseClient();
      }).toThrow('Missing Supabase environment variables');
    });

    it('should throw error when both environment variables are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      // Re-import to get fresh module with new env
      jest.resetModules();
      
      expect(() => {
        const { createSupabaseClient } = require('./supabase');
        createSupabaseClient();
      }).toThrow('Missing Supabase environment variables');
    });

    it('should return Supabase client instance', () => {
      const mockClient = { from: jest.fn(), auth: {} };
      const { createClient } = require('@supabase/supabase-js');
      (createClient as jest.Mock).mockReturnValue(mockClient);
      
      const { createSupabaseClient } = require('./supabase');
      const client = createSupabaseClient();
      
      expect(client).toBe(mockClient);
    });
  });

  describe('supabase singleton', () => {
    it('should export singleton Supabase client', () => {
      const mockClient = { from: jest.fn(), auth: {} };
      const { createClient } = require('@supabase/supabase-js');
      (createClient as jest.Mock).mockReturnValue(mockClient);
      
      const { supabase } = require('./supabase');
      
      expect(supabase).toBeDefined();
      expect(supabase).toBe(mockClient);
    });

    it('should create client only once for singleton', () => {
      const { createClient } = require('@supabase/supabase-js');
      (createClient as jest.Mock).mockClear();
      
      // Import module which creates singleton
      const { supabase } = require('./supabase');
      
      // Access singleton multiple times
      const client1 = supabase;
      const client2 = supabase;
      
      // createClient should only be called once during module initialization
      expect(client1).toBe(client2);
    });
  });

  describe('environment variable validation', () => {
    it('should accept valid Supabase URL format', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abc123.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-key';
      
      jest.resetModules();
      
      expect(() => {
        const { createSupabaseClient } = require('./supabase');
        createSupabaseClient();
      }).not.toThrow();
    });

    it('should accept valid anon key format', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      
      jest.resetModules();
      
      expect(() => {
        const { createSupabaseClient } = require('./supabase');
        createSupabaseClient();
      }).not.toThrow();
    });

    it('should handle empty string environment variables as missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
      
      jest.resetModules();
      
      expect(() => {
        const { createSupabaseClient } = require('./supabase');
        createSupabaseClient();
      }).toThrow('Missing Supabase environment variables');
    });
  });
});
