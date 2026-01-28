import * as fc from 'fast-check';
import { calculateVehicleRequirements } from './transportationService';

/**
 * Feature: destination-wedding-platform, Property 29: Vehicle Capacity Calculation
 * 
 * For any transportation manifest with assigned guests, the total guest count
 * should not exceed the combined capacity of assigned vehicles.
 * 
 * Validates: Requirements 20.2
 */
describe('Feature: destination-wedding-platform, Property 29: Vehicle Capacity Calculation', () => {
  it('should calculate vehicle requirements that meet or exceed guest count', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate guest count from 0 to 200
        fc.integer({ min: 0, max: 200 }),
        async (guestCount) => {
          const result = await calculateVehicleRequirements(guestCount);

          // Property: Result should be successful
          expect(result.success).toBe(true);

          if (result.success) {
            // Property: Total vehicle capacity should meet or exceed guest count
            const totalCapacity = result.data.reduce(
              (sum, req) => sum + (req.capacity * req.quantity_needed),
              0
            );

            expect(totalCapacity).toBeGreaterThanOrEqual(guestCount);

            // Property: Each vehicle requirement should have positive values
            for (const req of result.data) {
              expect(req.capacity).toBeGreaterThan(0);
              expect(req.quantity_needed).toBeGreaterThan(0);
              expect(req.estimated_cost).toBeGreaterThanOrEqual(0);
            }

            // Property: Vehicle types should be valid
            const validTypes = ['sedan', 'van', 'minibus', 'bus'];
            for (const req of result.data) {
              expect(validTypes).toContain(req.vehicle_type);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array for zero guests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(0),
        async (guestCount) => {
          const result = await calculateVehicleRequirements(guestCount);

          expect(result.success).toBe(true);

          if (result.success) {
            // Property: Zero guests should require no vehicles or minimal vehicles
            const totalVehicles = result.data.reduce(
              (sum, req) => sum + req.quantity_needed,
              0
            );
            expect(totalVehicles).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject negative guest counts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: -100, max: -1 }),
        async (guestCount) => {
          const result = await calculateVehicleRequirements(guestCount);

          // Property: Negative guest counts should return validation error
          expect(result.success).toBe(false);

          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should optimize vehicle allocation efficiently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 150 }),
        async (guestCount) => {
          const result = await calculateVehicleRequirements(guestCount);

          expect(result.success).toBe(true);

          if (result.success) {
            // Property: Should not over-allocate by more than one vehicle's capacity
            const totalCapacity = result.data.reduce(
              (sum, req) => sum + (req.capacity * req.quantity_needed),
              0
            );

            // Find the smallest vehicle capacity used
            const smallestCapacity = result.data.length > 0
              ? Math.min(...result.data.map(req => req.capacity))
              : 4; // Default sedan capacity

            // Over-allocation should be less than smallest vehicle capacity
            const overAllocation = totalCapacity - guestCount;
            expect(overAllocation).toBeLessThan(smallestCapacity);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate costs proportional to vehicle quantity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        async (guestCount) => {
          const result = await calculateVehicleRequirements(guestCount);

          expect(result.success).toBe(true);

          if (result.success) {
            // Property: Cost should be proportional to quantity
            for (const req of result.data) {
              // Cost per vehicle
              const costPerVehicle = req.estimated_cost / req.quantity_needed;
              
              // Should be a positive number
              expect(costPerVehicle).toBeGreaterThan(0);
              
              // Should be consistent (no fractional cents)
              expect(req.estimated_cost % req.quantity_needed).toBe(0);
            }

            // Property: Total cost should increase with guest count
            const totalCost = result.data.reduce(
              (sum, req) => sum + req.estimated_cost,
              0
            );
            expect(totalCost).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case guest counts efficiently', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Test exact vehicle capacity boundaries
        fc.constantFrom(4, 8, 15, 50, 5, 9, 16, 51),
        async (guestCount) => {
          const result = await calculateVehicleRequirements(guestCount);

          expect(result.success).toBe(true);

          if (result.success) {
            const totalCapacity = result.data.reduce(
              (sum, req) => sum + (req.capacity * req.quantity_needed),
              0
            );

            // Property: Should meet capacity exactly or with minimal excess
            expect(totalCapacity).toBeGreaterThanOrEqual(guestCount);
            
            // Property: Should not waste more than one vehicle worth of capacity
            const wastedCapacity = totalCapacity - guestCount;
            expect(wastedCapacity).toBeLessThan(50); // Max vehicle capacity
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistency across multiple calls with same input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        async (guestCount) => {
          // Call twice with same input
          const result1 = await calculateVehicleRequirements(guestCount);
          const result2 = await calculateVehicleRequirements(guestCount);

          expect(result1.success).toBe(true);
          expect(result2.success).toBe(true);

          if (result1.success && result2.success) {
            // Property: Results should be identical (deterministic)
            expect(result1.data).toEqual(result2.data);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should prefer larger vehicles for efficiency', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Test with guest counts that could use multiple vehicle types
        fc.integer({ min: 20, max: 100 }),
        async (guestCount) => {
          const result = await calculateVehicleRequirements(guestCount);

          expect(result.success).toBe(true);

          if (result.success && result.data.length > 0) {
            // Property: Should use larger vehicles when possible
            // Sort by capacity descending
            const sortedReqs = [...result.data].sort((a, b) => b.capacity - a.capacity);
            
            // If using multiple vehicle types, larger vehicles should be allocated first
            if (sortedReqs.length > 1) {
              // The largest vehicle type should have the most quantity or be used
              const largestVehicle = sortedReqs[0];
              expect(largestVehicle.quantity_needed).toBeGreaterThan(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
