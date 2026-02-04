/**
 * Property-based tests for authentication method validation
 * 
 * Requirements: 5.1, 5.2, 5.3, 22.1, 22.2
 * Tasks: 4.1, 4.2
 * 
 * Property: Authentication Method Validation
 * - auth_method must be either 'email_matching' or 'magic_link'
 * - default_auth_method must be either 'email_matching' or 'magic_link'
 * - Invalid values should be rejected
 */

import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Feature: guest-portal-and-admin-enhancements, Property: Authentication Method Validation', () => {
  let supabase: ReturnType<typeof createClient>;
  let testGroupId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create test group
    const { data: group } = await supabase
      .from('groups')
      .insert({ name: 'Property Test Auth Group' })
      .select()
      .single();

    testGroupId = group!.id;
  });

  afterAll(async () => {
    // Clean up
    if (testGroupId) {
      await supabase.from('groups').delete().eq('id', testGroupId);
    }
  });

  describe('Property 1: Valid auth_method values are accepted', () => {
    it('should accept email_matching and magic_link as valid auth_method values', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom('email_matching', 'magic_link'),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.emailAddress(),
          async (authMethod, firstName, lastName, email) => {
            // Create guest with specified auth_method
            const { data: guest, error } = await supabase
              .from('guests')
              .insert({
                group_id: testGroupId,
                first_name: firstName,
                last_name: lastName,
                email: email,
                age_type: 'adult',
                guest_type: 'wedding_guest',
                auth_method: authMethod,
              })
              .select()
              .single();

            // Clean up
            if (guest) {
              await supabase.from('guests').delete().eq('id', guest.id);
            }

            // Assertion
            expect(error).toBeNull();
            expect(guest).toBeDefined();
            expect(guest?.auth_method).toBe(authMethod);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 2: Invalid auth_method values are rejected', () => {
    it('should reject any auth_method value other than email_matching or magic_link', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(
            (s) => s !== 'email_matching' && s !== 'magic_link'
          ),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.emailAddress(),
          async (invalidAuthMethod, firstName, lastName, email) => {
            // Try to create guest with invalid auth_method
            const { error } = await supabase
              .from('guests')
              .insert({
                group_id: testGroupId,
                first_name: firstName,
                last_name: lastName,
                email: email,
                age_type: 'adult',
                guest_type: 'wedding_guest',
                auth_method: invalidAuthMethod as any,
              });

            // Assertion: should fail with constraint violation
            expect(error).not.toBeNull();
            expect(error?.message).toMatch(/auth_method|constraint|check/i);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 3: Default auth_method is email_matching', () => {
    it('should default to email_matching when auth_method is not specified', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.emailAddress(),
          async (firstName, lastName, email) => {
            // Create guest without specifying auth_method
            const { data: guest, error } = await supabase
              .from('guests')
              .insert({
                group_id: testGroupId,
                first_name: firstName,
                last_name: lastName,
                email: email,
                age_type: 'adult',
                guest_type: 'wedding_guest',
                // auth_method not specified
              })
              .select()
              .single();

            // Clean up
            if (guest) {
              await supabase.from('guests').delete().eq('id', guest.id);
            }

            // Assertion
            expect(error).toBeNull();
            expect(guest).toBeDefined();
            expect(guest?.auth_method).toBe('email_matching');
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 4: auth_method can be updated', () => {
    it('should allow updating auth_method between valid values', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom('email_matching', 'magic_link'),
          fc.constantFrom('email_matching', 'magic_link'),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.emailAddress(),
          async (initialMethod, updatedMethod, firstName, lastName, email) => {
            // Create guest with initial auth_method
            const { data: guest } = await supabase
              .from('guests')
              .insert({
                group_id: testGroupId,
                first_name: firstName,
                last_name: lastName,
                email: email,
                age_type: 'adult',
                guest_type: 'wedding_guest',
                auth_method: initialMethod,
              })
              .select()
              .single();

            const guestId = guest!.id;

            // Update auth_method
            const { data: updatedGuest, error } = await supabase
              .from('guests')
              .update({ auth_method: updatedMethod })
              .eq('id', guestId)
              .select()
              .single();

            // Clean up
            await supabase.from('guests').delete().eq('id', guestId);

            // Assertion
            expect(error).toBeNull();
            expect(updatedGuest).toBeDefined();
            expect(updatedGuest?.auth_method).toBe(updatedMethod);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 5: Magic link tokens must have valid expiration', () => {
    it('should only accept tokens with future expiration dates', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 60 }), // Minutes in the future
          fc.string({ minLength: 32, maxLength: 64 }),
          async (minutesInFuture, token) => {
            // Create test guest
            const { data: guest } = await supabase
              .from('guests')
              .insert({
                group_id: testGroupId,
                first_name: 'Token',
                last_name: 'Test',
                email: `token.test.${Date.now()}@example.com`,
                age_type: 'adult',
                guest_type: 'wedding_guest',
              })
              .select()
              .single();

            const guestId = guest!.id;
            const expiresAt = new Date(Date.now() + minutesInFuture * 60 * 1000);

            // Create token with future expiration
            const { data: tokenRecord, error } = await supabase
              .from('magic_link_tokens')
              .insert({
                token: token,
                guest_id: guestId,
                expires_at: expiresAt.toISOString(),
              })
              .select()
              .single();

            // Clean up
            if (tokenRecord) {
              await supabase.from('magic_link_tokens').delete().eq('id', tokenRecord.id);
            }
            await supabase.from('guests').delete().eq('id', guestId);

            // Assertion
            expect(error).toBeNull();
            expect(tokenRecord).toBeDefined();
            expect(new Date(tokenRecord!.expires_at).getTime()).toBeGreaterThan(Date.now());
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 6: Magic link tokens are single-use', () => {
    it('should prevent marking an already-used token as used again', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 32, maxLength: 64 }),
          async (token) => {
            // Create test guest
            const { data: guest } = await supabase
              .from('guests')
              .insert({
                group_id: testGroupId,
                first_name: 'SingleUse',
                last_name: 'Test',
                email: `singleuse.${Date.now()}@example.com`,
                age_type: 'adult',
                guest_type: 'wedding_guest',
              })
              .select()
              .single();

            const guestId = guest!.id;
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            // Create token
            const { data: tokenRecord } = await supabase
              .from('magic_link_tokens')
              .insert({
                token: token,
                guest_id: guestId,
                expires_at: expiresAt.toISOString(),
              })
              .select()
              .single();

            const tokenId = tokenRecord!.id;

            // Mark token as used (first time)
            const { data: firstUse } = await supabase.rpc(
              'mark_magic_link_token_used',
              { token_value: token }
            );

            // Try to mark as used again (second time)
            const { data: secondUse } = await supabase.rpc(
              'mark_magic_link_token_used',
              { token_value: token }
            );

            // Clean up
            await supabase.from('magic_link_tokens').delete().eq('id', tokenId);
            await supabase.from('guests').delete().eq('id', guestId);

            // Assertions
            expect(firstUse).toBe(true); // First use succeeds
            expect(secondUse).toBe(false); // Second use fails
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 7: Expired tokens cannot be used', () => {
    it('should reject tokens that have expired', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 60 }), // Minutes in the past
          fc.string({ minLength: 32, maxLength: 64 }),
          async (minutesInPast, token) => {
            // Create test guest
            const { data: guest } = await supabase
              .from('guests')
              .insert({
                group_id: testGroupId,
                first_name: 'Expired',
                last_name: 'Test',
                email: `expired.${Date.now()}@example.com`,
                age_type: 'adult',
                guest_type: 'wedding_guest',
              })
              .select()
              .single();

            const guestId = guest!.id;
            const expiresAt = new Date(Date.now() - minutesInPast * 60 * 1000);

            // Create expired token
            const { data: tokenRecord } = await supabase
              .from('magic_link_tokens')
              .insert({
                token: token,
                guest_id: guestId,
                expires_at: expiresAt.toISOString(),
              })
              .select()
              .single();

            const tokenId = tokenRecord!.id;

            // Try to mark expired token as used
            const { data: result } = await supabase.rpc(
              'mark_magic_link_token_used',
              { token_value: token }
            );

            // Clean up
            await supabase.from('magic_link_tokens').delete().eq('id', tokenId);
            await supabase.from('guests').delete().eq('id', guestId);

            // Assertion: expired token cannot be used
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 8: Token uniqueness is enforced', () => {
    it('should reject duplicate tokens', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 32, maxLength: 64 }),
          async (token) => {
            // Create test guest
            const { data: guest } = await supabase
              .from('guests')
              .insert({
                group_id: testGroupId,
                first_name: 'Unique',
                last_name: 'Test',
                email: `unique.${Date.now()}@example.com`,
                age_type: 'adult',
                guest_type: 'wedding_guest',
              })
              .select()
              .single();

            const guestId = guest!.id;
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            // Create first token
            const { data: token1 } = await supabase
              .from('magic_link_tokens')
              .insert({
                token: token,
                guest_id: guestId,
                expires_at: expiresAt.toISOString(),
              })
              .select()
              .single();

            const token1Id = token1!.id;

            // Try to create duplicate token
            const { error: duplicateError } = await supabase
              .from('magic_link_tokens')
              .insert({
                token: token,
                guest_id: guestId,
                expires_at: expiresAt.toISOString(),
              });

            // Clean up
            await supabase.from('magic_link_tokens').delete().eq('id', token1Id);
            await supabase.from('guests').delete().eq('id', guestId);

            // Assertion: duplicate should be rejected
            expect(duplicateError).not.toBeNull();
            expect(duplicateError?.message).toMatch(/duplicate|unique/i);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
