/**
 * Property-Based Test: Payment Balance Updates
 * Feature: destination-wedding-platform, Property 13: Payment Balance Updates
 * 
 * Validates: Requirements 8.8
 * 
 * Property: For any vendor with an outstanding balance, recording a payment should
 * reduce the balance by exactly the payment amount, and the payment status should
 * update appropriately (unpaid → partial → paid).
 */

import * as fc from 'fast-check';

// Create mock object that will be populated in beforeEach
let mockFrom: jest.Mock;

// Mock Supabase client BEFORE importing the service
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: (...args: any[]) => mockFrom(...args),
  })),
}));

// Import service AFTER mocking
import { recordPayment } from './vendorService';

describe('Feature: destination-wedding-platform, Property 13: Payment Balance Updates', () => {
  beforeEach(() => {
    mockFrom = jest.fn();
    jest.clearAllMocks();
  });

  it('should reduce balance by exactly the payment amount', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate vendor with base cost and current amount paid
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Ensure non-whitespace names
          category: fc.constantFrom('photography', 'flowers', 'catering'),
          base_cost: fc.float({ min: 1000, max: 10000, noNaN: true }),
          amount_paid: fc.float({ min: 0, max: 5000, noNaN: true }),
          payment_status: fc.constantFrom('unpaid', 'partial'),
        }),
        // Generate payment amount
        fc.float({ min: 100, max: 2000, noNaN: true }),
        async (vendor, paymentAmount) => {
          const baseCost = parseFloat(vendor.base_cost.toFixed(2));
          const currentPaid = parseFloat(vendor.amount_paid.toFixed(2));
          const payment = parseFloat(paymentAmount.toFixed(2));

          // Skip if payment would exceed base cost
          if (currentPaid + payment > baseCost) {
            return true;
          }

          const expectedNewPaid = currentPaid + payment;
          const expectedBalance = baseCost - expectedNewPaid;

          // Determine expected payment status
          let expectedStatus: 'unpaid' | 'partial' | 'paid';
          if (expectedNewPaid === 0) {
            expectedStatus = 'unpaid';
          } else if (expectedNewPaid >= baseCost) {
            expectedStatus = 'paid';
          } else {
            expectedStatus = 'partial';
          }

          // Create a fresh mock for each test iteration
          mockFrom = jest.fn();

          // Mock the get vendor call (used by recordPayment)
          mockFrom.mockImplementationOnce(() => ({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: vendor.id,
                    name: vendor.name,
                    category: vendor.category,
                    contact_name: null,
                    email: null,
                    phone: null,
                    pricing_model: 'flat_rate',
                    base_cost: baseCost.toFixed(2),
                    amount_paid: currentPaid.toFixed(2),
                    payment_status: vendor.payment_status,
                    notes: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          }));

          // Mock the update vendor call (used by recordPayment -> update)
          mockFrom.mockImplementationOnce(() => ({
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: vendor.id,
                      name: vendor.name,
                      category: vendor.category,
                      contact_name: null,
                      email: null,
                      phone: null,
                      pricing_model: 'flat_rate',
                      base_cost: baseCost.toFixed(2),
                      amount_paid: expectedNewPaid.toFixed(2),
                      payment_status: expectedStatus,
                      notes: null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }));

          // Record payment
          const result = await recordPayment({
            vendorId: vendor.id,
            amount: payment,
          });

          // Verify the property
          expect(result.success).toBe(true);
          if (result.success) {
            const paymentInfo = result.data;

            // Balance should be reduced by exactly the payment amount
            expect(Math.abs(paymentInfo.balanceDue - expectedBalance)).toBeLessThan(0.01);

            // Amount paid should increase by exactly the payment amount
            expect(Math.abs(paymentInfo.amountPaid - expectedNewPaid)).toBeLessThan(0.01);

            // Payment status should update correctly
            expect(paymentInfo.paymentStatus).toBe(expectedStatus);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should transition payment status from unpaid to partial to paid', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 1000, max: 5000, noNaN: true }),
        async (baseCost) => {
          const cost = parseFloat(baseCost.toFixed(2));
          const vendorId = '00000000-0000-4000-8000-000000000000'; // Valid UUID v4

          // Test unpaid → partial
          const partialPayment = parseFloat((cost * 0.5).toFixed(2));

          // Create a fresh mock for each test iteration
          mockFrom = jest.fn();

          // Mock get vendor call for first payment
          mockFrom.mockImplementationOnce(() => ({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: vendorId,
                    name: 'Test Vendor',
                    category: 'photography',
                    contact_name: null,
                    email: null,
                    phone: null,
                    pricing_model: 'flat_rate',
                    base_cost: cost.toFixed(2),
                    amount_paid: '0.00',
                    payment_status: 'unpaid',
                    notes: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          }));

          // Mock update vendor call for first payment
          mockFrom.mockImplementationOnce(() => ({
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: vendorId,
                      name: 'Test Vendor',
                      category: 'photography',
                      contact_name: null,
                      email: null,
                      phone: null,
                      pricing_model: 'flat_rate',
                      base_cost: cost.toFixed(2),
                      amount_paid: partialPayment.toFixed(2),
                      payment_status: 'partial',
                      notes: null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }));

          const result1 = await recordPayment({
            vendorId,
            amount: partialPayment,
          });

          expect(result1.success).toBe(true);
          if (result1.success) {
            expect(result1.data.paymentStatus).toBe('partial');
            expect(Math.abs(result1.data.amountPaid - partialPayment)).toBeLessThan(0.01);
          }

          // Test partial → paid
          const remainingPayment = parseFloat((cost - partialPayment).toFixed(2));

          // Mock get vendor call for second payment
          mockFrom.mockImplementationOnce(() => ({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: vendorId,
                    name: 'Test Vendor',
                    category: 'photography',
                    contact_name: null,
                    email: null,
                    phone: null,
                    pricing_model: 'flat_rate',
                    base_cost: cost.toFixed(2),
                    amount_paid: partialPayment.toFixed(2),
                    payment_status: 'partial',
                    notes: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          }));

          // Mock update vendor call for second payment
          mockFrom.mockImplementationOnce(() => ({
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: vendorId,
                      name: 'Test Vendor',
                      category: 'photography',
                      contact_name: null,
                      email: null,
                      phone: null,
                      pricing_model: 'flat_rate',
                      base_cost: cost.toFixed(2),
                      amount_paid: cost.toFixed(2),
                      payment_status: 'paid',
                      notes: null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }));

          const result2 = await recordPayment({
            vendorId,
            amount: remainingPayment,
          });

          expect(result2.success).toBe(true);
          if (result2.success) {
            expect(result2.data.paymentStatus).toBe('paid');
            expect(Math.abs(result2.data.amountPaid - cost)).toBeLessThan(0.01);
            expect(Math.abs(result2.data.balanceDue)).toBeLessThan(0.01);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject payments that exceed base cost', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          baseCost: fc.float({ min: 1000, max: 5000, noNaN: true }),
          currentPaid: fc.float({ min: 0, max: 4000, noNaN: true }),
        }),
        fc.float({ min: 100, max: 3000, noNaN: true }),
        async (vendor, paymentAmount) => {
          const baseCost = parseFloat(vendor.baseCost.toFixed(2));
          const currentPaid = parseFloat(vendor.currentPaid.toFixed(2));
          const payment = parseFloat(paymentAmount.toFixed(2));

          // Only test cases where payment would exceed base cost
          if (currentPaid + payment <= baseCost) {
            return true;
          }

          const vendorId = '00000000-0000-4000-8000-000000000000'; // Valid UUID v4

          // Create a fresh mock for each test iteration
          mockFrom = jest.fn();

          // Mock get vendor call
          mockFrom.mockImplementationOnce(() => ({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: vendorId,
                    name: 'Test Vendor',
                    category: 'photography',
                    contact_name: null,
                    email: null,
                    phone: null,
                    pricing_model: 'flat_rate',
                    base_cost: baseCost.toFixed(2),
                    amount_paid: currentPaid.toFixed(2),
                    payment_status: currentPaid > 0 ? 'partial' : 'unpaid',
                    notes: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          }));

          const result = await recordPayment({
            vendorId,
            amount: payment,
          });

          // Should return validation error
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
            expect(result.error.message).toContain('exceeds');
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
