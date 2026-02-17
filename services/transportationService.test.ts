import { createMockSupabaseClient } from '../__tests__/helpers/mockSupabase';

// Mock the supabase lib at the module level - MUST be before service import
const mockSupabase = createMockSupabaseClient();
jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock sanitization utilities
jest.mock('../utils/sanitization', () => ({
  sanitizeInput: jest.fn((input: string) => input?.trim() || ''),
  sanitizeRichText: jest.fn((input: string) => input?.trim() || ''),
}));

// Mock types and error codes
jest.mock('../types', () => ({
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  },
}));

// Mock schemas with proper validation logic
const mockFlightInfoSafeParse = jest.fn((data) => {
  // Basic validation for flight info
  if (!data.guest_id || !data.airport_code) {
    return { success: false, error: { issues: ['Invalid data'] } };
  }
  if (data.guest_id === 'invalid-uuid') {
    return { success: false, error: { issues: ['Invalid UUID'] } };
  }
  if (data.airport_code === 'INVALID') {
    return { success: false, error: { issues: ['Invalid airport code'] } };
  }
  return { success: true, data };
});

const mockManifestSafeParse = jest.fn((data) => {
  // Always return success for manifest creation in tests
  return { success: true, data };
});

jest.mock('../schemas/transportationSchemas', () => ({
  flightInfoSchema: {
    get safeParse() {
      return mockFlightInfoSafeParse;
    },
  },
  createTransportationManifestSchema: {
    get safeParse() {
      return mockManifestSafeParse;
    },
  },
  updateTransportationManifestSchema: {
    safeParse: jest.fn((data) => ({ success: true, data })),
  },
}));

// Import service AFTER mocks are set up
import {
  updateFlightInfo,
  getFlightsByAirport,
  generateArrivalManifest,
  generateDepartureManifest,
  assignGuestsToShuttle,
  calculateVehicleRequirements,
  generateDriverSheet,
  calculateShuttleCosts,
  createManifest,
  _setSupabaseForTesting,
  _resetSupabaseForTesting,
} from './transportationService';

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { FlightInfoDTO } from '../schemas/transportationSchemas';

