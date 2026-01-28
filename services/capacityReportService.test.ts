/**
 * Capacity Report Service Tests
 * 
 * Tests for capacity utilization reporting functionality.
 */

import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('capacityReportService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock Supabase client with proper chaining
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('Service exports', () => {
    it('should export getActivityCapacityReport function', () => {
      const { getActivityCapacityReport } = require('./capacityReportService');
      expect(typeof getActivityCapacityReport).toBe('function');
    });

    it('should export getAccommodationOccupancyReport function', () => {
      const { getAccommodationOccupancyReport } = require('./capacityReportService');
      expect(typeof getAccommodationOccupancyReport).toBe('function');
    });

    it('should export getCapacityUtilizationReport function', () => {
      const { getCapacityUtilizationReport } = require('./capacityReportService');
      expect(typeof getCapacityUtilizationReport).toBe('function');
    });
  });
});
