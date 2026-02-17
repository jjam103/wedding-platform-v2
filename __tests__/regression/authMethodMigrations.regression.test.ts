/**
 * Regression tests for authentication method migrations
 * Ensures migrations don't break existing guest functionality
 * 
 * Requirements: 5.1, 5.2, 5.3, 22.1, 22.2
 * Tasks: 4.1, 4.2
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Regression: Authentication Method Migrations', () => {
  let supabase: ReturnType<typeof createClient>;
  let testGroupId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create test group
    const { data: group } = await supabase
      .from('groups')
      .insert({ name: 'Regression Test Group' })
      .select()
      .single();

    testGroupId = (group as any)!.id;
  });

  afterAll(async () => {
    // Clean up
    if (testGroupId) {
      await supabase.from('groups').delete().eq('id', testGroupId);
    }
  });

  describe('Existing guest functionality', () => {
    it('should not break existing guest creation', async () => {
      const { data: guest, error } = await supabase
        .from('guests')
        .insert({
          group_id: testGroupId,
          first_name: 'Regression',
          last_name: 'Test',
          email: 'regression.test@example.com',
          age_type: 'adult',
          guest_type: 'wedding_guest',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(guest).toBeDefined();
      expect((guest as any).first_name).toBe('Regression');
      expect((guest as any).last_name).toBe('Test');
      expect((guest as any).email).toBe('regression.test@example.com');
      expect((guest as any).auth_method).toBe('email_matching'); // Default value

      // Clean up
      await supabase.from('guests').delete().eq('id', (guest as any).id);
    });

    it('should not break existing guest updates', async () => {
      // Create guest
      const { data: guest } = await supabase
        .from('guests')
        .insert({
          group_id: testGroupId,
          first_name: 'Update',
          last_name: 'Test',
          email: 'update.test@example.com',
          age_type: 'adult',
          guest_type: 'wedding_guest',
        })
        .select()
        .single();

      const guestId = (guest as any)!.id;

      // Update guest (without touching auth_method)
      const { data: updated, error } = await supabase
        .from('guests')
        .update({
          first_name: 'Updated',
          phone: '+1234567890',
        })
        .eq('id', guestId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated).toBeDefined();
      expect((updated as any).first_name).toBe('Updated');
      expect((updated as any).phone).toBe('+1234567890');
      expect((updated as any).auth_method).toBe('email_matching'); // Should remain unchanged

      // Clean up
      await supabase.from('guests').delete().eq('id', guestId);
    });

    it('should not break existing guest queries', async () => {
      // Create multiple guests
      const guests = [
        {
          group_id: testGroupId,
          first_name: 'Query1',
          last_name: 'Test',
          email: 'query1@example.com',
          age_type: 'adult',
          guest_type: 'wedding_guest',
        },
        {
          group_id: testGroupId,
          first_name: 'Query2',
          last_name: 'Test',
          email: 'query2@example.com',
          age_type: 'adult',
          guest_type: 'wedding_guest',
        },
      ];

      const { data: created } = await supabase
        .from('guests')
        .insert(guests)
        .select();

      // Query guests
      const { data: queried, error } = await supabase
        .from('guests')
        .select('*')
        .eq('group_id', testGroupId)
        .in('email', ['query1@example.com', 'query2@example.com']);

      expect(error).toBeNull();
      expect(queried).toBeDefined();
      expect(queried.length).toBe(2);

      // Clean up
      if (created) {
        for (const guest of created) {
          await supabase.from('guests').delete().eq('id', (guest as any).id);
        }
      }
    });

    it('should not break existing guest deletion', async () => {
      // Create guest
      const { data: guest } = await supabase
        .from('guests')
        .insert({
          group_id: testGroupId,
          first_name: 'Delete',
          last_name: 'Test',
          email: 'delete.test@example.com',
          age_type: 'adult',
          guest_type: 'wedding_guest',
        })
        .select()
        .single();

      const guestId = (guest as any)!.id;

      // Delete guest
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId);

      expect(error).toBeNull();

      // Verify deletion
      const { data: deleted } = await supabase
        .from('guests')
        .select('*')
        .eq('id', guestId)
        .single();

      expect(deleted).toBeNull();
    });
  });

  describe('Existing settings functionality', () => {
    it('should not break existing settings queries', async () => {
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single();

      expect(error).toBeNull();
      expect(settings).toBeDefined();
      expect((settings as any).default_auth_method).toBeDefined();
      expect(['email_matching', 'magic_link']).toContain((settings as any).default_auth_method);
    });

    it('should not break existing settings updates', async () => {
      // Get existing settings
      const { data: settings } = await supabase
        .from('system_settings')
        .select('id, timezone')
        .limit(1)
        .single();

      if (settings) {
        const originalTimezone = (settings as any).timezone;

        // Update settings (without touching default_auth_method)
        const { data: updated, error } = await supabase
          .from('system_settings')
          .update({ timezone: 'America/New_York' })
          .eq('id', (settings as any).id)
          .select()
          .single();

        expect(error).toBeNull();
        expect(updated).toBeDefined();
        expect((updated as any).timezone).toBe('America/New_York');
        expect((updated as any).default_auth_method).toBeDefined();

        // Restore original timezone
        await supabase
          .from('system_settings')
          .update({ timezone: originalTimezone })
          .eq('id', (settings as any).id);
      }
    });
  });

  describe('Backward compatibility', () => {
    it('should allow guests without email to have auth_method', async () => {
      // Some guests might not have email addresses (e.g., children)
      const { data: guest, error } = await supabase
        .from('guests')
        .insert({
          group_id: testGroupId,
          first_name: 'NoEmail',
          last_name: 'Child',
          email: null,
          age_type: 'child',
          guest_type: 'wedding_guest',
          auth_method: 'email_matching', // Still has auth_method even without email
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(guest).toBeDefined();
      expect((guest as any).email).toBeNull();
      expect((guest as any).auth_method).toBe('email_matching');

      // Clean up
      await supabase.from('guests').delete().eq('id', (guest as any).id);
    });

    it('should maintain existing guest relationships', async () => {
      // Create guest with RSVP
      const { data: guest } = await supabase
        .from('guests')
        .insert({
          group_id: testGroupId,
          first_name: 'RSVP',
          last_name: 'Test',
          email: 'rsvp.test@example.com',
          age_type: 'adult',
          guest_type: 'wedding_guest',
        })
        .select()
        .single();

      const guestId = (guest as any)!.id;

      // Create event
      const { data: event } = await supabase
        .from('events')
        .insert({
          name: 'Test Event',
          event_type: 'ceremony',
          start_date: new Date().toISOString(),
          status: 'published',
        })
        .select()
        .single();

      const eventId = (event as any)!.id;

      // Create RSVP
      const { data: rsvp, error: rsvpError } = await supabase
        .from('rsvps')
        .insert({
          guest_id: guestId,
          event_id: eventId,
          status: 'attending',
        })
        .select()
        .single();

      expect(rsvpError).toBeNull();
      expect(rsvp).toBeDefined();
      expect((rsvp as any).guest_id).toBe(guestId);

      // Clean up
      await supabase.from('rsvps').delete().eq('id', (rsvp as any).id);
      await supabase.from('events').delete().eq('id', eventId);
      await supabase.from('guests').delete().eq('id', guestId);
    });

    it('should not affect existing indexes', async () => {
      // Test that existing indexes still work
      const { data: guestsByGroup, error: groupError } = await supabase
        .from('guests')
        .select('*')
        .eq('group_id', testGroupId);

      expect(groupError).toBeNull();
      expect(guestsByGroup).toBeDefined();

      // Test email index
      const { data: guestsByEmail, error: emailError } = await supabase
        .from('guests')
        .select('*')
        .eq('email', 'test@example.com');

      expect(emailError).toBeNull();
      expect(guestsByEmail).toBeDefined();
    });
  });

  describe('Data integrity', () => {
    it('should maintain referential integrity with magic link tokens', async () => {
      // Create guest
      const { data: guest } = await supabase
        .from('guests')
        .insert({
          group_id: testGroupId,
          first_name: 'Integrity',
          last_name: 'Test',
          email: 'integrity.test@example.com',
          age_type: 'adult',
          guest_type: 'wedding_guest',
          auth_method: 'magic_link',
        })
        .select()
        .single();

      const guestId = (guest as any)!.id;

      // Create magic link token
      const { data: token } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: 'integrity_test_token_' + Date.now(),
          guest_id: guestId,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      const tokenId = (token as any)!.id;

      // Verify token references guest
      const { data: tokenWithGuest } = await supabase
        .from('magic_link_tokens')
        .select('*, guests(*)')
        .eq('id', tokenId)
        .single();

      expect(tokenWithGuest).toBeDefined();
      expect((tokenWithGuest as any).guest_id).toBe(guestId);

      // Delete guest (should cascade delete token)
      await supabase.from('guests').delete().eq('id', guestId);

      // Verify token was cascade deleted
      const { data: deletedToken } = await supabase
        .from('magic_link_tokens')
        .select('*')
        .eq('id', tokenId)
        .single();

      expect(deletedToken).toBeNull();
    });

    it('should not allow orphaned magic link tokens', async () => {
      const fakeGuestId = '00000000-0000-0000-0000-000000000000';

      // Try to create token with non-existent guest
      const { error } = await supabase
        .from('magic_link_tokens')
        .insert({
          token: 'orphan_token_' + Date.now(),
          guest_id: fakeGuestId,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });

      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/foreign key|violates/i);
    });
  });

  describe('Performance regression', () => {
    it('should not significantly slow down guest queries', async () => {
      // Create multiple guests for performance testing
      const guests = Array.from({ length: 50 }, (_, i) => ({
        group_id: testGroupId,
        first_name: `Perf${i}`,
        last_name: 'Test',
        email: `perf${i}@example.com`,
        age_type: 'adult',
        guest_type: 'wedding_guest',
      }));

      const { data: created } = await supabase
        .from('guests')
        .insert(guests)
        .select();

      // Measure query time
      const startTime = Date.now();

      await supabase
        .from('guests')
        .select('*')
        .eq('group_id', testGroupId);

      const queryTime = Date.now() - startTime;

      // Clean up
      if (created) {
        for (const guest of created) {
          await supabase.from('guests').delete().eq('id', (guest as any).id);
        }
      }

      // Query should complete in reasonable time (< 200ms for 50 guests)
      expect(queryTime).toBeLessThan(200);
    });

    it('should efficiently query by email and auth_method', async () => {
      // Create guest
      const { data: guest } = await supabase
        .from('guests')
        .insert({
          group_id: testGroupId,
          first_name: 'EmailQuery',
          last_name: 'Test',
          email: 'emailquery@example.com',
          age_type: 'adult',
          guest_type: 'wedding_guest',
          auth_method: 'email_matching',
        })
        .select()
        .single();

      // Measure query time with composite index
      const startTime = Date.now();

      await supabase
        .from('guests')
        .select('*')
        .eq('email', 'emailquery@example.com')
        .eq('auth_method', 'email_matching')
        .single();

      const queryTime = Date.now() - startTime;

      // Clean up
      await supabase.from('guests').delete().eq('id', (guest as any)!.id);

      // Query should be fast with composite index (< 50ms)
      expect(queryTime).toBeLessThan(50);
    });
  });
});
