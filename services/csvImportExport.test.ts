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

describe('guestService CSV Import/Export', () => {
  describe('exportToCSV', () => {
    it('should export guests to valid CSV format', async () => {
      const guests: Guest[] = [
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
      ];

      const result = await exportToCSV(guests);

      expect(result.success).toBe(true);
      if (result.success) {
        const lines = result.data.split('\n');
        expect(lines.length).toBe(2); // Header + 1 data row
        
        // Check header
        expect(lines[0]).toBe(
          'groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes'
        );
        
        // Check data row
        expect(lines[1]).toContain('John');
        expect(lines[1]).toContain('Doe');
        expect(lines[1]).toContain('john@example.com');
      }
    });

    it('should handle guests with null values', async () => {
      const guests: Guest[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          groupId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'Jane',
          lastName: 'Smith',
          email: null,
          phone: null,
          ageType: 'adult',
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
      ];

      const result = await exportToCSV(guests);

      expect(result.success).toBe(true);
      if (result.success) {
        const lines = result.data.split('\n');
        expect(lines.length).toBe(2);
        
        // Null values should be empty strings in CSV
        const fields = lines[1].split(',');
        expect(fields[3]).toBe(''); // email
        expect(fields[4]).toBe(''); // phone
      }
    });

    it('should escape fields containing commas', async () => {
      const guests: Guest[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          groupId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: null,
          ageType: 'adult',
          guestType: 'wedding_guest',
          dietaryRestrictions: 'No dairy, no nuts',
          plusOneName: null,
          plusOneAttending: false,
          arrivalDate: null,
          departureDate: null,
          airportCode: null,
          flightNumber: null,
          invitationSent: false,
          invitationSentDate: null,
          rsvpDeadline: null,
          notes: 'Needs wheelchair access, arriving early',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const result = await exportToCSV(guests);

      expect(result.success).toBe(true);
      if (result.success) {
        // Fields with commas should be wrapped in quotes
        expect(result.data).toContain('"No dairy, no nuts"');
        expect(result.data).toContain('"Needs wheelchair access, arriving early"');
      }
    });

    it('should escape fields containing quotes', async () => {
      const guests: Guest[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          groupId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'John',
          lastName: 'O\'Brien',
          email: 'john@example.com',
          phone: null,
          ageType: 'adult',
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
          notes: 'Prefers "vegetarian" meals',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const result = await exportToCSV(guests);

      expect(result.success).toBe(true);
      if (result.success) {
        // Fields with quotes should be wrapped and quotes doubled
        expect(result.data).toContain('""vegetarian""');
      }
    });

    it('should handle empty array', async () => {
      const result = await exportToCSV([]);

      expect(result.success).toBe(true);
      if (result.success) {
        const lines = result.data.split('\n');
        expect(lines.length).toBe(1); // Only header
      }
    });

    it('should return validation error for non-array input', async () => {
      const result = await exportToCSV(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('importFromCSV', () => {
    beforeEach(() => {
      // Reset mock
      const { supabase } = require('@/lib/supabase');
      supabase.from.mockClear();
    });

    it('should import valid CSV data', async () => {
      const csvContent = `groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes
123e4567-e89b-12d3-a456-426614174001,John,Doe,john@example.com,+1234567890,adult,wedding_guest,Vegetarian,Jane Doe,true,2025-06-01,2025-06-05,SJO,AA123,true,2025-01-15,2025-05-01,VIP guest`;

      // Mock successful database insert
      const { supabase } = require('@/lib/supabase');
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                group_id: '123e4567-e89b-12d3-a456-426614174001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                age_type: 'adult',
                guest_type: 'wedding_guest',
                dietary_restrictions: 'Vegetarian',
                plus_one_name: 'Jane Doe',
                plus_one_attending: true,
                arrival_date: '2025-06-01',
                departure_date: '2025-06-05',
                airport_code: 'SJO',
                flight_number: 'AA123',
                invitation_sent: true,
                invitation_sent_date: '2025-01-15',
                rsvp_deadline: '2025-05-01',
                notes: 'VIP guest',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await importFromCSV(csvContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].firstName).toBe('John');
        expect(result.data[0].lastName).toBe('Doe');
      }
    });

    it('should handle CSV with null values', async () => {
      const csvContent = `groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes
123e4567-e89b-12d3-a456-426614174001,Jane,Smith,,,adult,wedding_guest,,,false,,,,,false,,,`;

      const { supabase } = require('@/lib/supabase');
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                group_id: '123e4567-e89b-12d3-a456-426614174001',
                first_name: 'Jane',
                last_name: 'Smith',
                email: null,
                phone: null,
                age_type: 'adult',
                guest_type: 'wedding_guest',
                dietary_restrictions: null,
                plus_one_name: null,
                plus_one_attending: false,
                arrival_date: null,
                departure_date: null,
                airport_code: null,
                flight_number: null,
                invitation_sent: false,
                invitation_sent_date: null,
                rsvp_deadline: null,
                notes: null,
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await importFromCSV(csvContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].email).toBeNull();
        expect(result.data[0].phone).toBeNull();
      }
    });

    it('should handle CSV with quoted fields containing commas', async () => {
      const csvContent = `groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes
123e4567-e89b-12d3-a456-426614174001,John,Doe,john@example.com,,adult,wedding_guest,"No dairy, no nuts",,false,,,,,false,,,"Needs wheelchair access, arriving early"`;

      const { supabase } = require('@/lib/supabase');
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                group_id: '123e4567-e89b-12d3-a456-426614174001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: null,
                age_type: 'adult',
                guest_type: 'wedding_guest',
                dietary_restrictions: 'No dairy, no nuts',
                plus_one_name: null,
                plus_one_attending: false,
                arrival_date: null,
                departure_date: null,
                airport_code: null,
                flight_number: null,
                invitation_sent: false,
                invitation_sent_date: null,
                rsvp_deadline: null,
                notes: 'Needs wheelchair access, arriving early',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await importFromCSV(csvContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].dietaryRestrictions).toBe('No dairy, no nuts');
        expect(result.data[0].notes).toBe('Needs wheelchair access, arriving early');
      }
    });

    it('should return validation error for empty CSV', async () => {
      const result = await importFromCSV('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return validation error for CSV with only header', async () => {
      const csvContent = `groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes`;

      const result = await importFromCSV(csvContent);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('at least one data row');
      }
    });

    it('should return validation error for mismatched headers', async () => {
      const csvContent = `firstName,lastName,email
John,Doe,john@example.com`;

      const result = await importFromCSV(csvContent);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('header mismatch');
      }
    });

    it('should return validation error for invalid data', async () => {
      const csvContent = `groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes
invalid-uuid,John,Doe,invalid-email,,adult,wedding_guest,,,false,,,,,false,,,`;

      const result = await importFromCSV(csvContent);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('failed');
      }
    });

    it('should skip empty lines in CSV', async () => {
      const csvContent = `groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes

123e4567-e89b-12d3-a456-426614174001,John,Doe,john@example.com,,adult,wedding_guest,,,false,,,,,false,,,

`;

      const { supabase } = require('@/lib/supabase');
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                group_id: '123e4567-e89b-12d3-a456-426614174001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: null,
                age_type: 'adult',
                guest_type: 'wedding_guest',
                dietary_restrictions: null,
                plus_one_name: null,
                plus_one_attending: false,
                arrival_date: null,
                departure_date: null,
                airport_code: null,
                flight_number: null,
                invitation_sent: false,
                invitation_sent_date: null,
                rsvp_deadline: null,
                notes: null,
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await importFromCSV(csvContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe('CSV Round-Trip', () => {
    it('should preserve data through export and import', async () => {
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
      ];

      // Export to CSV
      const exportResult = await exportToCSV(originalGuests);
      expect(exportResult.success).toBe(true);
      if (!exportResult.success) return;

      // Mock database for import
      const { supabase } = require('@/lib/supabase');
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: '123e4567-e89b-12d3-a456-426614174002',
                group_id: originalGuests[0].groupId,
                first_name: originalGuests[0].firstName,
                last_name: originalGuests[0].lastName,
                email: originalGuests[0].email,
                phone: originalGuests[0].phone,
                age_type: originalGuests[0].ageType,
                guest_type: originalGuests[0].guestType,
                dietary_restrictions: originalGuests[0].dietaryRestrictions,
                plus_one_name: originalGuests[0].plusOneName,
                plus_one_attending: originalGuests[0].plusOneAttending,
                arrival_date: originalGuests[0].arrivalDate,
                departure_date: originalGuests[0].departureDate,
                airport_code: originalGuests[0].airportCode,
                flight_number: originalGuests[0].flightNumber,
                invitation_sent: originalGuests[0].invitationSent,
                invitation_sent_date: originalGuests[0].invitationSentDate,
                rsvp_deadline: originalGuests[0].rsvpDeadline,
                notes: originalGuests[0].notes,
                created_at: '2025-01-25T00:00:00Z',
                updated_at: '2025-01-25T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      // Import from CSV
      const importResult = await importFromCSV(exportResult.data);
      expect(importResult.success).toBe(true);
      if (!importResult.success) return;

      // Verify data integrity (excluding id, createdAt, updatedAt which are generated)
      const imported = importResult.data[0];
      expect(imported.groupId).toBe(originalGuests[0].groupId);
      expect(imported.firstName).toBe(originalGuests[0].firstName);
      expect(imported.lastName).toBe(originalGuests[0].lastName);
      expect(imported.email).toBe(originalGuests[0].email);
      expect(imported.phone).toBe(originalGuests[0].phone);
      expect(imported.ageType).toBe(originalGuests[0].ageType);
      expect(imported.guestType).toBe(originalGuests[0].guestType);
      expect(imported.dietaryRestrictions).toBe(originalGuests[0].dietaryRestrictions);
      expect(imported.plusOneName).toBe(originalGuests[0].plusOneName);
      expect(imported.plusOneAttending).toBe(originalGuests[0].plusOneAttending);
      expect(imported.arrivalDate).toBe(originalGuests[0].arrivalDate);
      expect(imported.departureDate).toBe(originalGuests[0].departureDate);
      expect(imported.airportCode).toBe(originalGuests[0].airportCode);
      expect(imported.flightNumber).toBe(originalGuests[0].flightNumber);
      expect(imported.invitationSent).toBe(originalGuests[0].invitationSent);
      expect(imported.invitationSentDate).toBe(originalGuests[0].invitationSentDate);
      expect(imported.rsvpDeadline).toBe(originalGuests[0].rsvpDeadline);
      expect(imported.notes).toBe(originalGuests[0].notes);
    });
  });
});
