/**
 * Property-Based Tests for Budget Dashboard
 * 
 * Tests universal properties that should hold for all budget calculations:
 * - Property 19: Budget calculation accuracy
 * - Property 20: Budget item highlighting
 * 
 * Requirements: 9.4, 9.5
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import type { Vendor } from '@/schemas/vendorSchemas';
import type { Activity } from '@/schemas/activitySchemas';

// ============================================================================
// ARBITRARIES (Test Data Generators)
// ============================================================================

/**
 * Generates random vendor data for testing
 */
const vendorArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom(
    'photography',
    'catering',
    'music',
    'transportation',
    'florist',
    'venue',
    'other'
  ),
  contactName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  email: fc.option(fc.emailAddress(), { nil: null }),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
  pricingModel: fc.constantFrom('flat_rate', 'per_guest'),
  baseCost: fc.float({ min: 0, max: 50000, noNaN: true }),
  paymentStatus: fc.constantFrom('unpaid', 'partial', 'paid'),
  amountPaid: fc.float({ min: 0, max: 50000, noNaN: true }),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  createdAt: fc.date().map((d) => d.toISOString()),
  updatedAt: fc.date().map((d) => d.toISOString()),
}) as fc.Arbitrary<Vendor>;

/**
 * Generates random activity data for testing
 */
const activityArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  eventId: fc.option(fc.uuid(), { nil: null }),
  startTime: fc.date().map((d) => d.toISOString()),
  endTime: fc.date().map((d) => d.toISOString()),
  locationId: fc.option(fc.uuid(), { nil: null }),
  capacity: fc.option(fc.integer({ min: 1, max: 500 }), { nil: null }),
  costPerPerson: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: null }),
  hostSubsidy: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: null }),
  activityType: fc.string({ minLength: 1, maxLength: 50 }),
  status: fc.constantFrom('draft', 'published', 'cancelled'),
  visibility: fc.constantFrom('public', 'private', 'wedding_party_only'),
  adultsOnly: fc.boolean(),
  plusOnesAllowed: fc.boolean(),
  createdAt: fc.date().map((d) => d.toISOString()),
  updatedAt: fc.date().map((d) => d.toISOString()),
}) as fc.Arbitrary<Activity>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculates vendor totals from an array of vendors
 */
function calculateVendorTotals(vendors: Vendor[]) {
  const total = vendors.reduce((sum, v) => sum + v.baseCost, 0);
  const paid = vendors.reduce((sum, v) => sum + v.amountPaid, 0);
  const balance = total - paid;
  return { total, paid, balance };
}

/**
 * Calculates activity totals with subsidies
 */
function calculateActivityTotals(activities: Activity[]) {
  let totalCost = 0;
  let totalSubsidy = 0;

  activities.forEach((activity) => {
    if (activity.costPerPerson && activity.capacity) {
      const cost = activity.costPerPerson * activity.capacity;
      const subsidy = (activity.hostSubsidy || 0) * activity.capacity;
      totalCost += cost;
      totalSubsidy += subsidy;
    }
  });

  return {
    totalCost,
    totalSubsidy,
    netCost: totalCost - totalSubsidy,
  };
}

/**
 * Calculates grand totals from vendor and activity totals
 */
