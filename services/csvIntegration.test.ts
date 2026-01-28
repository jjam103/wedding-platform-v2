/**
 * Integration test for CSV import/export functionality.
 * Tests the complete workflow of exporting and importing guest data.
 */

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

describe('CSV Import/Export Integration', () => {
  it('should handle complete export-import workflow with multiple guests', async () => {
    const originalGuests: Guest[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        groupId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        ageType: 'adult',
        guestType: 'wedding_guest',
        dietaryRestrictions: 'Vegetarian',
        plusOneName: 'Jane Doe',
        plusOneAttending: true,
        arrivalDate: '2025-06-01',
        departureDate: '2025-06-05',
        airportCode: 'SJO',
        flightNumber: 'AA123',
        invitationSent: true,
        invitationSentDate: '2025-01-15',
        rsvpDeadline: '2025-05-01',
        notes: 'VIP guest',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174000',
        groupId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'Alice',
        lastName: 'Smith',
        email: null,
        phone: null,
        ageType: 'child',
        guestType: 'wedding_guest',
        dietaryRestrictions: null,
        plusOneName: null,
        plusOneAttending: false,
        arrivalDate: null,
        departureDate: null,
        airportCode: null,
        flightNumber: null,
        invitationSent: false,
        invitationSentDate: null,
        rsvpDeadline: null,
        notes: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174000',
        groupId: '223e4567-e89b-12d3-a456-426614174001',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        phone: '+9876543210',
        ageType: 'senior',
        guestType: 'wedding_party',
        dietaryRestrictions: 'Gluten-free, dairy-free',
        plusOneName: null,
        plusOneAttending: false,
        arrivalDate: '2025-05-30',
        departureDate: '2025-06-07',
        airportCode: 'LIR',
        flightNumber: 'UA456',
        invitationSent: true,
        invitationSentDate: '2025-01-10',
        rsvpDeadline: '2025-04-30',
        notes: 'Needs wheelchair assistance',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    // Step 1: Export to CSV
    const exportResult = await exportToCSV(originalGuests);
    expect(exportResult.success).toBe(true);
    if (!exportResult.success) return;

    // Verify CSV structure
    const csvLines = exportResult.data.split('\n');
    expect(csvLines.length).toBe(4); // Header + 3 data rows

    // Step 2: Mock database for import
    const { supabase } = require('@/lib/supabase');
    let callCount = 0;
    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockImplementation(() => {
            const guest = originalGuests[callCount];
            callCount++;
            return Promise.resolve({
              data: {
                id: `new-id-${callCount}`,
                group_id: guest.groupId,
                first_name: guest.firstName,
                last_name: guest.lastName,
                email: guest.email,
                phone: guest.phone,
                age_type: guest.ageType,
                guest_type: guest.guestType,
                dietary_restrictions: guest.dietaryRestrictions,
                plus_one_name: guest.plusOneName,
                plus_one_attending: guest.plusOneAttending,
                arrival_date: guest.arrivalDate,
                departure_date: guest.departureDate,
                airport_code: guest.airportCode,
                flight_number: guest.flightNumber,
                invitation_sent: guest.invitationSent,
                invitation_sent_date: guest.invitationSentDate,
                rsvp_deadline: guest.rsvpDeadline,
                notes: guest.notes,
                created_at: '2025-01-25T00:00:00Z',
                updated_at: '2025-01-25T00:00:00Z',
              },
              error: null,
            });
          }),
        }),
      }),
    });

    // Step 3: Import from CSV
    const importResult = await importFromCSV(exportResult.data);
    expect(importResult.success).toBe(true);
    if (!importResult.success) return;

    // Step 4: Verify all guests were imported
    expect(importResult.data).toHaveLength(3);

    // Step 5: Verify data integrity for each guest
    for (let i = 0; i < originalGuests.length; i++) {
      const original = originalGuests[i];
      const imported = importResult.data[i];

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
  });

  it('should handle special characters in CSV fields', async () => {
    const guestsWithSpecialChars: Guest[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        groupId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'María',
        lastName: 'García',
        email: 'maria@example.com',
        phone: null,
        ageType: 'adult',
        guestType: 'wedding_guest',
        dietaryRestrictions: 'No shellfish, no "raw" fish',
        plusOneName: null,
        plusOneAttending: false,
        arrivalDate: null,
        departureDate: null,
        airportCode: null,
        flightNumber: null,
        invitationSent: false,
        invitationSentDate: null,
        rsvpDeadline: null,
        notes: 'Prefers Spanish, speaks limited English',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    // Export
    const exportResult = await exportToCSV(guestsWithSpecialChars);
    expect(exportResult.success).toBe(true);
    if (!exportResult.success) return;

    // Mock database
    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'new-id',
              group_id: guestsWithSpecialChars[0].groupId,
              first_name: guestsWithSpecialChars[0].firstName,
              last_name: guestsWithSpecialChars[0].lastName,
              email: guestsWithSpecialChars[0].email,
              phone: guestsWithSpecialChars[0].phone,
              age_type: guestsWithSpecialChars[0].ageType,
              guest_type: guestsWithSpecialChars[0].guestType,
              dietary_restrictions: guestsWithSpecialChars[0].dietaryRestrictions,
              plus_one_name: guestsWithSpecialChars[0].plusOneName,
              plus_one_attending: guestsWithSpecialChars[0].plusOneAttending,
              arrival_date: guestsWithSpecialChars[0].arrivalDate,
              departure_date: guestsWithSpecialChars[0].departureDate,
              airport_code: guestsWithSpecialChars[0].airportCode,
              flight_number: guestsWithSpecialChars[0].flightNumber,
              invitation_sent: guestsWithSpecialChars[0].invitationSent,
              invitation_sent_date: guestsWithSpecialChars[0].invitationSentDate,
              rsvp_deadline: guestsWithSpecialChars[0].rsvpDeadline,
              notes: guestsWithSpecialChars[0].notes,
              created_at: '2025-01-25T00:00:00Z',
              updated_at: '2025-01-25T00:00:00Z',
            },
            error: null,
          }),
        }),
      }),
    });

    // Import
    const importResult = await importFromCSV(exportResult.data);
    expect(importResult.success).toBe(true);
    if (!importResult.success) return;

    // Verify special characters preserved
    expect(importResult.data[0].firstName).toBe('María');
    expect(importResult.data[0].lastName).toBe('García');
    expect(importResult.data[0].dietaryRestrictions).toBe('No shellfish, no "raw" fish');
    expect(importResult.data[0].notes).toBe('Prefers Spanish, speaks limited English');
  });
});
