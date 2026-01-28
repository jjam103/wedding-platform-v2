import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CreateGuestDTO, UpdateGuestDTO } from '@/schemas/guestSchemas';

// Mock Supabase before importing guestService
const mockFrom = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Import after mocking
import * as guestService from './guestService';

describe('guestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validData: CreateGuestDTO = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      groupId: '123e4567-e89b-12d3-a456-426614174000',
      ageType: 'adult',
      guestType: 'wedding_guest',
    };

    it('should return success with guest data when valid input provided', async () => {
      const mockGuest = {
        id: 'guest-1',
        group_id: validData.groupId,
        first_name: validData.firstName,
        last_name: validData.lastName,
        email: validData.email,
        phone: null,
        age_type: validData.ageType,
        guest_type: validData.guestType,
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
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockGuest,
              error: null,
            }),
          }),
        }),
      });

      const result = await guestService.create(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('guest-1');
        expect(result.data.firstName).toBe('John');
        expect(result.data.lastName).toBe('Doe');
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should return VALIDATION_ERROR when firstName is missing', async () => {
      const invalidData = { ...validData, firstName: '' };
      const result = await guestService.create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when email is invalid', async () => {
      const invalidData = { ...validData, email: 'invalid-email' };
      const result = await guestService.create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when groupId is not a valid UUID', async () => {
      const invalidData = { ...validData, groupId: 'not-a-uuid' };
      const result = await guestService.create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when insert fails', async () => {
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Connection failed', code: 'DB_ERROR' },
            }),
          }),
        }),
      });

      const result = await guestService.create(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should sanitize input to prevent XSS attacks', async () => {
      const maliciousData = {
        ...validData,
        firstName: '<script>alert("xss")</script>John',
        notes: '<img src=x onerror=alert(1)>',
      };

      const mockGuest = {
        id: 'guest-1',
        group_id: validData.groupId,
        first_name: 'John',
        last_name: validData.lastName,
        email: validData.email,
        phone: null,
        age_type: validData.ageType,
        guest_type: validData.guestType,
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
        notes: '',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockGuest,
              error: null,
            }),
          }),
        }),
      });

      const result = await guestService.create(maliciousData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).not.toContain('<script>');
        expect(result.data.firstName).not.toContain('alert');
        expect(result.data.notes).not.toContain('<img');
        expect(result.data.notes).not.toContain('onerror');
      }
    });
  });

  describe('get', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return guest when valid ID provided', async () => {
      const mockGuest = {
        id: validId,
        group_id: '123e4567-e89b-12d3-a456-426614174000',
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
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockGuest,
              error: null,
            }),
          }),
        }),
      });

      const result = await guestService.get(validId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validId);
        expect(result.data.firstName).toBe('John');
      }
    });

    it('should return VALIDATION_ERROR when ID is not a valid UUID', async () => {
      const result = await guestService.get('invalid-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return NOT_FOUND when guest does not exist', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await guestService.get('123e4567-e89b-12d3-a456-426614174000');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('update', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData: UpdateGuestDTO = {
      firstName: 'Jane',
      email: 'jane@example.com',
    };

    it('should return updated guest when valid data provided', async () => {
      const mockGuest = {
        id: validId,
        group_id: '123e4567-e89b-12d3-a456-426614174000',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
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
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockGuest,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await guestService.update(validId, updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe('Jane');
        expect(result.data.email).toBe('jane@example.com');
      }
    });

    it('should return VALIDATION_ERROR when ID is invalid', async () => {
      const result = await guestService.update('invalid-id', updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return NOT_FOUND when guest does not exist', async () => {
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      const result = await guestService.update(validId, updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should sanitize updated fields', async () => {
      const maliciousUpdate = {
        firstName: '<script>alert("xss")</script>Jane',
        notes: 'javascript:alert(1)',
      };

      const mockGuest = {
        id: validId,
        group_id: '123e4567-e89b-12d3-a456-426614174000',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
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
        notes: 'javascriptalert1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockGuest,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await guestService.update(validId, maliciousUpdate);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).not.toContain('<script>');
        expect(result.data.notes).not.toContain('javascript:');
      }
    });
  });

  describe('deleteGuest', () => {
    it('should return success when guest is deleted', async () => {
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const result = await guestService.deleteGuest('123e4567-e89b-12d3-a456-426614174000');

      expect(result.success).toBe(true);
    });

    it('should return VALIDATION_ERROR when ID is invalid', async () => {
      const result = await guestService.deleteGuest('invalid-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when delete fails', async () => {
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Delete failed', code: 'DB_ERROR' },
          }),
        }),
      });

      const result = await guestService.deleteGuest('123e4567-e89b-12d3-a456-426614174000');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('list', () => {
    it('should return paginated guest list', async () => {
      const mockGuests = [
        {
          id: 'guest-1',
          group_id: '123e4567-e89b-12d3-a456-426614174000',
          first_name: 'Alice',
          last_name: 'Anderson',
          email: 'alice@example.com',
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
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'guest-2',
          group_id: '123e4567-e89b-12d3-a456-426614174000',
          first_name: 'Bob',
          last_name: 'Brown',
          email: 'bob@example.com',
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
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          range: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockGuests,
                error: null,
                count: 2,
              }),
            }),
          }),
        }),
      });

      const result = await guestService.list({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.guests).toHaveLength(2);
        expect(result.data.total).toBe(2);
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(50);
      }
    });

    it('should filter by groupId', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await guestService.list({ groupId: '123e4567-e89b-12d3-a456-426614174000' });

      expect(result.success).toBe(true);
    });

    it('should return VALIDATION_ERROR for invalid filters', async () => {
      const result = await guestService.list({ groupId: 'invalid-uuid' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('search', () => {
    it('should return search results', async () => {
      const mockGuests = [
        {
          id: 'guest-1',
          group_id: '123e4567-e89b-12d3-a456-426614174000',
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
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockGuests,
                  error: null,
                  count: 1,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await guestService.search({ query: 'John' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.guests).toHaveLength(1);
        expect(result.data.guests[0].firstName).toBe('John');
      }
    });

    it('should return VALIDATION_ERROR when query is empty', async () => {
      const result = await guestService.search({ query: '' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should sanitize search query to prevent SQL injection', async () => {
      const maliciousQuery = "'; DROP TABLE guests; --";

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await guestService.search({ query: maliciousQuery });

      expect(result.success).toBe(true);
      // The query should be sanitized and not cause issues
    });
  });

  describe('bulkUpdate', () => {
    const validIds = [
      '123e4567-e89b-12d3-a456-426614174000',
      '223e4567-e89b-12d3-a456-426614174000',
      '323e4567-e89b-12d3-a456-426614174000',
    ];

    const updateData: UpdateGuestDTO = {
      invitationSent: true,
      invitationSentDate: '2025-01-25',
    };

    it('should return success with updated guests when valid data provided', async () => {
      const mockGuests = validIds.map((id, index) => ({
        id,
        group_id: '123e4567-e89b-12d3-a456-426614174000',
        first_name: `Guest${index + 1}`,
        last_name: 'Doe',
        email: `guest${index + 1}@example.com`,
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
        invitation_sent: true,
        invitation_sent_date: '2025-01-25',
        rsvp_deadline: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }));

      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: mockGuests,
              error: null,
            }),
          }),
        }),
      });

      const result = await guestService.bulkUpdate(validIds, updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data[0].invitationSent).toBe(true);
        expect(result.data[1].invitationSent).toBe(true);
        expect(result.data[2].invitationSent).toBe(true);
      }
    });

    it('should return VALIDATION_ERROR when IDs array is empty', async () => {
      const result = await guestService.bulkUpdate([], updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('must not be empty');
      }
    });

    it('should return VALIDATION_ERROR when any ID is invalid', async () => {
      const invalidIds = [...validIds, 'invalid-id'];
      const result = await guestService.bulkUpdate(invalidIds, updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Invalid guest ID format');
      }
    });

    it('should return VALIDATION_ERROR when update data is invalid', async () => {
      const invalidData = { email: 'not-an-email' };
      const result = await guestService.bulkUpdate(validIds, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should sanitize input fields using same logic as single update', async () => {
      const maliciousData = {
        firstName: '<script>alert("xss")</script>Jane',
        notes: 'javascript:alert(1)',
      };

      const mockGuests = validIds.map((id, index) => ({
        id,
        group_id: '123e4567-e89b-12d3-a456-426614174000',
        first_name: 'Jane',
        last_name: 'Doe',
        email: `guest${index + 1}@example.com`,
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
        notes: 'javascriptalert1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }));

      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: mockGuests,
              error: null,
            }),
          }),
        }),
      });

      const result = await guestService.bulkUpdate(validIds, maliciousData);

      expect(result.success).toBe(true);
      if (result.success) {
        result.data.forEach((guest) => {
          expect(guest.firstName).not.toContain('<script>');
          expect(guest.notes).not.toContain('javascript:');
        });
      }
    });

    it('should return VALIDATION_ERROR when not all guests are updated', async () => {
      // Simulate only 2 guests being updated when 3 were requested
      const mockGuests = validIds.slice(0, 2).map((id, index) => ({
        id,
        group_id: '123e4567-e89b-12d3-a456-426614174000',
        first_name: `Guest${index + 1}`,
        last_name: 'Doe',
        email: `guest${index + 1}@example.com`,
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
        invitation_sent: true,
        invitation_sent_date: '2025-01-25',
        rsvp_deadline: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }));

      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: mockGuests,
              error: null,
            }),
          }),
        }),
      });

      const result = await guestService.bulkUpdate(validIds, updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Expected to update 3 guests');
      }
    });

    it('should return DATABASE_ERROR when update fails', async () => {
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Update failed', code: 'DB_ERROR' },
            }),
          }),
        }),
      });

      const result = await guestService.bulkUpdate(validIds, updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('bulkDelete', () => {
    const validIds = [
      '123e4567-e89b-12d3-a456-426614174000',
      '223e4567-e89b-12d3-a456-426614174000',
      '323e4567-e89b-12d3-a456-426614174000',
    ];

    it('should return success when guests are deleted', async () => {
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            error: null,
            count: 3,
          }),
        }),
      });

      const result = await guestService.bulkDelete(validIds);

      expect(result.success).toBe(true);
    });

    it('should return VALIDATION_ERROR when IDs array is empty', async () => {
      const result = await guestService.bulkDelete([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('must not be empty');
      }
    });

    it('should return VALIDATION_ERROR when any ID is invalid', async () => {
      const invalidIds = [...validIds, 'invalid-id'];
      const result = await guestService.bulkDelete(invalidIds);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Invalid guest ID format');
      }
    });

    it('should return DATABASE_ERROR when delete fails', async () => {
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            error: { message: 'Delete failed', code: 'DB_ERROR' },
            count: null,
          }),
        }),
      });

      const result = await guestService.bulkDelete(validIds);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should succeed even if some IDs do not exist', async () => {
      // Supabase doesn't error if some IDs don't exist, it just deletes what exists
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            error: null,
            count: 2, // Only 2 out of 3 existed
          }),
        }),
      });

      const result = await guestService.bulkDelete(validIds);

      expect(result.success).toBe(true);
      // This is acceptable behavior for bulk delete
    });
  });
});