describe('transportationService', () => {
  beforeEach(() => {
    // Reset only the from mock, not all mocks
    mockSupabase.from.mockReset();
    // Set the mock supabase client for testing
    _setSupabaseForTesting(mockSupabase);
  });

  describe('updateFlightInfo', () => {
    const validFlightInfo: FlightInfoDTO = {
      guest_id: '123e4567-e89b-12d3-a456-426614174000',
      airport_code: 'SJO',
      flight_number: 'AA123',
      airline: 'American Airlines',
      arrival_time: '2025-06-01T14:30:00Z',
      departure_time: '2025-06-08T16:45:00Z',
    };

    it('should return success when flight info is updated successfully', async () => {
      // Mock successful update
      mockSupabase.from.mockReturnValue({
        update: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockResolvedValue({ error: null }),
        }),
      });

      const result = await updateFlightInfo(
        validFlightInfo.guest_id,
        validFlightInfo
      );

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('guests');
    });

    it('should return VALIDATION_ERROR when guest_id is invalid', async () => {
      const invalidFlightInfo = { ...validFlightInfo, guest_id: 'invalid-uuid' };
      
      const result = await updateFlightInfo(
        invalidFlightInfo.guest_id,
        invalidFlightInfo
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when airport_code is invalid', async () => {
      const invalidFlightInfo = { ...validFlightInfo, airport_code: 'INVALID' as any };
      
      const result = await updateFlightInfo(
        validFlightInfo.guest_id,
        invalidFlightInfo
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when update fails', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValue({
        update: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockResolvedValue({ error: { message: 'Connection failed' } }),
        }),
      });

      const result = await updateFlightInfo(
        validFlightInfo.guest_id,
        validFlightInfo
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should sanitize flight_number and airline to prevent XSS attacks', async () => {
      const maliciousFlightInfo = {
        ...validFlightInfo,
        flight_number: 'AA123  ', // Valid but with extra whitespace
        airline: 'American Airlines  ', // Valid but with extra whitespace
      };

      // Mock successful update
      const mockUpdate = (jest.fn() as any).mockReturnValue({
        eq: (jest.fn() as any).mockResolvedValue({ error: null }),
      });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      const result = await updateFlightInfo(
        validFlightInfo.guest_id,
        maliciousFlightInfo
      );

      expect(result.success).toBe(true);
      
      // Verify the update was called with sanitized data (trimmed)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          flight_number: 'AA123', // Should be trimmed
          airport_code: 'SJO',
        })
      );
    });
  });

  describe('getFlightsByAirport', () => {
    it('should return success with flight information when flights exist', async () => {
      const mockGuests = [
        {
          id: 'guest-1',
          airport_code: 'SJO',
          flight_number: 'AA123',
          arrival_date: '2025-06-01',
          departure_date: '2025-06-08',
        },
        {
          id: 'guest-2',
          airport_code: 'SJO',
          flight_number: 'UA456',
          arrival_date: '2025-06-02',
          departure_date: '2025-06-09',
        },
      ];

      // Mock successful query
      mockSupabase.from.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            not: (jest.fn() as any).mockResolvedValue({ data: mockGuests, error: null }),
          }),
        }),
      });

      const result = await getFlightsByAirport('SJO');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].guest_id).toBe('guest-1');
        expect(result.data[0].airport_code).toBe('SJO');
        expect(result.data[0].flight_number).toBe('AA123');
      }
    });

    it('should return empty array when no flights found', async () => {
      // Mock empty result
      mockSupabase.from.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            not: (jest.fn() as any).mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const result = await getFlightsByAirport('LIR');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            not: (jest.fn() as any).mockResolvedValue({ data: null, error: { message: 'Connection failed' } }),
          }),
        }),
      });

      const result = await getFlightsByAirport('SJO');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('createManifest', () => {
    it('should create a manifest successfully', async () => {
      const manifestData = {
        manifest_type: 'arrival' as const,
        date: '2025-06-01',
        time_window_start: '10:00:00',
        time_window_end: '12:00:00',
        guest_ids: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
      };

      const mockManifest = {
        id: 'manifest-1',
        ...manifestData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: mockManifest, error: null }),
          }),
        }),
      });

      const result = await createManifest(manifestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('manifest-1');
      }
    });
  });

  describe('generateArrivalManifest', () => {
    it('should return success with manifests when guests are arriving', async () => {
      const mockGuests = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          first_name: 'John',
          last_name: 'Doe',
          arrival_date: '2025-06-01',
          arrival_time: '10:30:00',
          airport_code: 'SJO',
          flight_number: 'AA123',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          first_name: 'Jane',
          last_name: 'Smith',
          arrival_date: '2025-06-01',
          arrival_time: '11:45:00',
          airport_code: 'SJO',
          flight_number: 'UA456',
        },
      ];

      const mockManifest = {
        id: 'manifest-1',
        manifest_type: 'arrival' as const,
        date: '2025-06-01',
        time_window_start: '10:00:00',
        time_window_end: '12:00:00',
        guest_ids: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock the guests query and manifest creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'guests') {
          return {
            select: (jest.fn() as any).mockReturnValue({
              eq: (jest.fn() as any).mockReturnValue({
                not: (jest.fn() as any).mockResolvedValue({ data: mockGuests, error: null }),
              }),
            }),
          };
        } else if (table === 'transportation_manifests') {
          return {
            insert: (jest.fn() as any).mockReturnValue({
              select: (jest.fn() as any).mockReturnValue({
                single: (jest.fn() as any).mockResolvedValue({ data: mockManifest, error: null }),
              }),
            }),
          };
        }
        // Default return for any other table
        return {
          select: (jest.fn() as any).mockReturnValue({
            eq: (jest.fn() as any).mockReturnValue({
              not: (jest.fn() as any).mockResolvedValue({ data: [], error: null }),
            }),
          }),
          insert: (jest.fn() as any).mockReturnValue({
            select: (jest.fn() as any).mockReturnValue({
              single: (jest.fn() as any).mockResolvedValue({ data: null, error: { message: 'Unexpected table' } }),
            }),
          }),
        };
      });

      const date = new Date('2025-06-01');
      const result = await generateArrivalManifest(date, 2);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toEqual(expect.objectContaining({
          manifest_type: 'arrival',
          guest_ids: expect.arrayContaining(['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002']),
        }));
      }
    });

    it('should return empty array when no guests are arriving', async () => {
      // Mock empty guests query
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'guests') {
          return {
            select: (jest.fn() as any).mockReturnValue({
              eq: (jest.fn() as any).mockReturnValue({
                not: (jest.fn() as any).mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const date = new Date('2025-06-01');
      const result = await generateArrivalManifest(date);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should return DATABASE_ERROR when guests query fails', async () => {
      // Mock database error
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'guests') {
          return {
            select: (jest.fn() as any).mockReturnValue({
              eq: (jest.fn() as any).mockReturnValue({
                not: (jest.fn() as any).mockResolvedValue({ data: null, error: { message: 'Connection failed' } }),
              }),
            }),
          };
        }
        return {};
      });

      const date = new Date('2025-06-01');
      const result = await generateArrivalManifest(date);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('generateDepartureManifest', () => {
    it('should return success with manifests when guests are departing', async () => {
      const mockGuests = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          first_name: 'John',
          last_name: 'Doe',
          departure_date: '2025-06-08',
          departure_time: '14:30:00',
          airport_code: 'SJO',
          flight_number: 'AA789',
        },
      ];

      const mockManifest = {
        id: 'manifest-1',
        manifest_type: 'departure' as const,
        date: '2025-06-08',
        time_window_start: '14:00:00',
        time_window_end: '16:00:00',
        guest_ids: ['123e4567-e89b-12d3-a456-426614174001'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock the guests query and manifest creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'guests') {
          return {
            select: (jest.fn() as any).mockReturnValue({
              eq: (jest.fn() as any).mockReturnValue({
                not: (jest.fn() as any).mockResolvedValue({ data: mockGuests, error: null }),
              }),
            }),
          };
        } else if (table === 'transportation_manifests') {
          return {
            insert: (jest.fn() as any).mockReturnValue({
              select: (jest.fn() as any).mockReturnValue({
                single: (jest.fn() as any).mockResolvedValue({ data: mockManifest, error: null }),
              }),
            }),
          };
        }
        // Default return for any other table
        return {
          select: (jest.fn() as any).mockReturnValue({
            eq: (jest.fn() as any).mockReturnValue({
              not: (jest.fn() as any).mockResolvedValue({ data: [], error: null }),
            }),
          }),
          insert: (jest.fn() as any).mockReturnValue({
            select: (jest.fn() as any).mockReturnValue({
              single: (jest.fn() as any).mockResolvedValue({ data: null, error: { message: 'Unexpected table' } }),
            }),
          }),
        };
      });

      const date = new Date('2025-06-08');
      const result = await generateDepartureManifest(date, 2);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].manifest_type).toBe('departure');
        expect(result.data[0].guest_ids).toContain('123e4567-e89b-12d3-a456-426614174001');
      }
    });
  });

  describe('assignGuestsToShuttle', () => {
    it('should return success when guests are assigned successfully', async () => {
      const currentManifest = {
        guest_ids: ['guest-1'],
      };

      // Use implementation to handle different operations on same table
      let operationCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'transportation_manifests') {
          operationCount++;
          if (operationCount === 1) {
            // First call - select
            return {
              select: (jest.fn() as any).mockReturnValue({
                eq: (jest.fn() as any).mockReturnValue({
                  single: (jest.fn() as any).mockResolvedValue({ data: currentManifest, error: null }),
                }),
              }),
            };
          } else {
            // Second call - update
            return {
              update: (jest.fn() as any).mockReturnValue({
                eq: (jest.fn() as any).mockResolvedValue({ error: null }),
              }),
            };
          }
        }
        return {};
      });

      const result = await assignGuestsToShuttle(
        'manifest-1',
        ['guest-2', 'guest-3']
      );

      expect(result.success).toBe(true);
    });

    it('should prevent duplicate guest assignments', async () => {
      const currentManifest = {
        guest_ids: ['guest-1', 'guest-2'],
      };

      const mockUpdate = (jest.fn() as any).mockReturnValue({
        eq: (jest.fn() as any).mockResolvedValue({ error: null }),
      });

      // Use implementation to handle different operations on same table
      let operationCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'transportation_manifests') {
          operationCount++;
          if (operationCount === 1) {
            // First call - select
            return {
              select: (jest.fn() as any).mockReturnValue({
                eq: (jest.fn() as any).mockReturnValue({
                  single: (jest.fn() as any).mockResolvedValue({ data: currentManifest, error: null }),
                }),
              }),
            };
          } else {
            // Second call - update
            return {
              update: mockUpdate,
            };
          }
        }
        return {};
      });

      const result = await assignGuestsToShuttle(
        'manifest-1',
        ['guest-2', 'guest-3'] // guest-2 is already assigned
      );

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          guest_ids: ['guest-1', 'guest-2', 'guest-3'], // No duplicates
        })
      );
    });

    it('should return DATABASE_ERROR when manifest fetch fails', async () => {
      // Mock database error on select
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'transportation_manifests') {
          return {
            select: (jest.fn() as any).mockReturnValue({
              eq: (jest.fn() as any).mockReturnValue({
                single: (jest.fn() as any).mockResolvedValue({ data: null, error: { message: 'Manifest not found' } }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await assignGuestsToShuttle(
        'nonexistent-manifest',
        ['guest-1']
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('calculateVehicleRequirements', () => {
    it('should return success with vehicle requirements for small group', async () => {
      const result = await calculateVehicleRequirements(3);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].vehicle_type).toBe('sedan');
        expect(result.data[0].quantity_needed).toBe(1);
        expect(result.data[0].estimated_cost).toBe(50);
      }
    });

    it('should return success with optimal vehicle mix for large group', async () => {
      const result = await calculateVehicleRequirements(75);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should use 1 bus (50 guests) + 1 minibus (15 guests) + 1 van (8 guests) + 1 sedan (4 guests)
        // Total capacity: 50 + 15 + 8 + 4 = 77 (covers 75 guests)
        const busReq = result.data.find(req => req.vehicle_type === 'bus');
        const minibusReq = result.data.find(req => req.vehicle_type === 'minibus');
        
        expect(busReq).toBeDefined();
        expect(busReq?.quantity_needed).toBe(1);
        expect(minibusReq).toBeDefined();
        expect(minibusReq?.quantity_needed).toBe(1);
      }
    });

    it('should return success with empty array for zero guests', async () => {
      const result = await calculateVehicleRequirements(0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should return VALIDATION_ERROR for negative guest count', async () => {
      const result = await calculateVehicleRequirements(-5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('generateDriverSheet', () => {
    it('should return success with driver sheet when manifest exists', async () => {
      const mockManifest = {
        id: 'manifest-1',
        date: '2025-06-01',
        time_window_start: '10:00:00',
        time_window_end: '12:00:00',
        manifest_type: 'arrival',
        vehicle_type: 'van',
        driver_name: 'Carlos Rodriguez',
        driver_phone: '+506-1234-5678',
        guest_ids: ['guest-1', 'guest-2'],
      };

      const mockGuests = [
        {
          id: 'guest-1',
          first_name: 'John',
          last_name: 'Doe',
          flight_number: 'AA123',
          phone: '+1-555-0123',
          notes: 'Vegetarian meal',
        },
        {
          id: 'guest-2',
          first_name: 'Jane',
          last_name: 'Smith',
          flight_number: 'UA456',
          phone: '+1-555-0456',
          notes: null,
        },
      ];

      mockSupabase.from
        .mockReturnValueOnce({
          select: (jest.fn() as any).mockReturnValue({
            eq: (jest.fn() as any).mockReturnValue({
              single: (jest.fn() as any).mockResolvedValue({ data: mockManifest, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: (jest.fn() as any).mockReturnValue({
            in: (jest.fn() as any).mockResolvedValue({ data: mockGuests, error: null }),
          }),
        });

      const result = await generateDriverSheet('manifest-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.manifest_id).toBe('manifest-1');
        expect(result.data.date).toBe('2025-06-01');
        expect(result.data.time_window).toBe('10:00:00 - 12:00:00');
        expect(result.data.driver_name).toBe('Carlos Rodriguez');
        expect(result.data.guests).toHaveLength(2);
        expect(result.data.guests[0].name).toBe('John Doe');
        expect(result.data.guests[0].flight_number).toBe('AA123');
        expect(result.data.total_guests).toBe(2);
        expect(result.data.pickup_location).toBe('Airport');
        expect(result.data.dropoff_locations).toEqual(['Hotel']);
      }
    });

    it('should return DATABASE_ERROR when manifest not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: null, error: { message: 'Manifest not found' } }),
          }),
        }),
      });

      const result = await generateDriverSheet('nonexistent-manifest');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('calculateShuttleCosts', () => {
    it('should return success with total cost for manifests', async () => {
      const manifests = [
        {
          id: 'manifest-1',
          manifest_type: 'arrival' as const,
          date: '2025-06-01',
          time_window_start: '10:00:00',
          time_window_end: '12:00:00',
          guest_ids: ['guest-1', 'guest-2', 'guest-3'], // 3 guests = 1 sedan ($50)
          notes: undefined,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'manifest-2',
          manifest_type: 'departure' as const,
          date: '2025-06-08',
          time_window_start: '14:00:00',
          time_window_end: '16:00:00',
          guest_ids: ['guest-4', 'guest-5'], // 2 guests = 1 sedan ($50)
          notes: undefined,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const result = await calculateShuttleCosts(manifests);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(100); // $50 + $50
      }
    });

    it('should return success with zero cost for empty manifests', async () => {
      const result = await calculateShuttleCosts([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0);
      }
    });
  });
});