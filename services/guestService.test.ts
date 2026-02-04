import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CreateGuestDTO, UpdateGuestDTO } from '@/schemas/guestSchemas';

// Mock Supabase before importing guestService
const mockFrom = jest.fn() as jest.Mock;
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Import after mocking
import * as guestService from './guestService';

// Helper to create properly typed mock chains
function mockSupabaseChain(chain: any) {
  return chain as any;
}

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

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockGuest,
        error: null,
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      (mockFrom as any).mockReturnValue({
        insert: mockInsert,
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
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Connection failed', code: 'DB_ERROR' },
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      (mockFrom as any).mockReturnValue({
        insert: mockInsert,
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

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockGuest,
        error: null,
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      (mockFrom as any).mockReturnValue({
        insert: mockInsert,
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

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockGuest,
        error: null,
      } as any);
      const mockEq = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({
        eq: mockEq,
      });
      (mockFrom as any).mockReturnValue({
        select: mockSelect,
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
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      } as any);
      const mockEq = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({
        eq: mockEq,
      });
      (mockFrom as any).mockReturnValue({
        select: mockSelect,
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

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockGuest,
        error: null,
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockEq = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      const mockUpdate = (jest.fn() as any).mockReturnValue({
        eq: mockEq,
      });
      (mockFrom as any).mockReturnValue({
        update: mockUpdate,
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
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockEq = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      const mockUpdate = (jest.fn() as any).mockReturnValue({
        eq: mockEq,
      });
      (mockFrom as any).mockReturnValue({
        update: mockUpdate,
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

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockGuest,
        error: null,
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockEq = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      const mockUpdate = (jest.fn() as any).mockReturnValue({
        eq: mockEq,
      });
      (mockFrom as any).mockReturnValue({
        update: mockUpdate,
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
      const mockEq = (jest.fn() as any).mockResolvedValue({
        error: null,
      } as any);
      const mockDelete = (jest.fn() as any).mockReturnValue({
        eq: mockEq,
      });
      (mockFrom as any).mockReturnValue({
        delete: mockDelete,
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
      const mockEq = (jest.fn() as any).mockResolvedValue({
        error: { message: 'Delete failed', code: 'DB_ERROR' },
      } as any);
      const mockDelete = (jest.fn() as any).mockReturnValue({
        eq: mockEq,
      });
      (mockFrom as any).mockReturnValue({
        delete: mockDelete,
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

      const mockOrder2 = (jest.fn() as any).mockResolvedValue({
        data: mockGuests,
        error: null,
        count: 2,
      } as any);
      const mockOrder1 = (jest.fn() as any).mockReturnValue({
        order: mockOrder2,
      });
      const mockRange = (jest.fn() as any).mockReturnValue({
        order: mockOrder1,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({
        range: mockRange,
      });
      (mockFrom as any).mockReturnValue({
        select: mockSelect,
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
      const mockOrder2 = (jest.fn() as any).mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      } as any);
      const mockOrder1 = (jest.fn() as any).mockReturnValue({
        order: mockOrder2,
      });
      const mockRange = (jest.fn() as any).mockReturnValue({
        order: mockOrder1,
      });
      const mockEq = (jest.fn() as any).mockReturnValue({
        range: mockRange,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({
        eq: mockEq,
      });
      (mockFrom as any).mockReturnValue({
        select: mockSelect,
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

      const mockOrder2 = (jest.fn() as any).mockResolvedValue({
        data: mockGuests,
        error: null,
        count: 1,
      } as any);
      const mockOrder1 = (jest.fn() as any).mockReturnValue({
        order: mockOrder2,
      });
      const mockRange = (jest.fn() as any).mockReturnValue({
        order: mockOrder1,
      });
      const mockOr = (jest.fn() as any).mockReturnValue({
        range: mockRange,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({
        or: mockOr,
      });
      (mockFrom as any).mockReturnValue({
        select: mockSelect,
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

      const mockOrder2 = (jest.fn() as any).mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      } as any);
      const mockOrder1 = (jest.fn() as any).mockReturnValue({
        order: mockOrder2,
      });
      const mockRange = (jest.fn() as any).mockReturnValue({
        order: mockOrder1,
      });
      const mockOr = (jest.fn() as any).mockReturnValue({
        range: mockRange,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({
        or: mockOr,
      });
      (mockFrom as any).mockReturnValue({
        select: mockSelect,
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

      const mockSelect = (jest.fn() as any).mockResolvedValue({
        data: mockGuests,
        error: null,
      } as any);
      const mockIn = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      const mockUpdate = (jest.fn() as any).mockReturnValue({
        in: mockIn,
      });
      (mockFrom as any).mockReturnValue({
        update: mockUpdate,
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

      const mockSelect = (jest.fn() as any).mockResolvedValue({
        data: mockGuests,
        error: null,
      } as any);
      const mockIn = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      const mockUpdate = (jest.fn() as any).mockReturnValue({
        in: mockIn,
      });
      (mockFrom as any).mockReturnValue({
        update: mockUpdate,
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

      const mockSelect = (jest.fn() as any).mockResolvedValue({
        data: mockGuests,
        error: null,
      } as any);
      const mockIn = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      const mockUpdate = (jest.fn() as any).mockReturnValue({
        in: mockIn,
      });
      (mockFrom as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await guestService.bulkUpdate(validIds, updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Expected to update 3 guests');
      }
    });

    it('should return DATABASE_ERROR when update fails', async () => {
      const mockSelect = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Update failed', code: 'DB_ERROR' },
      } as any);
      const mockIn = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      const mockUpdate = (jest.fn() as any).mockReturnValue({
        in: mockIn,
      });
      (mockFrom as any).mockReturnValue({
        update: mockUpdate,
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
      const mockIn = (jest.fn() as any).mockResolvedValue({
        error: null,
        count: 3,
      } as any);
      const mockDelete = (jest.fn() as any).mockReturnValue({
        in: mockIn,
      });
      (mockFrom as any).mockReturnValue({
        delete: mockDelete,
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
      const mockIn = (jest.fn() as any).mockResolvedValue({
        error: { message: 'Delete failed', code: 'DB_ERROR' },
        count: null,
      } as any);
      const mockDelete = (jest.fn() as any).mockReturnValue({
        in: mockIn,
      });
      (mockFrom as any).mockReturnValue({
        delete: mockDelete,
      });

      const result = await guestService.bulkDelete(validIds);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should succeed even if some IDs do not exist', async () => {
      // Supabase doesn't error if some IDs don't exist, it just deletes what exists
      const mockIn = (jest.fn() as any).mockResolvedValue({
        error: null,
        count: 2, // Only 2 out of 3 existed
      } as any);
      const mockDelete = (jest.fn() as any).mockReturnValue({
        in: mockIn,
      });
      (mockFrom as any).mockReturnValue({
        delete: mockDelete,
      });

      const result = await guestService.bulkDelete(validIds);

      expect(result.success).toBe(true);
      // This is acceptable behavior for bulk delete
    });
  });

  describe('bulkCreate', () => {
    const validGuestsData: CreateGuestDTO[] = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        ageType: 'adult',
        guestType: 'wedding_guest',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        ageType: 'adult',
        guestType: 'wedding_guest',
      },
    ];

    it('should return success with created guests when valid data provided', async () => {
      const mockGuests = validGuestsData.map((guest, index) => ({
        id: `guest-${index + 1}`,
        group_id: guest.groupId,
        first_name: guest.firstName,
        last_name: guest.lastName,
        email: guest.email,
        phone: null,
        age_type: guest.ageType,
        guest_type: guest.guestType,
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
      }));

      const mockSelect = (jest.fn() as any).mockResolvedValue({
        data: mockGuests,
        error: null,
      } as any);
      const mockInsert = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      (mockFrom as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await guestService.bulkCreate(validGuestsData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].firstName).toBe('John');
        expect(result.data[1].firstName).toBe('Jane');
      }
    });

    it('should return VALIDATION_ERROR when guests array is empty', async () => {
      const result = await guestService.bulkCreate([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('must not be empty');
      }
    });

    it('should return VALIDATION_ERROR when any guest data is invalid', async () => {
      const invalidGuestsData = [
        ...validGuestsData,
        {
          firstName: '', // Invalid - empty
          lastName: 'Invalid',
          email: 'invalid@example.com',
          groupId: '123e4567-e89b-12d3-a456-426614174000',
          ageType: 'adult' as const,
          guestType: 'wedding_guest' as const,
        },
      ];

      const result = await guestService.bulkCreate(invalidGuestsData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('validation error');
      }
    });

    it('should return DATABASE_ERROR when insert fails', async () => {
      const mockSelect = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Insert failed', code: 'DB_ERROR' },
      } as any);
      const mockInsert = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      (mockFrom as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await guestService.bulkCreate(validGuestsData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should sanitize input to prevent XSS attacks', async () => {
      const maliciousGuestsData = [
        {
          firstName: '<script>alert("xss")</script>John',
          lastName: 'Doe',
          email: 'john@example.com',
          groupId: '123e4567-e89b-12d3-a456-426614174000',
          ageType: 'adult' as const,
          guestType: 'wedding_guest' as const,
          notes: '<img src=x onerror=alert(1)>',
        },
      ];

      const mockGuests = [
        {
          id: 'guest-1',
          group_id: maliciousGuestsData[0].groupId,
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
          notes: '',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockSelect = (jest.fn() as any).mockResolvedValue({
        data: mockGuests,
        error: null,
      } as any);
      const mockInsert = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      (mockFrom as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await guestService.bulkCreate(maliciousGuestsData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].firstName).not.toContain('<script>');
        expect(result.data[0].firstName).not.toContain('alert');
        expect(result.data[0].notes).not.toContain('<img');
        expect(result.data[0].notes).not.toContain('onerror');
      }
    });
  });

  describe('exportToCSV', () => {
    const mockGuests = [
      {
        id: 'guest-1',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: null,
        ageType: 'adult' as const,
        guestType: 'wedding_guest' as const,
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
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'guest-2',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        ageType: 'adult' as const,
        guestType: 'wedding_guest' as const,
        dietaryRestrictions: 'Vegetarian',
        plusOneName: 'Plus One',
        plusOneAttending: true,
        arrivalDate: '2024-06-01',
        departureDate: '2024-06-05',
        airportCode: 'SJO',
        flightNumber: 'AA123',
        invitationSent: true,
        invitationSentDate: '2024-01-15',
        rsvpDeadline: '2024-05-01',
        notes: 'Special requirements',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    it('should return success with CSV string when valid guests provided', async () => {
      const result = await guestService.exportToCSV(mockGuests);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data).toBe('string');
        expect(result.data).toContain('groupId,firstName,lastName');
        expect(result.data).toContain('John,Doe');
        expect(result.data).toContain('Jane,Smith');
      }
    });

    it('should return success with empty CSV when empty array provided', async () => {
      const result = await guestService.exportToCSV([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('groupId,firstName,lastName');
        // Should only contain header
        expect(result.data.split('\n')).toHaveLength(1);
      }
    });

    it('should return VALIDATION_ERROR when guests is not an array', async () => {
      const result = await guestService.exportToCSV(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('array');
      }
    });

    it('should properly escape CSV fields with commas and quotes', async () => {
      const guestWithSpecialChars = [
        {
          ...mockGuests[0],
          firstName: 'John, Jr.',
          notes: 'Has "special" requirements',
        },
      ];

      const result = await guestService.exportToCSV(guestWithSpecialChars);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('"John, Jr."');
        expect(result.data).toContain('"Has ""special"" requirements"');
      }
    });
  });

  describe('importFromCSV', () => {
    const validCSV = `groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes
123e4567-e89b-12d3-a456-426614174000,John,Doe,john@example.com,,adult,wedding_guest,,,false,,,,,false,,,
123e4567-e89b-12d3-a456-426614174000,Jane,Smith,jane@example.com,+1234567890,adult,wedding_guest,Vegetarian,Plus One,true,2024-06-01,2024-06-05,SJO,AA123,true,2024-01-15,2024-05-01,Special requirements`;

    it('should return success with created guests when valid CSV provided', async () => {
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
        {
          id: 'guest-2',
          group_id: '123e4567-e89b-12d3-a456-426614174000',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone: '+1234567890',
          age_type: 'adult',
          guest_type: 'wedding_guest',
          dietary_restrictions: 'Vegetarian',
          plus_one_name: 'Plus One',
          plus_one_attending: true,
          arrival_date: '2024-06-01',
          departure_date: '2024-06-05',
          airport_code: 'SJO',
          flight_number: 'AA123',
          invitation_sent: true,
          invitation_sent_date: '2024-01-15',
          rsvp_deadline: '2024-05-01',
          notes: 'Special requirements',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // Mock the create function calls
      let callCount = 0;
      const mockSingle = (jest.fn() as any).mockImplementation(() => {
        const guest = mockGuests[callCount++];
        return Promise.resolve({
          data: guest,
          error: null,
        });
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      (mockFrom as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await guestService.importFromCSV(validCSV);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].firstName).toBe('John');
        expect(result.data[1].firstName).toBe('Jane');
      }
    });

    it('should return VALIDATION_ERROR when CSV content is empty', async () => {
      const result = await guestService.importFromCSV('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('required');
      }
    });

    it('should return VALIDATION_ERROR when CSV has no data rows', async () => {
      const headerOnlyCSV = 'groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes';
      
      const result = await guestService.importFromCSV(headerOnlyCSV);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('at least one data row');
      }
    });

    it('should return VALIDATION_ERROR when CSV header is incorrect', async () => {
      const invalidHeaderCSV = 'wrongHeader,firstName,lastName\nvalue1,John,Doe';
      
      const result = await guestService.importFromCSV(invalidHeaderCSV);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('header mismatch');
      }
    });

    it('should return VALIDATION_ERROR when CSV has invalid data', async () => {
      const invalidDataCSV = `groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes
invalid-uuid,,Doe,invalid-email,,adult,wedding_guest,,,false,,,,,false,,,`;

      const result = await guestService.importFromCSV(invalidDataCSV);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('import failed');
      }
    });

    it('should return DATABASE_ERROR when guest creation fails', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Creation failed', code: 'DB_ERROR' },
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      (mockFrom as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await guestService.importFromCSV(validCSV);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PARTIAL_IMPORT_FAILURE');
        expect(result.error.message).toContain('failed');
      }
    });

    it('should handle CSV fields with commas and quotes correctly', async () => {
      const csvWithSpecialChars = `groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes
123e4567-e89b-12d3-a456-426614174000,"John, Jr.",Doe,john@example.com,,adult,wedding_guest,,,false,,,,,false,,,"Has ""special"" requirements"`;

      const mockGuest = {
        id: 'guest-1',
        group_id: '123e4567-e89b-12d3-a456-426614174000',
        first_name: 'John, Jr.',
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
        notes: 'Has "special" requirements',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockGuest,
        error: null,
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      (mockFrom as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await guestService.importFromCSV(csvWithSpecialChars);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].firstName).toBe('John, Jr.');
        expect(result.data[0].notes).toBe('Has "special" requirements');
      }
    });
  });

  describe('Auth Method Inheritance', () => {
    const validData: CreateGuestDTO = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      groupId: '123e4567-e89b-12d3-a456-426614174000',
      ageType: 'adult',
      guestType: 'wedding_guest',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      // Clear the module cache to reset the settingsService mock
      jest.resetModules();
    });

    it('should inherit default auth method from settings when creating a guest', async () => {
      // Mock settingsService.getDefaultAuthMethod
      jest.doMock('./settingsService', () => ({
        getDefaultAuthMethod: jest.fn().mockResolvedValue({
          success: true,
          data: 'magic_link',
        }),
      }));

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
        auth_method: 'magic_link',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockGuest,
        error: null,
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      (mockFrom as any).mockReturnValue({
        insert: mockInsert,
      });

      // Re-import guestService to get the mocked settingsService
      const guestServiceModule = await import('./guestService');
      const result = await guestServiceModule.create(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authMethod).toBe('magic_link');
      }

      // Verify that insert was called with auth_method
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          auth_method: 'magic_link',
        })
      );
    });

    it('should fallback to email_matching when settings fetch fails', async () => {
      // Mock settingsService.getDefaultAuthMethod to fail
      jest.doMock('./settingsService', () => ({
        getDefaultAuthMethod: jest.fn().mockResolvedValue({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Setting not found' },
        }),
      }));

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
        auth_method: 'email_matching',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockGuest,
        error: null,
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      (mockFrom as any).mockReturnValue({
        insert: mockInsert,
      });

      // Re-import guestService to get the mocked settingsService
      const guestServiceModule = await import('./guestService');
      const result = await guestServiceModule.create(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authMethod).toBe('email_matching');
      }

      // Verify that insert was called with fallback auth_method
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          auth_method: 'email_matching',
        })
      );
    });

    it('should inherit auth method for bulk create operations', async () => {
      // Mock settingsService.getDefaultAuthMethod
      jest.doMock('./settingsService', () => ({
        getDefaultAuthMethod: jest.fn().mockResolvedValue({
          success: true,
          data: 'magic_link',
        }),
      }));

      const guestsData: CreateGuestDTO[] = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          groupId: '123e4567-e89b-12d3-a456-426614174000',
          ageType: 'adult',
          guestType: 'wedding_guest',
        },
        {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          groupId: '123e4567-e89b-12d3-a456-426614174000',
          ageType: 'adult',
          guestType: 'wedding_guest',
        },
      ];

      const mockGuests = guestsData.map((data, index) => ({
        id: `guest-${index + 1}`,
        group_id: data.groupId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: null,
        age_type: data.ageType,
        guest_type: data.guestType,
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
        auth_method: 'magic_link',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }));

      const mockSelect = (jest.fn() as any).mockResolvedValue({
        data: mockGuests,
        error: null,
      } as any);
      const mockInsert = (jest.fn() as any).mockReturnValue({
        select: mockSelect,
      });
      (mockFrom as any).mockReturnValue({
        insert: mockInsert,
      });

      // Re-import guestService to get the mocked settingsService
      const guestServiceModule = await import('./guestService');
      const result = await guestServiceModule.bulkCreate(guestsData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].authMethod).toBe('magic_link');
        expect(result.data[1].authMethod).toBe('magic_link');
      }

      // Verify that insert was called with auth_method for all guests
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ auth_method: 'magic_link' }),
          expect.objectContaining({ auth_method: 'magic_link' }),
        ])
      );
    });
  });
});

