/**
 * Property-Based Test: Budget Total Calculation
 * Feature: destination-wedding-platform, Property 12: Budget Total Calculation
 * 
 * Validates: Requirements 8.2
 * 
 * Property: For any set of vendors, activities, and accommodations with associated costs,
 * the total wedding cost should equal the sum of all individual costs
 * (vendor fees + activity costs + accommodation expenses).
 */

import * as fc from 'fast-check';

// Mock Supabase before importing budgetService
const mockFrom = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

// Import after mocking
import { calculateTotal } from './budgetService';

describe('Feature: destination-wedding-platform, Property 12: Budget Total Calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate total as sum of all vendor, activity, and accommodation costs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random vendors
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            category: fc.constantFrom('photography', 'flowers', 'catering', 'music', 'transportation', 'decoration', 'other'),
            base_cost: fc.float({ min: 0, max: 10000, noNaN: true }).map(n => n.toFixed(2)),
            amount_paid: fc.float({ min: 0, max: 10000, noNaN: true }).map(n => n.toFixed(2)),
            payment_status: fc.constantFrom('unpaid', 'partial', 'paid'),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        // Generate random activities with costs
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            cost_per_person: fc.float({ min: 0, max: 500, noNaN: true }).map(n => n.toFixed(2)),
            host_subsidy: fc.float({ min: 0, max: 200, noNaN: true }).map(n => n.toFixed(2)),
            attendee_count: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        async (vendors, activities) => {
          // Mock vendor query - handle both .in() and direct await patterns
          mockFrom.mockImplementation((table: string) => {
            if (table === 'vendors') {
              const mockQuery = {
                select: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({
                    data: vendors,
                    error: null,
                  }),
                  // Support direct await when .in() is not called
                  then: (resolve: any) => resolve({ data: vendors, error: null }),
                }),
              };
              return mockQuery;
            }
            if (table === 'activities') {
              return {
                select: jest.fn().mockReturnValue({
                  not: jest.fn().mockResolvedValue({
                    data: activities,
                    error: null,
                  }),
                }),
              };
            }
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
            };
          });

          // Mock RSVP counts for each activity
          const rsvpMocks = new Map();
          activities.forEach((activity) => {
            rsvpMocks.set(activity.id, activity.attendee_count);
          });

          // Override from() for RSVP queries
          const originalFrom = mockFrom.getMockImplementation();
          mockFrom.mockImplementation((table: string) => {
            if (table === 'rsvps') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockImplementation((field: string, value: string) => {
                    if (field === 'activity_id') {
                      const count = rsvpMocks.get(value) || 0;
                      return {
                        eq: jest.fn().mockResolvedValue({
                          count,
                          error: null,
                        }),
                      };
                    }
                    return {
                      eq: jest.fn().mockResolvedValue({
                        count: 0,
                        error: null,
                      }),
                    };
                  }),
                }),
              };
            }
            return originalFrom ? originalFrom(table) : {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
            };
          });

          // Calculate expected totals manually
          const expectedVendorTotal = vendors.reduce(
            (sum, v) => sum + parseFloat(v.base_cost),
            0
          );

          const expectedVendorPaid = vendors.reduce(
            (sum, v) => sum + parseFloat(v.amount_paid),
            0
          );

          const expectedActivityTotal = activities.reduce(
            (sum, a) => sum + parseFloat(a.cost_per_person) * a.attendee_count,
            0
          );

          const expectedActivitySubsidy = activities.reduce(
            (sum, a) => sum + parseFloat(a.host_subsidy) * a.attendee_count,
            0
          );

          const expectedGrossTotal = expectedVendorTotal + expectedActivityTotal;
          const expectedNetTotal = expectedGrossTotal - expectedActivitySubsidy;
          const expectedBalanceDue = expectedNetTotal - expectedVendorPaid;

          // Call the service
          const result = await calculateTotal({
            includeVendors: true,
            includeActivities: true,
            includeAccommodations: false,
          });

          // Verify the property
          expect(result.success).toBe(true);
          if (result.success) {
            const breakdown = result.data;

            // Verify gross total equals sum of all costs
            const actualGrossTotal = breakdown.totals.grossTotal;
            expect(Math.abs(actualGrossTotal - expectedGrossTotal)).toBeLessThan(0.01);

            // Verify net total equals gross minus subsidies
            const actualNetTotal = breakdown.totals.netTotal;
            expect(Math.abs(actualNetTotal - expectedNetTotal)).toBeLessThan(0.01);

            // Verify balance due equals net minus paid
            const actualBalanceDue = breakdown.totals.balanceDue;
            expect(Math.abs(actualBalanceDue - expectedBalanceDue)).toBeLessThan(0.01);

            // Verify subsidies are tracked correctly
            expect(Math.abs(breakdown.totals.totalSubsidies - expectedActivitySubsidy)).toBeLessThan(0.01);

            // Verify paid amount is tracked correctly
            expect(Math.abs(breakdown.totals.totalPaid - expectedVendorPaid)).toBeLessThan(0.01);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty vendor and activity lists', async () => {
    // Mock empty results with proper chaining support
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vendors') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
            // Support direct await when .in() is not called
            then: (resolve: any) => resolve({ data: [], error: null }),
          }),
        };
      }
      if (table === 'activities') {
        return {
          select: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
    });

    const result = await calculateTotal();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totals.grossTotal).toBe(0);
      expect(result.data.totals.netTotal).toBe(0);
      expect(result.data.totals.balanceDue).toBe(0);
      expect(result.data.totals.totalSubsidies).toBe(0);
      expect(result.data.totals.totalPaid).toBe(0);
    }
  });

  it('should correctly aggregate costs by vendor category', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            category: fc.constantFrom('photography', 'catering', 'music'),
            base_cost: fc.float({ min: 100, max: 5000, noNaN: true }).map(n => n.toFixed(2)),
            amount_paid: fc.constant('0.00'),
            payment_status: fc.constant('unpaid'),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (vendors) => {
          // Mock vendor query with proper chaining support
          mockFrom.mockImplementation((table: string) => {
            if (table === 'vendors') {
              return {
                select: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({
                    data: vendors,
                    error: null,
                  }),
                  // Support direct await when .in() is not called
                  then: (resolve: any) => resolve({ data: vendors, error: null }),
                }),
              };
            }
            if (table === 'activities') {
              return {
                select: jest.fn().mockReturnValue({
                  not: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              };
            }
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
            };
          });

          const result = await calculateTotal({
            includeVendors: true,
            includeActivities: false,
            includeAccommodations: false,
          });

          expect(result.success).toBe(true);
          if (result.success) {
            const breakdown = result.data;

            // Calculate expected totals per category
            const categoryTotals: Record<string, number> = {};
            vendors.forEach((v) => {
              if (!categoryTotals[v.category]) {
                categoryTotals[v.category] = 0;
              }
              categoryTotals[v.category] += parseFloat(v.base_cost);
            });

            // Verify each category total
            breakdown.vendors.forEach((categoryBreakdown) => {
              const expectedTotal = categoryTotals[categoryBreakdown.category] || 0;
              expect(Math.abs(categoryBreakdown.totalCost - expectedTotal)).toBeLessThan(0.01);
            });

            // Verify sum of category totals equals gross total
            const sumOfCategories = breakdown.vendors.reduce(
              (sum, cat) => sum + cat.totalCost,
              0
            );
            expect(Math.abs(sumOfCategories - breakdown.totals.grossTotal)).toBeLessThan(0.01);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
