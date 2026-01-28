/**
 * Property-Based Test: Room Assignment Cost Updates
 * Feature: destination-wedding-platform, Property 15: Room Assignment Cost Updates
 * Validates: Requirements 10.14
 *
 * Property: For any room assignment, when the assignment changes (different room type,
 * different dates), the related cost calculations (including subsidies) should
 * automatically recalculate based on the new assignment.
 */

import * as fc from 'fast-check';
import {
  createRoomType,
  calculateRoomCost,
} from './accommodationService';
import type {
  CreateRoomTypeDTO,
  CalculateCostDTO,
} from '../schemas/accommodationSchemas';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Feature: destination-wedding-platform, Property 15: Room Assignment Cost Updates', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      or: jest.fn().mockReturnThis(),
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should recalculate costs when room type changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different room types with different prices
        fc.record({
          roomType1: fc.record({
            accommodationId: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            capacity: fc.integer({ min: 1, max: 6 }),
            totalRooms: fc.integer({ min: 1, max: 20 }),
            pricePerNight: fc.float({ min: 50, max: 500, noNaN: true }),
            hostSubsidyPerNight: fc.float({ min: 0, max: 100, noNaN: true }),
          }),
          roomType2: fc.record({
            accommodationId: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            capacity: fc.integer({ min: 1, max: 6 }),
            totalRooms: fc.integer({ min: 1, max: 20 }),
            pricePerNight: fc.float({ min: 50, max: 500, noNaN: true }),
            hostSubsidyPerNight: fc.float({ min: 0, max: 100, noNaN: true }),
          }),
          checkIn: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-01') }),
          checkOut: fc.date({ min: new Date('2025-01-02'), max: new Date('2025-12-31') }),
        }).filter(({ roomType1, roomType2 }) => {
          // Ensure room types have different prices (at least $10 difference)
          return Math.abs(roomType1.pricePerNight - roomType2.pricePerNight) >= 10;
        }),
        async ({ roomType1, roomType2, checkIn, checkOut }) => {
          // Ensure check-out is after check-in
          if (checkOut <= checkIn) {
            checkOut = new Date(checkIn.getTime() + 24 * 60 * 60 * 1000);
          }

          // Ensure subsidies don't exceed prices
          roomType1.hostSubsidyPerNight = Math.min(roomType1.hostSubsidyPerNight, roomType1.pricePerNight);
          roomType2.hostSubsidyPerNight = Math.min(roomType2.hostSubsidyPerNight, roomType2.pricePerNight);

          const roomType1Id = '00000000-0000-0000-0000-000000000001';
          const roomType2Id = '00000000-0000-0000-0000-000000000002';

          // Mock room type 1 creation and retrieval
          mockSupabase.single.mockResolvedValueOnce({
            data: {
              id: roomType1Id,
              accommodation_id: roomType1.accommodationId,
              name: roomType1.name,
              capacity: roomType1.capacity,
              total_rooms: roomType1.totalRooms,
              price_per_night: roomType1.pricePerNight,
              host_subsidy_per_night: roomType1.hostSubsidyPerNight,
              status: 'draft',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });

          // Mock room type 2 creation and retrieval
          mockSupabase.single.mockResolvedValueOnce({
            data: {
              id: roomType2Id,
              accommodation_id: roomType2.accommodationId,
              name: roomType2.name,
              capacity: roomType2.capacity,
              total_rooms: roomType2.totalRooms,
              price_per_night: roomType2.pricePerNight,
              host_subsidy_per_night: roomType2.hostSubsidyPerNight,
              status: 'draft',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });

          // Create both room types
          const result1 = await createRoomType(roomType1 as CreateRoomTypeDTO);
          const result2 = await createRoomType(roomType2 as CreateRoomTypeDTO);

          if (!result1.success || !result2.success) {
            throw new Error('Failed to create room types');
          }

          // Mock getRoomType for cost calculation (room type 1)
          mockSupabase.single.mockResolvedValueOnce({
            data: {
              id: roomType1Id,
              accommodation_id: roomType1.accommodationId,
              name: roomType1.name,
              capacity: roomType1.capacity,
              total_rooms: roomType1.totalRooms,
              price_per_night: roomType1.pricePerNight,
              host_subsidy_per_night: roomType1.hostSubsidyPerNight,
              status: 'draft',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });

          // Calculate cost for room type 1
          const cost1Result = await calculateRoomCost({
            roomTypeId: roomType1Id,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
          } as CalculateCostDTO);

          if (!cost1Result.success) {
            throw new Error(`Failed to calculate cost for room type 1: ${cost1Result.error.code} - ${cost1Result.error.message}`);
          }

          const cost1 = cost1Result.data;

          // Mock getRoomType for cost calculation (room type 2)
          mockSupabase.single.mockResolvedValueOnce({
            data: {
              id: roomType2Id,
              accommodation_id: roomType2.accommodationId,
              name: roomType2.name,
              capacity: roomType2.capacity,
              total_rooms: roomType2.totalRooms,
              price_per_night: roomType2.pricePerNight,
              host_subsidy_per_night: roomType2.hostSubsidyPerNight,
              status: 'draft',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });

          // Calculate cost for room type 2 (simulating room type change)
          const cost2Result = await calculateRoomCost({
            roomTypeId: roomType2Id,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
          } as CalculateCostDTO);

          if (!cost2Result.success) {
            throw new Error(`Failed to calculate cost for room type 2: ${cost2Result.error.code} - ${cost2Result.error.message}`);
          }

          const cost2 = cost2Result.data;

          // Property: Costs should be recalculated based on new room type
          // The number of nights should be the same
          if (cost1.numberOfNights !== cost2.numberOfNights) {
            throw new Error(`Number of nights mismatch: ${cost1.numberOfNights} !== ${cost2.numberOfNights}`);
          }

          // But the costs should reflect the different room types
          if (cost1.pricePerNight !== roomType1.pricePerNight) {
            throw new Error(`Room type 1 price mismatch: ${cost1.pricePerNight} !== ${roomType1.pricePerNight}`);
          }
          if (cost2.pricePerNight !== roomType2.pricePerNight) {
            throw new Error(`Room type 2 price mismatch: ${cost2.pricePerNight} !== ${roomType2.pricePerNight}`);
          }

          if (cost1.subsidyPerNight !== roomType1.hostSubsidyPerNight) {
            throw new Error(`Room type 1 subsidy mismatch: ${cost1.subsidyPerNight} !== ${roomType1.hostSubsidyPerNight}`);
          }
          if (cost2.subsidyPerNight !== roomType2.hostSubsidyPerNight) {
            throw new Error(`Room type 2 subsidy mismatch: ${cost2.subsidyPerNight} !== ${roomType2.hostSubsidyPerNight}`);
          }

          // Total costs should be correctly calculated
          const expectedCost1 = roomType1.pricePerNight * cost1.numberOfNights;
          const expectedCost2 = roomType2.pricePerNight * cost2.numberOfNights;
          
          if (Math.abs(cost1.totalCost - expectedCost1) > 0.01) {
            throw new Error(`Room type 1 total cost mismatch: ${cost1.totalCost} !== ${expectedCost1}`);
          }
          if (Math.abs(cost2.totalCost - expectedCost2) > 0.01) {
            throw new Error(`Room type 2 total cost mismatch: ${cost2.totalCost} !== ${expectedCost2}`);
          }

          const expectedSubsidy1 = roomType1.hostSubsidyPerNight * cost1.numberOfNights;
          const expectedSubsidy2 = roomType2.hostSubsidyPerNight * cost2.numberOfNights;
          
          if (Math.abs(cost1.totalSubsidy - expectedSubsidy1) > 0.01) {
            throw new Error(`Room type 1 total subsidy mismatch: ${cost1.totalSubsidy} !== ${expectedSubsidy1}`);
          }
          if (Math.abs(cost2.totalSubsidy - expectedSubsidy2) > 0.01) {
            throw new Error(`Room type 2 total subsidy mismatch: ${cost2.totalSubsidy} !== ${expectedSubsidy2}`);
          }

          const expectedGuestCost1 = cost1.totalCost - cost1.totalSubsidy;
          const expectedGuestCost2 = cost2.totalCost - cost2.totalSubsidy;
          
          if (Math.abs(cost1.guestCost - expectedGuestCost1) > 0.01) {
            throw new Error(`Room type 1 guest cost mismatch: ${cost1.guestCost} !== ${expectedGuestCost1}`);
          }
          if (Math.abs(cost2.guestCost - expectedGuestCost2) > 0.01) {
            throw new Error(`Room type 2 guest cost mismatch: ${cost2.guestCost} !== ${expectedGuestCost2}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should recalculate costs when dates change', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          roomType: fc.record({
            accommodationId: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            capacity: fc.integer({ min: 1, max: 6 }),
            totalRooms: fc.integer({ min: 1, max: 20 }),
            pricePerNight: fc.float({ min: 50, max: 500, noNaN: true }),
            hostSubsidyPerNight: fc.float({ min: 0, max: 100, noNaN: true }),
          }),
          checkIn1: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-06-01') }),
          checkOut1: fc.date({ min: new Date('2025-01-02'), max: new Date('2025-06-15') }),
          checkIn2: fc.date({ min: new Date('2025-06-16'), max: new Date('2025-11-01') }),
          checkOut2: fc.date({ min: new Date('2025-06-17'), max: new Date('2025-12-31') }),
        }),
        async ({ roomType, checkIn1, checkOut1, checkIn2, checkOut2 }) => {
          // Ensure check-outs are after check-ins
          if (checkOut1 <= checkIn1) {
            checkOut1 = new Date(checkIn1.getTime() + 24 * 60 * 60 * 1000);
          }
          if (checkOut2 <= checkIn2) {
            checkOut2 = new Date(checkIn2.getTime() + 24 * 60 * 60 * 1000);
          }

          // Ensure subsidy doesn't exceed price
          roomType.hostSubsidyPerNight = Math.min(roomType.hostSubsidyPerNight, roomType.pricePerNight);

          const roomTypeId = '00000000-0000-0000-0000-000000000001';

          // Mock room type creation
          mockSupabase.single.mockResolvedValueOnce({
            data: {
              id: roomTypeId,
              accommodation_id: roomType.accommodationId,
              name: roomType.name,
              capacity: roomType.capacity,
              total_rooms: roomType.totalRooms,
              price_per_night: roomType.pricePerNight,
              host_subsidy_per_night: roomType.hostSubsidyPerNight,
              status: 'draft',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });

          const result = await createRoomType(roomType as CreateRoomTypeDTO);
          if (!result.success) {
            throw new Error('Failed to create room type');
          }

          // Mock getRoomType for first cost calculation
          mockSupabase.single.mockResolvedValueOnce({
            data: {
              id: roomTypeId,
              accommodation_id: roomType.accommodationId,
              name: roomType.name,
              capacity: roomType.capacity,
              total_rooms: roomType.totalRooms,
              price_per_night: roomType.pricePerNight,
              host_subsidy_per_night: roomType.hostSubsidyPerNight,
              status: 'draft',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });

          // Calculate cost for first date range
          const cost1Result = await calculateRoomCost({
            roomTypeId,
            checkIn: checkIn1.toISOString(),
            checkOut: checkOut1.toISOString(),
          } as CalculateCostDTO);

          if (!cost1Result.success) {
            throw new Error(`Failed to calculate cost for first date range: ${cost1Result.error.code} - ${cost1Result.error.message}`);
          }

          const cost1 = cost1Result.data;

          // Mock getRoomType for second cost calculation
          mockSupabase.single.mockResolvedValueOnce({
            data: {
              id: roomTypeId,
              accommodation_id: roomType.accommodationId,
              name: roomType.name,
              capacity: roomType.capacity,
              total_rooms: roomType.totalRooms,
              price_per_night: roomType.pricePerNight,
              host_subsidy_per_night: roomType.hostSubsidyPerNight,
              status: 'draft',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });

          // Calculate cost for second date range (simulating date change)
          const cost2Result = await calculateRoomCost({
            roomTypeId,
            checkIn: checkIn2.toISOString(),
            checkOut: checkOut2.toISOString(),
          } as CalculateCostDTO);

          if (!cost2Result.success) {
            throw new Error(`Failed to calculate cost for second date range: ${cost2Result.error.code} - ${cost2Result.error.message}`);
          }

          const cost2 = cost2Result.data;

          // Property: Costs should be recalculated based on new dates
          // Calculate expected number of nights
          const nights1 = Math.ceil((checkOut1.getTime() - checkIn1.getTime()) / (1000 * 60 * 60 * 24));
          const nights2 = Math.ceil((checkOut2.getTime() - checkIn2.getTime()) / (1000 * 60 * 60 * 24));

          if (cost1.numberOfNights !== nights1) {
            throw new Error(`First date range nights mismatch: ${cost1.numberOfNights} !== ${nights1}`);
          }
          if (cost2.numberOfNights !== nights2) {
            throw new Error(`Second date range nights mismatch: ${cost2.numberOfNights} !== ${nights2}`);
          }

          // Per-night rates should remain the same
          if (cost1.pricePerNight !== roomType.pricePerNight) {
            throw new Error(`First date range price mismatch: ${cost1.pricePerNight} !== ${roomType.pricePerNight}`);
          }
          if (cost2.pricePerNight !== roomType.pricePerNight) {
            throw new Error(`Second date range price mismatch: ${cost2.pricePerNight} !== ${roomType.pricePerNight}`);
          }

          if (cost1.subsidyPerNight !== roomType.hostSubsidyPerNight) {
            throw new Error(`First date range subsidy mismatch: ${cost1.subsidyPerNight} !== ${roomType.hostSubsidyPerNight}`);
          }
          if (cost2.subsidyPerNight !== roomType.hostSubsidyPerNight) {
            throw new Error(`Second date range subsidy mismatch: ${cost2.subsidyPerNight} !== ${roomType.hostSubsidyPerNight}`);
          }

          // Total costs should be proportional to number of nights
          const expectedCost1 = roomType.pricePerNight * nights1;
          const expectedCost2 = roomType.pricePerNight * nights2;
          
          if (Math.abs(cost1.totalCost - expectedCost1) > 0.01) {
            throw new Error(`First date range total cost mismatch: ${cost1.totalCost} !== ${expectedCost1}`);
          }
          if (Math.abs(cost2.totalCost - expectedCost2) > 0.01) {
            throw new Error(`Second date range total cost mismatch: ${cost2.totalCost} !== ${expectedCost2}`);
          }

          const expectedSubsidy1 = roomType.hostSubsidyPerNight * nights1;
          const expectedSubsidy2 = roomType.hostSubsidyPerNight * nights2;
          
          if (Math.abs(cost1.totalSubsidy - expectedSubsidy1) > 0.01) {
            throw new Error(`First date range total subsidy mismatch: ${cost1.totalSubsidy} !== ${expectedSubsidy1}`);
          }
          if (Math.abs(cost2.totalSubsidy - expectedSubsidy2) > 0.01) {
            throw new Error(`Second date range total subsidy mismatch: ${cost2.totalSubsidy} !== ${expectedSubsidy2}`);
          }

          const expectedGuestCost1 = cost1.totalCost - cost1.totalSubsidy;
          const expectedGuestCost2 = cost2.totalCost - cost2.totalSubsidy;
          
          if (Math.abs(cost1.guestCost - expectedGuestCost1) > 0.01) {
            throw new Error(`First date range guest cost mismatch: ${cost1.guestCost} !== ${expectedGuestCost1}`);
          }
          if (Math.abs(cost2.guestCost - expectedGuestCost2) > 0.01) {
            throw new Error(`Second date range guest cost mismatch: ${cost2.guestCost} !== ${expectedGuestCost2}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
