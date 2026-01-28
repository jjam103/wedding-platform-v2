import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import { exportToCSV, importFromCSV } from './guestService';
import type { Guest } from '@/schemas/guestSchemas';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

/**
 * Feature: destination-wedding-platform, Property 24: Guest Data Round-Trip
 * 
 * For any valid guest data object, the sequence of operations 
 * (export to CSV → import from CSV → export to CSV again) should produce 
 * an equivalent guest record with all fields preserved.
 * 
 * Validates: Requirements 20.4
 */
describe('Feature: destination-wedding-platform, Property 24: Guest Data Round-Trip', () => {
  beforeEach(() => {
    // Reset and configure Supabase mock for each test
    const { supabase } = require('@/lib/supabase');
    jest.clearAllMocks();
    
    // Track which guest we're inserting (for multiple guests in one test)
    let insertCallIndex = 0;
    const guestsToInsert: any[] = [];
    
    // Mock the database insert to return the guest data with database fields
    supabase.from.mockReturnValue({
      insert: jest.fn().mockImplementation((data: any) => {
        // Store the data being inserted
        if (Array.isArray(data)) {
          guestsToInsert.push(...data);
        } else {
          guestsToInsert.push(data);
        }
        
        return {
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              // Return the guest that was just inserted
              const guestData = guestsToInsert[insertCallIndex];
              insertCallIndex++;
              
              return Promise.resolve({
                data: {
                  id: `mock-id-${insertCallIndex}`,
                  group_id: guestData.group_id,
                  first_name: guestData.first_name,
                  last_name: guestData.last_name,
                  email: guestData.email,
                  phone: guestData.phone,
                  age_type: guestData.age_type,
                  guest_type: guestData.guest_type,
                  dietary_restrictions: guestData.dietary_restrictions,
                  plus_one_name: guestData.plus_one_name,
                  plus_one_attending: guestData.plus_one_attending,
                  arrival_date: guestData.arrival_date,
                  departure_date: guestData.departure_date,
                  airport_code: guestData.airport_code,
                  flight_number: guestData.flight_number,
                  invitation_sent: guestData.invitation_sent,
                  invitation_sent_date: guestData.invitation_sent_date,
                  rsvp_deadline: guestData.rsvp_deadline,
                  notes: guestData.notes,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              });
            }),
          }),
        };
      }),
    });
  });

  // Generator for valid guest data
  // Use simple, valid email addresses that will pass Zod validation
  const validEmailArbitrary = fc.oneof(
    fc.constant('john.doe@example.com'),
    fc.constant('jane.smith@test.org'),
    fc.constant('user@domain.co'),
    fc.constant('test.user@mail.com'),
    fc.constant('guest@wedding.com')
  );

  const guestArbitrary: fc.Arbitrary<Guest> = fc.record({
    id: fc.uuid(),
    groupId: fc.uuid(),
    firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
    }),
    lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
    }),
    email: fc.option(validEmailArbitrary, { nil: null }),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 20 }).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
    }), { nil: null }),
    ageType: fc.constantFrom('adult', 'child', 'senior') as fc.Arbitrary<'adult' | 'child' | 'senior'>,
    guestType: fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
    }),
    dietaryRestrictions: fc.option(fc.string({ minLength: 1, maxLength: 200 }).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
    }), { nil: null }),
    plusOneName: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
    }), { nil: null }),
    plusOneAttending: fc.boolean(),
    arrivalDate: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    departureDate: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    airportCode: fc.option(fc.constantFrom('SJO', 'LIR', 'Other'), { nil: null }) as fc.Arbitrary<'SJO' | 'LIR' | 'Other' | null>,
    flightNumber: fc.option(fc.string({ minLength: 4, maxLength: 10 }).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
    }), { nil: null }),
    invitationSent: fc.boolean(),
    invitationSentDate: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    rsvpDeadline: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    notes: fc.option(fc.string({ minLength: 1, maxLength: 500 }).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
    }), { nil: null }),
    createdAt: fc.date().map(d => d.toISOString()),
    updatedAt: fc.date().map(d => d.toISOString()),
  });

  // Generator for guests with special characters that need escaping
  const guestWithSpecialCharsArbitrary: fc.Arbitrary<Guest> = fc.record({
    id: fc.uuid(),
    groupId: fc.uuid(),
    firstName: fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
        const trimmed = s.trim();
        return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
      }),
      fc.constant('María'),
      fc.constant('José'),
      fc.constant('Jean-Pierre')
    ),
    lastName: fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
        const trimmed = s.trim();
        return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
      }),
      fc.constant('García'),
      fc.constant('Müller')
    ),
    email: fc.option(validEmailArbitrary, { nil: null }),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 20 }).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
    }), { nil: null }),
    ageType: fc.constantFrom('adult', 'child', 'senior') as fc.Arbitrary<'adult' | 'child' | 'senior'>,
    guestType: fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
        const trimmed = s.trim();
        return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
      }),
      fc.constant('wedding_guest'),
      fc.constant('wedding_party')
    ),
    dietaryRestrictions: fc.option(
      fc.oneof(
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => {
          const trimmed = s.trim();
          return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
        }),
        fc.constant('No dairy, no nuts'),
        fc.constant('Gluten-free, vegan'),
        fc.constant('Vegetarian, no red meat')
      ),
      { nil: null }
    ),
    plusOneName: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
    }), { nil: null }),
    plusOneAttending: fc.boolean(),
    arrivalDate: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    departureDate: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    airportCode: fc.option(fc.constantFrom('SJO', 'LIR', 'Other'), { nil: null }) as fc.Arbitrary<'SJO' | 'LIR' | 'Other' | null>,
    flightNumber: fc.option(fc.string({ minLength: 4, maxLength: 10 }).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
    }), { nil: null }),
    invitationSent: fc.boolean(),
    invitationSentDate: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    rsvpDeadline: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    notes: fc.option(
      fc.oneof(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => {
          const trimmed = s.trim();
          return trimmed.length > 0 && !/<|>|&|'|"/.test(trimmed) && trimmed === s;
        }),
        fc.constant('Needs wheelchair access, arriving early'),
        fc.constant('Contact via email, not phone'),
        fc.constant('Staying at Hotel Costa Rica, room 205')
      ),
      { nil: null }
    ),
    createdAt: fc.date().map(d => d.toISOString()),
    updatedAt: fc.date().map(d => d.toISOString()),
  });

  it('should preserve all guest data through export-import-export cycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 1, maxLength: 50 }),
        async (originalGuests) => {
          // Step 1: Export original guests to CSV
          const exportResult1 = await exportToCSV(originalGuests);
          expect(exportResult1.success).toBe(true);
          if (!exportResult1.success) return;

          // Step 2: Import from CSV
          const importResult = await importFromCSV(exportResult1.data);
          expect(importResult.success).toBe(true);
          if (!importResult.success) return;

          // Step 3: Export imported guests to CSV again
          const exportResult2 = await exportToCSV(importResult.data);
          expect(exportResult2.success).toBe(true);
          if (!exportResult2.success) return;

          // Step 4: Verify both CSV exports are equivalent
          // Normalize line endings and trim whitespace
          const csv1 = exportResult1.data.trim().replace(/\r\n/g, '\n');
          const csv2 = exportResult2.data.trim().replace(/\r\n/g, '\n');

          expect(csv2).toBe(csv1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve guest data with special characters through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestWithSpecialCharsArbitrary, { minLength: 1, maxLength: 20 }),
        async (originalGuests) => {
          // Export → Import → Export
          const exportResult1 = await exportToCSV(originalGuests);
          expect(exportResult1.success).toBe(true);
          if (!exportResult1.success) return;

          const importResult = await importFromCSV(exportResult1.data);
          expect(importResult.success).toBe(true);
          if (!importResult.success) return;

          const exportResult2 = await exportToCSV(importResult.data);
          expect(exportResult2.success).toBe(true);
          if (!exportResult2.success) return;

          // Verify CSV equivalence
          const csv1 = exportResult1.data.trim().replace(/\r\n/g, '\n');
          const csv2 = exportResult2.data.trim().replace(/\r\n/g, '\n');

          expect(csv2).toBe(csv1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all field values through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 1, maxLength: 20 }),
        async (originalGuests) => {
          // Export → Import
          const exportResult = await exportToCSV(originalGuests);
          expect(exportResult.success).toBe(true);
          if (!exportResult.success) return;

          const importResult = await importFromCSV(exportResult.data);
          expect(importResult.success).toBe(true);
          if (!importResult.success) return;

          const importedGuests = importResult.data;

          // Verify same number of guests
          expect(importedGuests.length).toBe(originalGuests.length);

          // Verify each guest's fields are preserved
          for (let i = 0; i < originalGuests.length; i++) {
            const original = originalGuests[i];
            const imported = importedGuests[i];

            // Compare all CSV-exported fields
            expect(imported.groupId).toBe(original.groupId);
            expect(imported.firstName).toBe(original.firstName);
            expect(imported.lastName).toBe(original.lastName);
            expect(imported.email).toBe(original.email);
            expect(imported.phone).toBe(original.phone);
            expect(imported.ageType).toBe(original.ageType);
            expect(imported.guestType).toBe(original.guestType);
            expect(imported.dietaryRestrictions).toBe(original.dietaryRestrictions);
            expect(imported.plusOneName).toBe(original.plusOneName);
            expect(imported.plusOneAttending).toBe(original.plusOneAttending);
            expect(imported.arrivalDate).toBe(original.arrivalDate);
            expect(imported.departureDate).toBe(original.departureDate);
            expect(imported.airportCode).toBe(original.airportCode);
            expect(imported.flightNumber).toBe(original.flightNumber);
            expect(imported.invitationSent).toBe(original.invitationSent);
            expect(imported.invitationSentDate).toBe(original.invitationSentDate);
            expect(imported.rsvpDeadline).toBe(original.rsvpDeadline);
            expect(imported.notes).toBe(original.notes);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty array through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant([]),
        async (originalGuests) => {
          // Export empty array
          const exportResult1 = await exportToCSV(originalGuests);
          expect(exportResult1.success).toBe(true);
          if (!exportResult1.success) return;

          // Import should fail for header-only CSV (validation error)
          const importResult = await importFromCSV(exportResult1.data);
          expect(importResult.success).toBe(false);
          if (importResult.success) return; // Should not reach here

          // Verify it's a validation error about missing data rows
          expect(importResult.error.code).toBe('VALIDATION_ERROR');
          expect(importResult.error.message).toContain('at least one data row');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve null values through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 1, maxLength: 20 }),
        async (originalGuests) => {
          // Export → Import
          const exportResult = await exportToCSV(originalGuests);
          expect(exportResult.success).toBe(true);
          if (!exportResult.success) return;

          const importResult = await importFromCSV(exportResult.data);
          expect(importResult.success).toBe(true);
          if (!importResult.success) return;

          const importedGuests = importResult.data;

          // Verify null values are preserved
          for (let i = 0; i < originalGuests.length; i++) {
            const original = originalGuests[i];
            const imported = importedGuests[i];

            // Check nullable fields
            if (original.email === null) {
              expect(imported.email).toBe(null);
            }
            if (original.phone === null) {
              expect(imported.phone).toBe(null);
            }
            if (original.dietaryRestrictions === null) {
              expect(imported.dietaryRestrictions).toBe(null);
            }
            if (original.plusOneName === null) {
              expect(imported.plusOneName).toBe(null);
            }
            if (original.arrivalDate === null) {
              expect(imported.arrivalDate).toBe(null);
            }
            if (original.departureDate === null) {
              expect(imported.departureDate).toBe(null);
            }
            if (original.airportCode === null) {
              expect(imported.airportCode).toBe(null);
            }
            if (original.flightNumber === null) {
              expect(imported.flightNumber).toBe(null);
            }
            if (original.invitationSentDate === null) {
              expect(imported.invitationSentDate).toBe(null);
            }
            if (original.rsvpDeadline === null) {
              expect(imported.rsvpDeadline).toBe(null);
            }
            if (original.notes === null) {
              expect(imported.notes).toBe(null);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve boolean values through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 1, maxLength: 20 }),
        async (originalGuests) => {
          // Export → Import
          const exportResult = await exportToCSV(originalGuests);
          expect(exportResult.success).toBe(true);
          if (!exportResult.success) return;

          const importResult = await importFromCSV(exportResult.data);
          expect(importResult.success).toBe(true);
          if (!importResult.success) return;

          const importedGuests = importResult.data;

          // Verify boolean values are preserved
          for (let i = 0; i < originalGuests.length; i++) {
            const original = originalGuests[i];
            const imported = importedGuests[i];

            expect(imported.plusOneAttending).toBe(original.plusOneAttending);
            expect(imported.invitationSent).toBe(original.invitationSent);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle large guest arrays through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 50, maxLength: 200 }),
        async (originalGuests) => {
          // Export → Import → Export
          const exportResult1 = await exportToCSV(originalGuests);
          expect(exportResult1.success).toBe(true);
          if (!exportResult1.success) return;

          const importResult = await importFromCSV(exportResult1.data);
          expect(importResult.success).toBe(true);
          if (!importResult.success) return;

          expect(importResult.data.length).toBe(originalGuests.length);

          const exportResult2 = await exportToCSV(importResult.data);
          expect(exportResult2.success).toBe(true);
          if (!exportResult2.success) return;

          // Verify CSV equivalence
          const csv1 = exportResult1.data.trim().replace(/\r\n/g, '\n');
          const csv2 = exportResult2.data.trim().replace(/\r\n/g, '\n');

          expect(csv2).toBe(csv1);
        }
      ),
      { numRuns: 50 } // Fewer runs for large arrays
    );
  });

  it('should preserve field order through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 1, maxLength: 20 }),
        async (originalGuests) => {
          // Export → Import
          const exportResult = await exportToCSV(originalGuests);
          expect(exportResult.success).toBe(true);
          if (!exportResult.success) return;

          const importResult = await importFromCSV(exportResult.data);
          expect(importResult.success).toBe(true);
          if (!importResult.success) return;

          // Export again
          const exportResult2 = await exportToCSV(importResult.data);
          expect(exportResult2.success).toBe(true);
          if (!exportResult2.success) return;

          // Parse both CSVs and verify field order
          const lines1 = exportResult.data.split('\n').filter(l => l.trim());
          const lines2 = exportResult2.data.split('\n').filter(l => l.trim());

          // Headers should be identical
          expect(lines2[0]).toBe(lines1[0]);

          // Each data row should be identical
          for (let i = 1; i < lines1.length; i++) {
            expect(lines2[i]).toBe(lines1[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be idempotent for multiple round-trips', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 1, maxLength: 20 }),
        async (originalGuests) => {
          // First round-trip
          const export1 = await exportToCSV(originalGuests);
          expect(export1.success).toBe(true);
          if (!export1.success) return;

          const import1 = await importFromCSV(export1.data);
          expect(import1.success).toBe(true);
          if (!import1.success) return;

          // Second round-trip
          const export2 = await exportToCSV(import1.data);
          expect(export2.success).toBe(true);
          if (!export2.success) return;

          const import2 = await importFromCSV(export2.data);
          expect(import2.success).toBe(true);
          if (!import2.success) return;

          // Third round-trip
          const export3 = await exportToCSV(import2.data);
          expect(export3.success).toBe(true);
          if (!export3.success) return;

          // All exports should be identical
          const csv1 = export1.data.trim().replace(/\r\n/g, '\n');
          const csv2 = export2.data.trim().replace(/\r\n/g, '\n');
          const csv3 = export3.data.trim().replace(/\r\n/g, '\n');

          expect(csv2).toBe(csv1);
          expect(csv3).toBe(csv1);
        }
      ),
      { numRuns: 50 } // Fewer runs for multiple round-trips
    );
  });
});
