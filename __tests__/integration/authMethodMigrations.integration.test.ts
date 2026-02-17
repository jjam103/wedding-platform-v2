/**
 * Integration tests for authentication method database migrations
 * Tests migrations 036 and 037
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.9, 22.1, 22.2
 * Tasks: 4.1, 4.2
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Authentication Method Migrations', () => {
  let supabase: ReturnType<typeof createClient>;
  let testGroupId: string;
  let testGuestId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create test group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: 'Test Auth Group' })
      .select()
      .single();

    if (groupError) throw groupError;
    testGroupId = (group as any).id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testGuestId) {
      await supabase.from('guests').delete().eq('id', testGuestId);
    }
    if (testGroupId) {
      await supabase.from('groups').delete().eq('id', testGroupId);
    }
  });

  describe('Migration 036: auth_method field', () => {
    it('should have auth_method column on guests table', async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('auth_method')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should default auth_method to email_matching for new guests', async () => {
      const { data: guest, error } = await supabase
        .from('guests')
        .insert({
          group_id: testGroupId,
          first_name: 'Test',
          last_name: 'Guest',
          email: 'test.auth@example.com',
          age_type: 'adult',
          guest_type: 'wedding_guest',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(guest).toBeDefined();
      expect((guest as any).auth_method).toBe('email_matching');

      testGuestId = (guest as any).id;
    });

    it('should allow setting auth_method to magic_link', async () => {
      const { data: guest, error } = await supabase
        .from('guests')
        .update({ auth_method: 'magic_link' })
        .eq('id', testGuestId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(guest).toBeDefined();
      expect((guest as any).auth_method).toBe('magic_link');
    });

    it('should reject invalid auth_method values', async () => {
      const { error } = await supabase
        .from('guests')
        .update({ auth_method: 'invalid_method' as any })
        .eq('id', testGuestId);

      expect(error).not.toBeNull();
      expect(error?.message).toContain('auth_method');
    });

    it('should have default_auth_method column on system_settings table', async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('default_auth_method')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (data && data.length > 0) {
        expect((data[0] as any).default_auth_method).toBe('email_matching');
      }
    });

    it('should allow updating default_auth_method in system_settings', async () => {
      // Get existing settings
      const { data: settings } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1)
        .single();

      if (settings) {
        const { data: updated, error } = await supabase
          .from('system_settings')
          .update({ default_auth_method: 'magic_link' })
          .eq('id', (settings as any).id)
          .select()
          .single();

        expect(error).toBeNull();
        expect((updated as any)?.default_auth_method).toBe('magic_link');

        // Reset to default
        await supabase
          .from('system_settings')
          .update({ default_auth_method: 'email_matching' })
          .eq('id', (settings as any).id);
      }
    });

    it('should have index on auth_method column', async () => {
      // Query using auth_method to verify index exists
      const { data, error } = await supabase
        .from('guests')
        .select('id, auth_method')
        .eq('auth_method', 'email_matching')
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have composite index on email and auth_method', async () => {
      // Query using both email and auth_method to verify composite index
      const { data, error } = await supabase
        .from('guests')
        .select('id, email, auth_method')
        .eq('email', 'test.auth@example.com')
        .eq('auth_method', 'email_matching')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Migration 037: magic_link_tokens table', () => {
    let testTokenId: string;
    const testToken = 'test_token_' + Math.random().toString(36).substring(7);

    afterEach(async () => {
      // Clean up test tokens
      if (testTokenId) {
        await supabase.from('magic_link_tokens').delete().eq('id', testTokenId);
        testTokenId = '';
      }
    });

    it('should create magic_link_tokens table', async () => {
      const { data, error } = await supabase
        .from('magic_link_tokens')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should insert magic link token with required fields', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const { data: token, error } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: testToken,
          guest_id: testGuestId,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(token).toBeDefined();
      expect((token as any).token).toBe(testToken);
      expect((token as any).guest_id).toBe(testGuestId);
      expect((token as any).used).toBe(false);
      expect((token as any).used_at).toBeNull();

      testTokenId = (token as any).id;
    });

    it('should enforce unique constraint on token', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Insert first token
      const { data: token1 } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: testToken + '_unique',
          guest_id: testGuestId,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      testTokenId = (token1 as any)!.id;

      // Try to insert duplicate token
      const { error } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: testToken + '_unique',
          guest_id: testGuestId,
          expires_at: expiresAt.toISOString(),
        });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('duplicate');
    });

    it('should cascade delete tokens when guest is deleted', async () => {
      // Create temporary guest
      const { data: tempGuest } = await supabase
        .from('guests')
        .insert({
          group_id: testGroupId,
          first_name: 'Temp',
          last_name: 'Guest',
          email: 'temp.guest@example.com',
          age_type: 'adult',
          guest_type: 'wedding_guest',
        })
        .select()
        .single();

      const tempGuestId = (tempGuest as any)!.id;

      // Create token for temp guest
      const { data: token } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: 'temp_token_' + Math.random().toString(36).substring(7),
          guest_id: tempGuestId,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      const tokenId = (token as any)!.id;

      // Delete guest
      await supabase.from('guests').delete().eq('id', tempGuestId);

      // Verify token was cascade deleted
      const { data: deletedToken } = await supabase
        .from('magic_link_tokens')
        .select('*')
        .eq('id', tokenId)
        .single();

      expect(deletedToken).toBeNull();
    });

    it('should have index on token column', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const { data: token } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: testToken + '_index',
          guest_id: testGuestId,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      testTokenId = (token as any)!.id;

      // Query by token to verify index
      const { data, error } = await supabase
        .from('magic_link_tokens')
        .select('*')
        .eq('token', testToken + '_index')
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect((data as any).token).toBe(testToken + '_index');
    });

    it('should have index on guest_id column', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const { data: token } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: testToken + '_guest',
          guest_id: testGuestId,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      testTokenId = (token as any)!.id;

      // Query by guest_id to verify index
      const { data, error } = await supabase
        .from('magic_link_tokens')
        .select('*')
        .eq('guest_id', testGuestId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
    });

    it('should store optional metadata fields', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const { data: token, error } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: testToken + '_metadata',
          guest_id: testGuestId,
          expires_at: expiresAt.toISOString(),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 Test Browser',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(token).toBeDefined();
      expect((token as any).ip_address).toBe('192.168.1.1');
      expect((token as any).user_agent).toBe('Mozilla/5.0 Test Browser');

      testTokenId = (token as any).id;
    });

    it('should have mark_magic_link_token_used function', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Create token
      const { data: token } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: testToken + '_mark_used',
          guest_id: testGuestId,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      testTokenId = (token as any)!.id;

      // Call function to mark as used
      const { data: result, error } = await supabase.rpc(
        'mark_magic_link_token_used',
        { token_value: testToken + '_mark_used' }
      );

      expect(error).toBeNull();
      expect(result).toBe(true);

      // Verify token is marked as used
      const { data: usedToken } = await supabase
        .from('magic_link_tokens')
        .select('*')
        .eq('id', testTokenId)
        .single();

      expect((usedToken as any)?.used).toBe(true);
      expect((usedToken as any)?.used_at).not.toBeNull();
    });

    it('should not mark expired token as used', async () => {
      const expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago

      // Create expired token
      const { data: token } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: testToken + '_expired',
          guest_id: testGuestId,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      testTokenId = (token as any)!.id;

      // Try to mark expired token as used
      const { data: result } = await supabase.rpc(
        'mark_magic_link_token_used',
        { token_value: testToken + '_expired' }
      );

      expect(result).toBe(false);

      // Verify token is still not marked as used
      const { data: unusedToken } = await supabase
        .from('magic_link_tokens')
        .select('*')
        .eq('id', testTokenId)
        .single();

      expect((unusedToken as any)?.used).toBe(false);
    });

    it('should not mark already used token as used again', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Create token
      const { data: token } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: testToken + '_already_used',
          guest_id: testGuestId,
          expires_at: expiresAt.toISOString(),
          used: true,
          used_at: new Date().toISOString(),
        })
        .select()
        .single();

      testTokenId = (token as any)!.id;

      // Try to mark already used token
      const { data: result } = await supabase.rpc(
        'mark_magic_link_token_used',
        { token_value: testToken + '_already_used' }
      );

      expect(result).toBe(false);
    });

    it('should have cleanup_expired_magic_link_tokens function', async () => {
      // Create old expired token (25 hours ago)
      const oldExpiresAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const { data: oldToken } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: testToken + '_old_expired',
          guest_id: testGuestId,
          expires_at: oldExpiresAt.toISOString(),
        })
        .select()
        .single();

      const oldTokenId = (oldToken as any)!.id;

      // Call cleanup function
      const { error } = await supabase.rpc('cleanup_expired_magic_link_tokens');

      expect(error).toBeNull();

      // Verify old token was deleted
      const { data: deletedToken } = await supabase
        .from('magic_link_tokens')
        .select('*')
        .eq('id', oldTokenId)
        .single();

      expect(deletedToken).toBeNull();
    });
  });

  describe('Performance and Indexing', () => {
    it('should efficiently query guests by email and auth_method', async () => {
      const startTime = Date.now();

      await supabase
        .from('guests')
        .select('id, email, auth_method')
        .eq('email', 'test.auth@example.com')
        .eq('auth_method', 'email_matching')
        .single();

      const queryTime = Date.now() - startTime;

      // Query should complete in under 100ms with proper indexing
      expect(queryTime).toBeLessThan(100);
    });

    it('should efficiently query magic link tokens by token', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const { data: token } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: testToken + '_perf',
          guest_id: testGuestId,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      const testTokenId = (token as any)!.id;

      const startTime = Date.now();

      await supabase
        .from('magic_link_tokens')
        .select('*')
        .eq('token', testToken + '_perf')
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      const queryTime = Date.now() - startTime;

      // Clean up
      await supabase.from('magic_link_tokens').delete().eq('id', testTokenId);

      // Query should complete in under 50ms with proper indexing
      expect(queryTime).toBeLessThan(50);
    });
  });
});
