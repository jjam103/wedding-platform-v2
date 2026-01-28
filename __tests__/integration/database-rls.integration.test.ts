/**
 * Database RLS Policy Integration Tests
 * 
 * Tests that RLS policies don't have infinite recursion and work correctly.
 * These tests use the real Supabase instance to verify database-level behavior.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('Database RLS Policies', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  });

  describe('guests table', () => {
    it('should query guests without infinite recursion', async () => {
      const { data, error } = await supabase.from('guests').select('count');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should query guests with filters without infinite recursion', async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .limit(10);
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('groups table', () => {
    it('should query groups without infinite recursion', async () => {
      const { data, error } = await supabase.from('groups').select('count');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should query groups with select without infinite recursion', async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .limit(10);
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('group_members table', () => {
    it('should query group_members without infinite recursion', async () => {
      const { data, error } = await supabase.from('group_members').select('count');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('activities table', () => {
    it('should query activities without infinite recursion', async () => {
      const { data, error } = await supabase.from('activities').select('count');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('events table', () => {
    it('should query events without infinite recursion', async () => {
      const { data, error } = await supabase.from('events').select('count');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });
});
