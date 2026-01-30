/**
 * Integration Test: Budget API
 * 
 * Tests budget calculation, payment status reporting, and subsidy tracking
 * for budget management API endpoints.
 */

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock budget service BEFORE importing route handlers
jest.mock('@/services/budgetService', () => ({
  calculateTotal: jest.fn(),
  getSummary: jest.fn(),
  getPaymentStatusReport: jest.fn(),
  trackSubsidies: jest.fn(),
  generateReport: jest.fn(),
}));

// Mock Next.js server module
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
  NextRequest: jest.fn(),
}));

// Mock Next.js headers and cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    getAll: jest.fn(() => []),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock Supabase SSR client
const mockGetSession = jest.fn();
const mockSupabaseClient = {
  auth: {
    getSession: mockGetSession,
  },
  from: jest.fn(),
};

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}));

import { GET as GET_BUDGET_BREAKDOWN } from '@/app/api/admin/budget/breakdown/route';
import { GET as GET_PAYMENT_STATUS } from '@/app/api/admin/budget/payment-status/route';
import { GET as GET_SUBSIDIES } from '@/app/api/admin/budget/subsidies/route';
import * as budgetService from '@/services/budgetService';

describe('Budget API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default: valid session
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: 'user-1', email: 'admin@example.com' } },
      },
      error: null,
    } as any);
  });

  describe('Budget Breakdown', () => {
    describe('GET /api/admin/budget/breakdown', () => {
      it('should return comprehensive budget breakdown', async () => {
        const mockBreakdown = {
          vendors: [
            {
              category: 'photography',
              totalCost: 2500,
              amountPaid: 1000,
              balanceDue: 1500,
              vendors: [
                {
                  id: 'vendor-1',
                  name: 'Costa Rica Photography',
                  cost: 2500,
                  paid: 1000,
                  balance: 1500,
                  paymentStatus: 'partial',
                },
              ],
            },
          ],
          activities: {
            totalCost: 5000,
            totalSubsidy: 1000,
            netCost: 4000,
            activities: [
              {
                id: 'activity-1',
                name: 'Beach Volleyball',
                costPerPerson: 25,
                hostSubsidy: 5,
                estimatedAttendees: 20,
                totalCost: 500,
                netCost: 400,
              },
            ],
          },
          accommodations: {
            totalCost: 0,
            totalSubsidy: 0,
            netCost: 0,
            accommodations: [],
          },
          totals: {
            grossTotal: 7500,
            totalSubsidies: 1000,
            totalPaid: 1000,
            netTotal: 6500,
            balanceDue: 5500,
          },
        };

        (budgetService.calculateTotal as jest.Mock).mockResolvedValue({
          success: true,
          data: mockBreakdown,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/budget/breakdown',
        } as any;

        const response = await GET_BUDGET_BREAKDOWN();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockBreakdown);
        expect(budgetService.calculateTotal).toHaveBeenCalledWith({
          includeVendors: true,
          includeActivities: true,
          includeAccommodations: true,
        });
      });

      it('should return 401 when not authenticated', async () => {
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        } as any);

        const response = await GET_BUDGET_BREAKDOWN();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
      });

      it('should return 500 for service errors', async () => {
        (budgetService.calculateTotal as jest.Mock).mockResolvedValue({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database connection failed',
          },
        } as any);

        const response = await GET_BUDGET_BREAKDOWN();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('DATABASE_ERROR');
      });
    });
  });

  describe('Payment Status Report', () => {
    describe('GET /api/admin/budget/payment-status', () => {
      it('should return payment status report', async () => {
        const mockReport = {
          unpaidVendors: [
            {
              id: 'vendor-1',
              name: 'DJ Services',
              category: 'music',
              baseCost: 1500,
            },
          ],
          partiallyPaidVendors: [
            {
              id: 'vendor-2',
              name: 'Costa Rica Photography',
              category: 'photography',
              baseCost: 2500,
              amountPaid: 1000,
              balanceDue: 1500,
            },
          ],
          paidVendors: [
            {
              id: 'vendor-3',
              name: 'Catering Services',
              category: 'catering',
              amountPaid: 3000,
            },
          ],
          totalUnpaid: 1500,
          totalPartial: 1500,
          totalPaid: 3000,
        };

        (budgetService.getPaymentStatusReport as jest.Mock).mockResolvedValue({
          success: true,
          data: mockReport,
        } as any);

        const response = await GET_PAYMENT_STATUS();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockReport);
        expect(budgetService.getPaymentStatusReport).toHaveBeenCalled();
      });

      it('should return 401 when not authenticated', async () => {
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        } as any);

        const response = await GET_PAYMENT_STATUS();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
      });

      it('should return 500 for service errors', async () => {
        (budgetService.getPaymentStatusReport as jest.Mock).mockResolvedValue({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch payment status',
          },
        } as any);

        const response = await GET_PAYMENT_STATUS();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('DATABASE_ERROR');
      });
    });
  });

  describe('Subsidy Tracking', () => {
    describe('GET /api/admin/budget/subsidies', () => {
      it('should return subsidy tracking information', async () => {
        const mockSubsidies = {
          activitySubsidies: [
            {
              activityId: 'activity-1',
              activityName: 'Beach Volleyball',
              subsidyPerPerson: 5,
              estimatedAttendees: 20,
              totalSubsidy: 100,
            },
            {
              activityId: 'activity-2',
              activityName: 'Sunset Dinner',
              subsidyPerPerson: 15,
              estimatedAttendees: 50,
              totalSubsidy: 750,
            },
          ],
          accommodationSubsidies: [],
          totalActivitySubsidies: 850,
          totalAccommodationSubsidies: 0,
          grandTotalSubsidies: 850,
        };

        (budgetService.trackSubsidies as jest.Mock).mockResolvedValue({
          success: true,
          data: mockSubsidies,
        } as any);

        const response = await GET_SUBSIDIES();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockSubsidies);
        expect(budgetService.trackSubsidies).toHaveBeenCalled();
      });

      it('should return 401 when not authenticated', async () => {
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        } as any);

        const response = await GET_SUBSIDIES();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
      });

      it('should return 500 for service errors', async () => {
        (budgetService.trackSubsidies as jest.Mock).mockResolvedValue({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to track subsidies',
          },
        } as any);

        const response = await GET_SUBSIDIES();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('DATABASE_ERROR');
      });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 for all endpoints when not authenticated', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const endpoints = [
        { handler: GET_BUDGET_BREAKDOWN },
        { handler: GET_PAYMENT_STATUS },
        { handler: GET_SUBSIDIES },
      ];

      for (const endpoint of endpoints) {
        const response = await endpoint.handler();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should return 401 when session has error', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      } as any);

      const response = await GET_BUDGET_BREAKDOWN();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });
});