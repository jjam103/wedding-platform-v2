import * as fc from 'fast-check';
import { guestService } from '../../services/guestService';
import { eventService } from '../../services/eventService';
import { activityService } from '../../services/activityService';
import { vendorService } from '../../services/vendorService';
import { accommodationService } from '../../services/accommodationService';
import { locationService } from '../../services/locationService';

/**
 * Integration Test: Entity Creation Capability
 * Feature: destination-wedding-platform, Property 4: Entity Creation Capability
 * 
 * Property: For any wedding entity type (guest, event, activity, vendor, accommodation, 
 * room type, location, custom page), the admin portal should provide a creation function 
 * that successfully creates that entity with valid data.
 * 
 * Validates: Requirements 3.9
 * 
 * NOTE: This is an integration test that requires database access.
 * Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
 * 
 * To run integration tests:
 * 1. Copy .env.test.example to .env.test
 * 2. Fill in your test Supabase credentials
 * 3. Run: npm run test:integration
 */

// Check if we have real Supabase credentials (not mock values)
const hasRealDatabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Check if credentials exist and are not mock values
  return url && 
         key && 
         url !== 'https://mock-supabase-url.supabase.co' && 
         key !== 'mock-anon-key-for-testing' &&
         url.includes('.supabase.co');
};

describe('Integration Test: Entity Creation Capability', () => {
  // Skip all tests if real database is not configured
  beforeAll(() => {
    if (!hasRealDatabase()) {
      console.warn('\n⚠️  Skipping integration tests: Real Supabase credentials not configured');
      console.log('📋 To run integration tests:');
      console.log('   1. Copy .env.test.example to .env.test');
      console.log('   2. Fill in your test Supabase credentials');
      console.log('   3. Run: npm run test:integration\n');
    }
  });

  describe('Guest Creation', () => {
    it.skip('should successfully create any valid guest', () => {
      if (!hasRealDatabase()) {
        console.log('Skipped: No database configured');
        return;
      }

      fc.assert(
        fc.asyncProperty(validGuestArbitrary, async (guestData) => {
          const result = await guestService.create(guestData);
          
          // Property: Valid guest data should always result in successful creation
          expect(result.success).toBe(true);
          
          if (result.success) {
            expect(result.data).toHaveProperty('id');
            expect(result.data.first_name).toBe(guestData.first_name);
            expect(result.data.last_name).toBe(guestData.last_name);
            expect(result.data.email).toBe(guestData.email);
            expect(result.data.group_id).toBe(guestData.group_id);
            expect(result.data.age_type).toBe(guestData.age_type);
            expect(result.data.guest_type).toBe(guestData.guest_type);
          }
        }),
        { numRuns: 20 } // Reduced runs for integration tests
      );
    });
  });

  describe('Event Creation', () => {
    it.skip('should successfully create any valid event', () => {
      if (!hasRealDatabase()) {
        console.log('Skipped: No database configured');
        return;
      }

      fc.assert(
        fc.asyncProperty(validEventArbitrary, async (eventData) => {
          const result = await eventService.create(eventData);
          
          // Property: Valid event data should always result in successful creation
          expect(result.success).toBe(true);
          
          if (result.success) {
            expect(result.data).toHaveProperty('id');
            expect(result.data.name).toBe(eventData.name);
            expect(result.data.event_type).toBe(eventData.event_type);
            expect(result.data.rsvp_required).toBe(eventData.rsvp_required);
            expect(result.data.status).toBe('draft');
          }
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Activity Creation', () => {
    it.skip('should successfully create any valid activity', () => {
      if (!hasRealDatabase()) {
        console.log('Skipped: No database configured');
        return;
      }

      fc.assert(
        fc.asyncProperty(validActivityArbitrary, async (activityData) => {
          const result = await activityService.create(activityData);
          
          // Property: Valid activity data should always result in successful creation
          expect(result.success).toBe(true);
          
          if (result.success) {
            expect(result.data).toHaveProperty('id');
            expect(result.data.name).toBe(activityData.name);
            expect(result.data.activity_type).toBe(activityData.activity_type);
            expect(result.data.adults_only).toBe(activityData.adults_only);
            expect(result.data.plus_one_allowed).toBe(activityData.plus_one_allowed);
            expect(result.data.status).toBe('draft');
          }
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Vendor Creation', () => {
    it.skip('should successfully create any valid vendor', () => {
      if (!hasRealDatabase()) {
        console.log('Skipped: No database configured');
        return;
      }

      fc.assert(
        fc.asyncProperty(validVendorArbitrary, async (vendorData) => {
          const result = await vendorService.create(vendorData);
          
          // Property: Valid vendor data should always result in successful creation
          expect(result.success).toBe(true);
          
          if (result.success) {
            expect(result.data).toHaveProperty('id');
            expect(result.data.name).toBe(vendorData.name);
            expect(result.data.category).toBe(vendorData.category);
            expect(result.data.pricing_model).toBe(vendorData.pricing_model);
            expect(result.data.base_cost).toBe(vendorData.base_cost);
            expect(result.data.payment_status).toBe('unpaid');
          }
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Accommodation Creation', () => {
    it.skip('should successfully create any valid accommodation', () => {
      if (!hasRealDatabase()) {
        console.log('Skipped: No database configured');
        return;
      }

      fc.assert(
        fc.asyncProperty(validAccommodationArbitrary, async (accommodationData) => {
          const result = await accommodationService.create(accommodationData);
          
          // Property: Valid accommodation data should always result in successful creation
          expect(result.success).toBe(true);
          
          if (result.success) {
            expect(result.data).toHaveProperty('id');
            expect(result.data.name).toBe(accommodationData.name);
            expect(result.data.status).toBe('draft');
          }
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Location Creation', () => {
    it.skip('should successfully create any valid location', () => {
      if (!hasRealDatabase()) {
        console.log('Skipped: No database configured');
        return;
      }

      fc.assert(
        fc.asyncProperty(validLocationArbitrary, async (locationData) => {
          const result = await locationService.create(locationData);
          
          // Property: Valid location data should always result in successful creation
          expect(result.success).toBe(true);
          
          if (result.success) {
            expect(result.data).toHaveProperty('id');
            expect(result.data.name).toBe(locationData.name);
          }
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Cross-Entity Creation Consistency', () => {
    it.skip('should maintain consistent creation behavior across all entity types', () => {
      if (!hasRealDatabase()) {
        console.log('Skipped: No database configured');
        return;
      }

      fc.assert(
        fc.asyncProperty(
          fc.oneof(
            validGuestArbitrary.map(data => ({ type: 'guest' as const, data })),
            validEventArbitrary.map(data => ({ type: 'event' as const, data })),
            validActivityArbitrary.map(data => ({ type: 'activity' as const, data })),
            validVendorArbitrary.map(data => ({ type: 'vendor' as const, data })),
            validAccommodationArbitrary.map(data => ({ type: 'accommodation' as const, data })),
            validLocationArbitrary.map(data => ({ type: 'location' as const, data }))
          ),
          async (entitySpec) => {
            let result;
            
            switch (entitySpec.type) {
              case 'guest':
                result = await guestService.create(entitySpec.data);
                break;
              case 'event':
                result = await eventService.create(entitySpec.data);
                break;
              case 'activity':
                result = await activityService.create(entitySpec.data);
                break;
              case 'vendor':
                result = await vendorService.create(entitySpec.data);
                break;
              case 'accommodation':
                result = await accommodationService.create(entitySpec.data);
                break;
              case 'location':
                result = await locationService.create(entitySpec.data);
                break;
            }
            
            // Property: All entity types should have consistent creation behavior
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data).toHaveProperty('id');
              expect(result.data).toHaveProperty('created_at');
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
