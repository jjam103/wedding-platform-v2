/**
 * Regression Test Suite: Financial Calculations
 * 
 * Tests financial calculation accuracy to prevent regressions in:
 * - Budget total calculations
 * - Payment balance updates
 * - Vendor cost calculations
 * - Accommodation cost calculations
 * - Activity cost calculations
 * - Subsidy calculations
 * 
 * Requirements: 21.4
 */

import * as budgetService from '@/services/budgetService';
import * as vendorService from '@/services/vendorService';
import * as accommodationService from '@/services/accommodationService';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('Regression: Financial Calculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Budget Total Calculations', () => {
    it('should calculate total budget correctly', async () => {
      const mockData = {
        vendors: [
          { baseCost: 2500, pricingModel: 'flat_rate' },
          { baseCost: 50, pricingModel: 'per_guest', guestCount: 100 },
        ],
        activities: [
          { costPerPerson: 25, hostSubsidy: 10, attendees: 80 },
          { costPerPerson: 40, hostSubsidy: 15, attendees: 60 },
        ],
        accommodations: [
          { pricePerNight: 150, nights: 3, rooms: 20, hostSubsidy: 50 },
        ],
      };

      mockSupabase.select.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await budgetService.calculateTotal();

      expect(result.success).toBe(true);
      if (result.success) {
        // Vendors: 2500 + (50 * 100) = 7500
        // Activities: (25-10)*80 + (40-15)*60 = 1200 + 1500 = 2700
        // Accommodations: (150-50)*3*20 = 6000
        // Total: 7500 + 2700 + 6000 = 16200
        expect(result.data.total).toBe(16200);
      }
    });

    it('should handle zero costs', async () => {
      const mockData = {
        vendors: [],
        activities: [{ costPerPerson: 0, hostSubsidy: 0, attendees: 50 }],
        accommodations: [],
      };

      mockSupabase.select.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await budgetService.calculateTotal();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(0);
      }
    });

    it('should handle subsidies exceeding costs', async () => {
      const mockData = {
        vendors: [],
        activities: [
          { costPerPerson: 20, hostSubsidy: 30, attendees: 50 },
        ],
        accommodations: [],
      };

      mockSupabase.select.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await budgetService.calculateTotal();

      expect(result.success).toBe(true);
      if (result.success) {
        // Cost should not go negative
        expect(result.data.total).toBeGreaterThanOrEqual(0);
      }
    });

    it('should calculate per-guest vendor costs correctly', async () => {
      const mockData = {
        vendors: [
          { baseCost: 75, pricingModel: 'per_guest', guestCount: 120 },
        ],
        activities: [],
        accommodations: [],
      };

      mockSupabase.select.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await budgetService.calculateTotal();

      expect(result.success).toBe(true);
      if (result.success) {
        // 75 * 120 = 9000
        expect(result.data.total).toBe(9000);
      }
    });
  });

  describe('Payment Balance Updates', () => {
    it('should update balance correctly on payment', async () => {
      const vendor = {
        id: 'vendor-1',
        baseCost: 5000,
        amountPaid: 0,
        paymentStatus: 'unpaid' as const,
      };

      mockSupabase.single
        .mockResolvedValueOnce({
          data: vendor,
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            ...vendor,
            amountPaid: 2000,
            paymentStatus: 'partial',
          },
          error: null,
        });

      const result = await vendorService.recordPayment('vendor-1', 2000);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amountPaid).toBe(2000);
        expect(result.data.paymentStatus).toBe('partial');
        const balance = result.data.baseCost - result.data.amountPaid;
        expect(balance).toBe(3000);
      }
    });

    it('should mark as paid when full amount received', async () => {
      const vendor = {
        id: 'vendor-1',
        baseCost: 5000,
        amountPaid: 4000,
        paymentStatus: 'partial' as const,
      };

      mockSupabase.single
        .mockResolvedValueOnce({
          data: vendor,
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            ...vendor,
            amountPaid: 5000,
            paymentStatus: 'paid',
          },
          error: null,
        });

      const result = await vendorService.recordPayment('vendor-1', 1000);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amountPaid).toBe(5000);
        expect(result.data.paymentStatus).toBe('paid');
      }
    });

    it('should handle overpayment', async () => {
      const vendor = {
        id: 'vendor-1',
        baseCost: 5000,
        amountPaid: 0,
        paymentStatus: 'unpaid' as const,
      };

      mockSupabase.single
        .mockResolvedValueOnce({
          data: vendor,
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            ...vendor,
            amountPaid: 6000,
            paymentStatus: 'paid',
          },
          error: null,
        });

      const result = await vendorService.recordPayment('vendor-1', 6000);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amountPaid).toBe(6000);
        expect(result.data.paymentStatus).toBe('paid');
      }
    });

    it('should reject negative payment amounts', async () => {
      const result = await vendorService.recordPayment('vendor-1', -100);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('Accommodation Cost Calculations', () => {
    it('should calculate room costs with subsidies', async () => {
      const roomType = {
        pricePerNight: 200,
        hostSubsidyPerNight: 75,
      };

      const assignment = {
        checkIn: new Date('2025-06-15'),
        checkOut: new Date('2025-06-18'), // 3 nights
      };

      mockSupabase.single.mockResolvedValue({
        data: { ...roomType, ...assignment },
        error: null,
      });

      const result = await accommodationService.calculateRoomCost(
        'room-1',
        'assignment-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // (200 - 75) * 3 = 375
        expect(result.data.guestCost).toBe(375);
        expect(result.data.hostSubsidy).toBe(225);
        expect(result.data.totalCost).toBe(600);
      }
    });

    it('should handle same-day checkout', async () => {
      const roomType = {
        pricePerNight: 200,
        hostSubsidyPerNight: 0,
      };

      const assignment = {
        checkIn: new Date('2025-06-15'),
        checkOut: new Date('2025-06-15'), // 0 nights
      };

      mockSupabase.single.mockResolvedValue({
        data: { ...roomType, ...assignment },
        error: null,
      });

      const result = await accommodationService.calculateRoomCost(
        'room-1',
        'assignment-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.guestCost).toBe(0);
      }
    });
  });

  describe('Activity Cost Calculations', () => {
    it('should calculate activity costs with subsidies', async () => {
      const activity = {
        costPerPerson: 50,
        hostSubsidy: 20,
      };

      const attendees = 75;

      const guestCost = (activity.costPerPerson - activity.hostSubsidy) * attendees;
      const hostCost = activity.hostSubsidy * attendees;
      const totalCost = activity.costPerPerson * attendees;

      expect(guestCost).toBe(2250); // (50-20) * 75
      expect(hostCost).toBe(1500); // 20 * 75
      expect(totalCost).toBe(3750); // 50 * 75
    });

    it('should handle free activities', async () => {
      const activity = {
        costPerPerson: 0,
        hostSubsidy: 0,
      };

      const attendees = 100;

      const totalCost = activity.costPerPerson * attendees;

      expect(totalCost).toBe(0);
    });

    it('should handle fully subsidized activities', async () => {
      const activity = {
        costPerPerson: 40,
        hostSubsidy: 40,
      };

      const attendees = 60;

      const guestCost = (activity.costPerPerson - activity.hostSubsidy) * attendees;
      const hostCost = activity.hostSubsidy * attendees;

      expect(guestCost).toBe(0);
      expect(hostCost).toBe(2400);
    });
  });

  describe('Precision and Rounding', () => {
    it('should handle decimal amounts correctly', async () => {
      const mockData = {
        vendors: [{ baseCost: 1234.56, pricingModel: 'flat_rate' }],
        activities: [
          { costPerPerson: 12.99, hostSubsidy: 5.50, attendees: 73 },
        ],
        accommodations: [],
      };

      mockSupabase.select.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await budgetService.calculateTotal();

      expect(result.success).toBe(true);
      if (result.success) {
        // Should handle decimals without precision loss
        expect(result.data.total).toBeCloseTo(1781.33, 2);
      }
    });

    it('should not accumulate rounding errors', async () => {
      const mockData = {
        vendors: [],
        activities: Array(100).fill({
          costPerPerson: 0.33,
          hostSubsidy: 0.11,
          attendees: 1,
        }),
        accommodations: [],
      };

      mockSupabase.select.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await budgetService.calculateTotal();

      expect(result.success).toBe(true);
      if (result.success) {
        // (0.33 - 0.11) * 1 * 100 = 22.00
        expect(result.data.total).toBeCloseTo(22.0, 2);
      }
    });
  });
});
