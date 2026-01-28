import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { exportToCSV } from './guestService';
import type { Guest } from '@/schemas/guestSchemas';

/**
 * Feature: destination-wedding-platform, Property 23: CSV Export Validity
 * 
 * For any set of guest data, exporting to CSV should produce a valid CSV file
 * with proper headers, correct field delimiters, and properly escaped values.
 * 
 * Validates: Requirements 20.2
 */
describe('Feature: destination-wedding-platform, Property 23: CSV Export Validity', () => {
  // Expected CSV headers in correct order
  const EXPECTED_HEADERS = [
    'groupId',
    'firstName',
    'lastName',
    'email',
    'phone',
    'ageType',
    'guestType',
    'dietaryRestrictions',
    'plusOneName',
    'plusOneAttending',
    'arrivalDate',
    'departureDate',
    'airportCode',
    'flightNumber',
    'invitationSent',
    'invitationSentDate',
    'rsvpDeadline',
    'notes',
  ];

  // Generator for valid guest data
  const guestArbitrary: fc.Arbitrary<Guest> = fc.record({
    id: fc.uuid(),
    groupId: fc.uuid(),
    firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    email: fc.option(fc.emailAddress(), { nil: null }),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 20 }), { nil: null }),
    ageType: fc.constantFrom('adult', 'child', 'senior') as fc.Arbitrary<'adult' | 'child' | 'senior'>,
    guestType: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    dietaryRestrictions: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
    plusOneName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    plusOneAttending: fc.boolean(),
    arrivalDate: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    departureDate: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    airportCode: fc.option(fc.constantFrom('SJO', 'LIR', 'Other'), { nil: null }) as fc.Arbitrary<'SJO' | 'LIR' | 'Other' | null>,
    flightNumber: fc.option(fc.string({ minLength: 4, maxLength: 10 }), { nil: null }),
    invitationSent: fc.boolean(),
    invitationSentDate: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    rsvpDeadline: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
    createdAt: fc.date().map(d => d.toISOString()),
    updatedAt: fc.date().map(d => d.toISOString()),
  });

  // Generator for guests with special characters that need escaping
  const guestWithSpecialCharsArbitrary: fc.Arbitrary<Guest> = fc.record({
    id: fc.uuid(),
    groupId: fc.uuid(),
    firstName: fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      fc.constant('María'),
      fc.constant('José'),
      fc.constant('O\'Brien')
    ),
    lastName: fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      fc.constant('García'),
      fc.constant('Müller'),
      fc.constant('D\'Angelo')
    ),
    email: fc.option(fc.emailAddress(), { nil: null }),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 20 }), { nil: null }),
    ageType: fc.constantFrom('adult', 'child', 'senior') as fc.Arbitrary<'adult' | 'child' | 'senior'>,
    guestType: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    dietaryRestrictions: fc.option(
      fc.oneof(
        fc.string({ maxLength: 200 }),
        fc.constant('No dairy, no nuts'),
        fc.constant('Gluten-free, vegan'),
        fc.constant('Allergic to "shellfish"')
      ),
      { nil: null }
    ),
    plusOneName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    plusOneAttending: fc.boolean(),
    arrivalDate: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    departureDate: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    airportCode: fc.option(fc.constantFrom('SJO', 'LIR', 'Other'), { nil: null }) as fc.Arbitrary<'SJO' | 'LIR' | 'Other' | null>,
    flightNumber: fc.option(fc.string({ minLength: 4, maxLength: 10 }), { nil: null }),
    invitationSent: fc.boolean(),
    invitationSentDate: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    rsvpDeadline: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]), { nil: null }),
    notes: fc.option(
      fc.oneof(
        fc.string({ maxLength: 500 }),
        fc.constant('Needs wheelchair access, arriving early'),
        fc.constant('Prefers "vegetarian" meals'),
        fc.constant('Contact via email, not phone')
      ),
      { nil: null }
    ),
    createdAt: fc.date().map(d => d.toISOString()),
    updatedAt: fc.date().map(d => d.toISOString()),
  });

  it('should produce CSV with proper header row for any guest array', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 0, maxLength: 50 }),
        async (guests) => {
          const result = await exportToCSV(guests);

          expect(result.success).toBe(true);
          if (!result.success) return;

          const lines = result.data.split('\n').filter(line => line.trim().length > 0);
          
          // Should have at least header row
          expect(lines.length).toBeGreaterThanOrEqual(1);

          // First line should be the header
          const headerLine = lines[0];
          expect(headerLine).toBe(EXPECTED_HEADERS.join(','));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce correct number of data rows for any guest array', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 0, maxLength: 50 }),
        async (guests) => {
          const result = await exportToCSV(guests);

          expect(result.success).toBe(true);
          if (!result.success) return;

          const lines = result.data.split('\n').filter(line => line.trim().length > 0);
          
          // Should have header + one row per guest
          expect(lines.length).toBe(guests.length + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should properly escape fields containing commas', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestWithSpecialCharsArbitrary, { minLength: 1, maxLength: 20 }),
        async (guests) => {
          const result = await exportToCSV(guests);

          expect(result.success).toBe(true);
          if (!result.success) return;

          // Check that fields with commas are properly quoted
          const csvContent = result.data;
          
          guests.forEach(guest => {
            if (guest.dietaryRestrictions && guest.dietaryRestrictions.includes(',')) {
              // Field with comma should be wrapped in quotes
              // If it also contains quotes, those should be doubled
              const escaped = guest.dietaryRestrictions.replace(/"/g, '""');
              expect(csvContent).toContain(`"${escaped}"`);
            }
            if (guest.notes && guest.notes.includes(',')) {
              // Field with comma should be wrapped in quotes
              // If it also contains quotes, those should be doubled
              const escaped = guest.notes.replace(/"/g, '""');
              expect(csvContent).toContain(`"${escaped}"`);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should properly escape fields containing quotes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestWithSpecialCharsArbitrary, { minLength: 1, maxLength: 20 }),
        async (guests) => {
          const result = await exportToCSV(guests);

          expect(result.success).toBe(true);
          if (!result.success) return;

          const csvContent = result.data;
          
          guests.forEach(guest => {
            if (guest.dietaryRestrictions && guest.dietaryRestrictions.includes('"')) {
              // Quotes should be doubled and field wrapped in quotes
              const escaped = guest.dietaryRestrictions.replace(/"/g, '""');
              expect(csvContent).toContain(`"${escaped}"`);
            }
            if (guest.notes && guest.notes.includes('"')) {
              // Quotes should be doubled and field wrapped in quotes
              const escaped = guest.notes.replace(/"/g, '""');
              expect(csvContent).toContain(`"${escaped}"`);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle null values as empty strings in CSV', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 1, maxLength: 20 }),
        async (guests) => {
          const result = await exportToCSV(guests);

          expect(result.success).toBe(true);
          if (!result.success) return;

          const lines = result.data.split('\n').filter(line => line.trim().length > 0);
          
          // Skip header, check data rows
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const guest = guests[i - 1];

            // Parse CSV line (simple parsing for validation)
            const fields = parseCSVLine(line);
            
            // Verify field count matches header count
            expect(fields.length).toBe(EXPECTED_HEADERS.length);

            // Check that null values are represented as empty strings
            if (guest.email === null) {
              expect(fields[3]).toBe(''); // email is 4th field (index 3)
            }
            if (guest.phone === null) {
              expect(fields[4]).toBe(''); // phone is 5th field (index 4)
            }
            if (guest.dietaryRestrictions === null) {
              expect(fields[7]).toBe(''); // dietaryRestrictions is 8th field (index 7)
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce parseable CSV for any guest array', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 0, maxLength: 50 }),
        async (guests) => {
          const result = await exportToCSV(guests);

          expect(result.success).toBe(true);
          if (!result.success) return;

          const lines = result.data.split('\n').filter(line => line.trim().length > 0);
          
          // Each line should be parseable
          lines.forEach((line, index) => {
            const fields = parseCSVLine(line);
            
            // Each line should have the correct number of fields
            expect(fields.length).toBe(EXPECTED_HEADERS.length);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty guest array', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant([]),
        async (guests) => {
          const result = await exportToCSV(guests);

          expect(result.success).toBe(true);
          if (!result.success) return;

          const lines = result.data.split('\n').filter(line => line.trim().length > 0);
          
          // Should only have header row
          expect(lines.length).toBe(1);
          expect(lines[0]).toBe(EXPECTED_HEADERS.join(','));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle large guest arrays', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 50, maxLength: 200 }),
        async (guests) => {
          const result = await exportToCSV(guests);

          expect(result.success).toBe(true);
          if (!result.success) return;

          const lines = result.data.split('\n').filter(line => line.trim().length > 0);
          
          // Should have header + all guest rows
          expect(lines.length).toBe(guests.length + 1);

          // All lines should be parseable
          lines.forEach(line => {
            const fields = parseCSVLine(line);
            expect(fields.length).toBe(EXPECTED_HEADERS.length);
          });
        }
      ),
      { numRuns: 50 } // Fewer runs for large arrays
    );
  });

  it('should preserve boolean values correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 1, maxLength: 20 }),
        async (guests) => {
          const result = await exportToCSV(guests);

          expect(result.success).toBe(true);
          if (!result.success) return;

          const lines = result.data.split('\n').filter(line => line.trim().length > 0);
          
          // Check boolean fields are represented correctly
          for (let i = 1; i < lines.length; i++) {
            const fields = parseCSVLine(lines[i]);
            const guest = guests[i - 1];

            // plusOneAttending (index 9)
            expect(fields[9]).toBe(guest.plusOneAttending.toString());
            
            // invitationSent (index 14)
            expect(fields[14]).toBe(guest.invitationSent.toString());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain field order consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(guestArbitrary, { minLength: 1, maxLength: 20 }),
        async (guests) => {
          const result = await exportToCSV(guests);

          expect(result.success).toBe(true);
          if (!result.success) return;

          const lines = result.data.split('\n').filter(line => line.trim().length > 0);
          
          // Verify field order matches expected headers
          for (let i = 1; i < lines.length; i++) {
            const fields = parseCSVLine(lines[i]);
            const guest = guests[i - 1];

            // Check key fields are in correct positions
            expect(fields[0]).toBe(guest.groupId); // groupId
            expect(fields[1]).toBe(guest.firstName); // firstName
            expect(fields[2]).toBe(guest.lastName); // lastName
            expect(fields[5]).toBe(guest.ageType); // ageType
            expect(fields[6]).toBe(guest.guestType); // guestType
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to parse a CSV line handling quoted fields.
 * This is a simplified parser for test validation purposes.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field delimiter
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Add last field
  fields.push(currentField);

  return fields;
}
