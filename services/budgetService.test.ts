import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { BudgetCalculationDTO } from '@/schemas/budgetSchemas';

// Set up environment variables BEFORE any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Supabase before importing budgetService - Pattern A
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn();
  const mockSupabaseClient = {
    from: mockFrom,
  };
  
  return {
    createClient: jest.fn(() => mockSupabaseClient),
    __mockFrom: mockFrom, // Export for test access
  };
});

// Import service using require() AFTER mocking
const budgetService = require('./budgetService');

// Get the mocked from function
const { __mockFrom: mockFrom } = require('@supabase/supabase-js');

describe('budgetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // DO NOT use jest.resetModules() - it breaks the mock setup
  });

  describe('calculateTotal - validation logic', () => {
    it('should return VALIDATION_ERROR when invalid vendor categories provided', async () => {
      const invalidOptions = {
        vendorCategories: ['invalid-category'],
      } as any;

      const result = await budgetService.calculateTotal(invalidOptions);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Invalid calculation options');
        expect(result.error.details).toBeDefined();
      }
    });

    it('should accept valid vendor categories', async () => {
      const validOptions: BudgetCalculationDTO = {
        vendorCategories: ['photography', 'flowers'],
        includeVendors: true,
        includeActivities: false,
        includeAccommodations: false,
      };

      // Mock successful vendor query with filtering
      // Service calls: supabase.from('vendors').select('*').in('category', [...])
      const mockIn = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({ in: mockIn });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await budgetService.calculateTotal(validOptions);

      // Should pass validation and attempt database query
      expect(mockFrom).toHaveBeenCalledWith('vendors');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockIn).toHaveBeenCalledWith('category', ['photography', 'flowers']);
    });

    it('should use default options when none provided', async () => {
      // Mock vendor query - service calls: supabase.from('vendors').select('*')
      const mockSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await budgetService.calculateTotal();

      // Should call vendor query since includeVendors defaults to true
      expect(mockFrom).toHaveBeenCalledWith('vendors');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });
  });

  describe('getPaymentStatusReport - vendor categorization logic', () => {
    it('should correctly calculate payment totals for different vendor statuses', async () => {
      const mockVendors = [
        {
          id: 'vendor-1',
          name: 'Photographer',
          category: 'photography',
          base_cost: '2000.00',
          amount_paid: '0.00',
          payment_status: 'unpaid',
        },
        {
          id: 'vendor-2',
          name: 'Florist',
          category: 'flowers',
          base_cost: '800.00',
          amount_paid: '400.00',
          payment_status: 'partial',
        },
        {
          id: 'vendor-3',
          name: 'Caterer',
          category: 'catering',
          base_cost: '5000.00',
          amount_paid: '5000.00',
          payment_status: 'paid',
        },
      ];

      // Mock vendor query - service calls: supabase.from('vendors').select('*').order('category').order('name')
      const mockOrder2 = jest.fn().mockResolvedValue({
        data: mockVendors,
        error: null,
      });
      const mockOrder1 = jest.fn().mockReturnValue({
        order: mockOrder2,
      });
      const mockSelect = jest.fn().mockReturnValue({
        order: mockOrder1,
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await budgetService.getPaymentStatusReport();

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify vendor categorization
        expect(result.data.unpaidVendors).toHaveLength(1);
        expect(result.data.partiallyPaidVendors).toHaveLength(1);
        expect(result.data.paidVendors).toHaveLength(1);

        // Verify total calculations
        expect(result.data.totalUnpaid).toBe(2000);
        expect(result.data.totalPartial).toBe(400); // balance due, not total cost
        expect(result.data.totalPaid).toBe(5000);

        // Verify vendor details
        expect(result.data.unpaidVendors[0].name).toBe('Photographer');
        expect(result.data.partiallyPaidVendors[0].balanceDue).toBe(400);
        expect(result.data.paidVendors[0].amountPaid).toBe(5000);
      }
    });

    it('should handle empty vendor list', async () => {
      // Mock vendor query - service calls: supabase.from('vendors').select('*').order('category').order('name')
      const mockOrder2 = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const mockOrder1 = jest.fn().mockReturnValue({
        order: mockOrder2,
      });
      const mockSelect = jest.fn().mockReturnValue({
        order: mockOrder1,
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await budgetService.getPaymentStatusReport();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unpaidVendors).toHaveLength(0);
        expect(result.data.partiallyPaidVendors).toHaveLength(0);
        expect(result.data.paidVendors).toHaveLength(0);
        expect(result.data.totalUnpaid).toBe(0);
        expect(result.data.totalPartial).toBe(0);
        expect(result.data.totalPaid).toBe(0);
      }
    });
  });

  describe('trackSubsidies - subsidy calculation logic', () => {
    it('should handle empty activity list', async () => {
      // Mock activity query - service calls: supabase.from('activities').select(...).not('host_subsidy', 'is', null)
      const mockNot = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const mockActivitySelect = jest.fn().mockReturnValue({ not: mockNot });
      mockFrom.mockReturnValue({ select: mockActivitySelect });

      const result = await budgetService.trackSubsidies();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activitySubsidies).toHaveLength(0);
        expect(result.data.totalActivitySubsidies).toBe(0);
        expect(result.data.totalAccommodationSubsidies).toBe(0);
        expect(result.data.grandTotalSubsidies).toBe(0);
      }
    });

    it('should query activities with subsidies only', async () => {
      // Mock activity query - service calls: supabase.from('activities').select(...).not('host_subsidy', 'is', null)
      const mockNot = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const mockActivitySelect = jest.fn().mockReturnValue({ not: mockNot });
      mockFrom.mockReturnValue({ select: mockActivitySelect });

      await budgetService.trackSubsidies();

      // Verify it queries for activities with non-null host_subsidy
      expect(mockFrom).toHaveBeenCalledWith('activities');
      expect(mockActivitySelect).toHaveBeenCalledWith('id, name, host_subsidy');
      expect(mockNot).toHaveBeenCalledWith('host_subsidy', 'is', null);
    });
  });

  describe('generateReport - comprehensive report structure', () => {
    it('should return complete budget breakdown structure', async () => {
      // generateReport calls calculateTotal with all options enabled
      // Mock vendor query - service calls: supabase.from('vendors').select('*')
      const mockVendorSelect = jest.fn().mockResolvedValue({ data: [], error: null });
      
      // Mock activity query - service calls: supabase.from('activities').select(...).not('cost_per_person', 'is', null)
      const mockActivityNot = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockActivitySelect = jest.fn().mockReturnValue({
        not: mockActivityNot,
      });

      // Use mockReturnValueOnce for sequential calls
      mockFrom
        .mockReturnValueOnce({ select: mockVendorSelect })
        .mockReturnValueOnce({ select: mockActivitySelect });

      const result = await budgetService.generateReport();

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify structure
        expect(result.data).toHaveProperty('vendors');
        expect(result.data).toHaveProperty('activities');
        expect(result.data).toHaveProperty('accommodations');
        expect(result.data).toHaveProperty('totals');

        // Verify totals structure
        expect(result.data.totals).toHaveProperty('grossTotal');
        expect(result.data.totals).toHaveProperty('totalSubsidies');
        expect(result.data.totals).toHaveProperty('totalPaid');
        expect(result.data.totals).toHaveProperty('netTotal');
        expect(result.data.totals).toHaveProperty('balanceDue');

        // Verify activities structure
        expect(result.data.activities).toHaveProperty('totalCost');
        expect(result.data.activities).toHaveProperty('totalSubsidy');
        expect(result.data.activities).toHaveProperty('netCost');
        expect(result.data.activities).toHaveProperty('activities');

        // Verify accommodations structure (placeholder)
        expect(result.data.accommodations).toHaveProperty('totalCost');
        expect(result.data.accommodations).toHaveProperty('totalSubsidy');
        expect(result.data.accommodations).toHaveProperty('netCost');
        expect(result.data.accommodations).toHaveProperty('accommodations');
      }
    });
  });

  describe('error handling', () => {
    it('should return DATABASE_ERROR when query fails', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection failed', code: 'CONNECTION_ERROR' },
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await budgetService.calculateTotal();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Connection failed');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      // Mock an unexpected error by making mockFrom throw
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await budgetService.calculateTotal();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('Unexpected error');
      }
    });

    it('should handle non-Error exceptions gracefully', async () => {
      // Mock a non-Error exception
      mockFrom.mockImplementation(() => {
        throw 'String error';
      });

      const result = await budgetService.calculateTotal();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('Unknown error occurred');
      }
    });
  });
});