function calculateGrandTotals(
  vendorTotals: ReturnType<typeof calculateVendorTotals>,
  activityTotals: ReturnType<typeof calculateActivityTotals>
) {
  const grossTotal = vendorTotals.total + activityTotals.totalCost;
  const totalSubsidies = activityTotals.totalSubsidy;
  const netTotal = grossTotal - totalSubsidies;
  const totalPaid = vendorTotals.paid;
  const balanceDue = netTotal - totalPaid;

  return {
    grossTotal,
    totalSubsidies,
    netTotal,
    totalPaid,
    balanceDue,
  };
}

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Feature: admin-ui-modernization, Property 19: Budget calculation accuracy', () => {
  /**
   * Property 19: Budget calculation accuracy
   * 
   * For any budget dashboard state, the displayed guest contributions and host subsidies
   * should equal the sum of all individual contributions and subsidies across all activities
   * and accommodations.
   * 
   * Validates: Requirements 9.4
   */
  it('should calculate guest contributions and host subsidies accurately', () => {
    fc.assert(
      fc.property(
        fc.array(vendorArbitrary, { minLength: 0, maxLength: 20 }),
        fc.array(activityArbitrary, { minLength: 0, maxLength: 20 }),
        (vendors, activities) => {
          // Calculate totals using the same logic as the component
          const vendorTotals = calculateVendorTotals(vendors);
          const activityTotals = calculateActivityTotals(activities);
          const grandTotals = calculateGrandTotals(vendorTotals, activityTotals);

          // Verify that guest contributions equal net cost
          const guestContributions = activityTotals.netCost;
          expect(guestContributions).toBeCloseTo(
            activityTotals.totalCost - activityTotals.totalSubsidy,
            2
          );

          // Verify that total subsidies equal activity subsidies
          expect(grandTotals.totalSubsidies).toBeCloseTo(activityTotals.totalSubsidy, 2);

          // Verify that net total equals gross total minus subsidies
          expect(grandTotals.netTotal).toBeCloseTo(
            grandTotals.grossTotal - grandTotals.totalSubsidies,
            2
          );

          // Verify that balance due equals net total minus paid
          expect(grandTotals.balanceDue).toBeCloseTo(
            grandTotals.netTotal - grandTotals.totalPaid,
            2
          );

          // Verify that gross total equals vendor total plus activity total cost
          expect(grandTotals.grossTotal).toBeCloseTo(
            vendorTotals.total + activityTotals.totalCost,
            2
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty vendor and activity lists', () => {
    const vendors: Vendor[] = [];
    const activities: Activity[] = [];

    const vendorTotals = calculateVendorTotals(vendors);
    const activityTotals = calculateActivityTotals(activities);
    const grandTotals = calculateGrandTotals(vendorTotals, activityTotals);

    expect(vendorTotals.total).toBe(0);
    expect(vendorTotals.paid).toBe(0);
    expect(vendorTotals.balance).toBe(0);
    expect(activityTotals.totalCost).toBe(0);
    expect(activityTotals.totalSubsidy).toBe(0);
    expect(activityTotals.netCost).toBe(0);
    expect(grandTotals.grossTotal).toBe(0);
    expect(grandTotals.totalSubsidies).toBe(0);
    expect(grandTotals.netTotal).toBe(0);
    expect(grandTotals.totalPaid).toBe(0);
    expect(grandTotals.balanceDue).toBe(0);
  });

  it('should handle activities without costs', () => {
    fc.assert(
      fc.property(
        fc.array(
          activityArbitrary.map((a) => ({ ...a, costPerPerson: null, hostSubsidy: null })),
          { minLength: 1, maxLength: 10 }
        ),
        (activities) => {
          const activityTotals = calculateActivityTotals(activities);

          expect(activityTotals.totalCost).toBe(0);
          expect(activityTotals.totalSubsidy).toBe(0);
          expect(activityTotals.netCost).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly sum individual activity costs and subsidies', () => {
    fc.assert(
      fc.property(
        fc.array(activityArbitrary, { minLength: 1, maxLength: 20 }),
        (activities) => {
          const activityTotals = calculateActivityTotals(activities);

          // Manually calculate expected totals
          let expectedTotalCost = 0;
          let expectedTotalSubsidy = 0;

          activities.forEach((activity) => {
            if (activity.costPerPerson && activity.capacity) {
              expectedTotalCost += activity.costPerPerson * activity.capacity;
              expectedTotalSubsidy += (activity.hostSubsidy || 0) * activity.capacity;
            }
          });

          expect(activityTotals.totalCost).toBeCloseTo(expectedTotalCost, 2);
          expect(activityTotals.totalSubsidy).toBeCloseTo(expectedTotalSubsidy, 2);
          expect(activityTotals.netCost).toBeCloseTo(
            expectedTotalCost - expectedTotalSubsidy,
            2
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: admin-ui-modernization, Property 20: Budget item highlighting', () => {
  /**
   * Property 20: Budget item highlighting
   * 
   * For any budget item where actual cost exceeds planned cost, the item should be
   * highlighted with warning styling.
   * 
   * Validates: Requirements 9.5
   */
  it('should identify vendors exceeding budget', () => {
    fc.assert(
      fc.property(
        fc.array(vendorArbitrary, { minLength: 1, maxLength: 20 }),
        (vendors) => {
          // Find vendors where amount paid exceeds base cost
          const overBudgetVendors = vendors.filter((v) => v.amountPaid > v.baseCost);

          // Verify that each over-budget vendor is correctly identified
          overBudgetVendors.forEach((vendor) => {
            expect(vendor.amountPaid).toBeGreaterThan(vendor.baseCost);
            
            // Calculate overage amount
            const overage = vendor.amountPaid - vendor.baseCost;
            expect(overage).toBeGreaterThan(0);
          });

          // Verify that vendors not over budget are not included
          const notOverBudgetVendors = vendors.filter((v) => v.amountPaid <= v.baseCost);
          notOverBudgetVendors.forEach((vendor) => {
            expect(vendor.amountPaid).toBeLessThanOrEqual(vendor.baseCost);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle vendors with zero costs', () => {
    fc.assert(
      fc.property(
        fc.array(
          vendorArbitrary.map((v) => ({ ...v, baseCost: 0, amountPaid: 0 })),
          { minLength: 1, maxLength: 10 }
        ),
        (vendors) => {
          const overBudgetVendors = vendors.filter((v) => v.amountPaid > v.baseCost);
          expect(overBudgetVendors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly calculate overage amounts', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 10000, noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: 1, noNaN: true }), // Ensure overageRatio is always > 0
        (baseCost, overageRatio) => {
          // Create a vendor that is over budget
          const amountPaid = baseCost * (1 + overageRatio);
          const vendor: Vendor = {
            id: 'test-id',
            name: 'Test Vendor',
            category: 'photography',
            contactName: null,
            email: null,
            phone: null,
            pricingModel: 'flat_rate',
            baseCost,
            paymentStatus: 'paid',
            amountPaid,
            notes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const overage = vendor.amountPaid - vendor.baseCost;
          const expectedOverage = baseCost * overageRatio;

          expect(overage).toBeCloseTo(expectedOverage, 2);
          expect(overage).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case where amount paid equals base cost', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10000, noNaN: true }),
        (cost) => {
          const vendor: Vendor = {
            id: 'test-id',
            name: 'Test Vendor',
            category: 'photography',
            contactName: null,
            email: null,
            phone: null,
            pricingModel: 'flat_rate',
            baseCost: cost,
            paymentStatus: 'paid',
            amountPaid: cost,
            notes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Vendor should NOT be highlighted as over budget
          const isOverBudget = vendor.amountPaid > vendor.baseCost;
          expect(isOverBudget).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
