/**
 * Integration Test: Vendor API
 * 
 * Tests vendor management including CRUD operations, payment tracking,
 * and booking operations for vendor management API endpoints.
 */

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock vendor service BEFORE importing route handlers
jest.mock('@/services/vendorService', () => ({
  create: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  deleteVendor: jest.fn(),
  list: jest.fn(),
  search: jest.fn(),
  recordPayment: jest.fn(),
  getPaymentInfo: jest.fn(),
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

// Mock Supabase server client
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
    getSession: mockGetSession,
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabaseServer', () => ({
  createAuthenticatedClient: jest.fn(() => mockSupabaseClient),
}));

import { GET as GET_VENDORS, POST as POST_VENDORS } from '@/app/api/admin/vendors/route';
import {
  GET as GET_VENDOR_BY_ID,
  PUT as PUT_VENDOR,
  DELETE as DELETE_VENDOR,
} from '@/app/api/admin/vendors/[id]/route';
import * as vendorService from '@/services/vendorService';

describe('Vendor API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'admin@example.com' },
      },
      error: null,
    } as any);
    
    // Default: valid session
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: 'user-1', email: 'admin@example.com' } },
      },
      error: null,
    } as any);
  });

  describe('Vendor Management', () => {
    describe('POST /api/admin/vendors', () => {
      it('should create vendor with valid data', async () => {
        const newVendor = {
          id: 'vendor-1',
          name: 'Costa Rica Photography',
          category: 'photography',
          contactName: 'John Photographer',
          email: 'john@crphoto.com',
          phone: '+506-1234-5678',
          pricingModel: 'flat_rate',
          baseCost: 2500,
          paymentStatus: 'unpaid',
          amountPaid: 0,
          notes: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        };

        (vendorService.create as jest.Mock).mockResolvedValue({
          success: true,
          data: newVendor,
        } as any);

        const request = {
          json: async () => ({
            name: 'Costa Rica Photography',
            category: 'photography',
            contactName: 'John Photographer',
            email: 'john@crphoto.com',
            phone: '+506-1234-5678',
            pricingModel: 'flat_rate',
            baseCost: 2500,
          }),
          url: 'http://localhost:3000/api/admin/vendors',
        } as any;

        const response = await POST_VENDORS(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(newVendor);
        expect(vendorService.create).toHaveBeenCalledWith({
          name: 'Costa Rica Photography',
          category: 'photography',
          contactName: 'John Photographer',
          email: 'john@crphoto.com',
          phone: '+506-1234-5678',
          pricingModel: 'flat_rate',
          baseCost: 2500,
        });
      });

      it('should return 400 for validation errors', async () => {
        (vendorService.create as jest.Mock).mockResolvedValue({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [{ path: ['name'], message: 'Name is required' }],
          },
        } as any);

        const request = {
          json: async () => ({ name: '' }), // Invalid: empty name
          url: 'http://localhost:3000/api/admin/vendors',
        } as any;

        const response = await POST_VENDORS(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 401 when not authenticated', async () => {
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        } as any);

        const request = {
          json: async () => ({ name: 'Test Vendor' }),
          url: 'http://localhost:3000/api/admin/vendors',
        } as any;

        const response = await POST_VENDORS(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
      });

      it('should return 500 for database errors', async () => {
        (vendorService.create as jest.Mock).mockResolvedValue({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database connection failed',
          },
        } as any);

        const request = {
          json: async () => ({
            name: 'Costa Rica Photography',
            category: 'photography',
            pricingModel: 'flat_rate',
            baseCost: 2500,
          }),
          url: 'http://localhost:3000/api/admin/vendors',
        } as any;

        const response = await POST_VENDORS(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('DATABASE_ERROR');
      });
    });

    describe('PUT /api/admin/vendors/[id]', () => {
      it('should update vendor with valid data', async () => {
        const updatedVendor = {
          id: 'vendor-1',
          name: 'Updated Photography Services',
          category: 'photography',
          contactName: 'Jane Photographer',
          email: 'jane@crphoto.com',
          phone: '+506-8765-4321',
          pricingModel: 'flat_rate',
          baseCost: 3000,
          paymentStatus: 'partial',
          amountPaid: 1500,
          notes: 'Updated contact info',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T12:00:00Z',
        };

        (vendorService.update as jest.Mock).mockResolvedValue({
          success: true,
          data: updatedVendor,
        } as any);

        const request = {
          json: async () => ({
            name: 'Updated Photography Services',
            contactName: 'Jane Photographer',
            email: 'jane@crphoto.com',
            phone: '+506-8765-4321',
            baseCost: 3000,
            paymentStatus: 'partial',
            amountPaid: 1500,
            notes: 'Updated contact info',
          }),
          url: 'http://localhost:3000/api/admin/vendors/vendor-1',
        } as any;

        const response = await PUT_VENDOR(request, { params: Promise.resolve({ id: 'vendor-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(updatedVendor);
        expect(vendorService.update).toHaveBeenCalledWith('vendor-1', {
          name: 'Updated Photography Services',
          contactName: 'Jane Photographer',
          email: 'jane@crphoto.com',
          phone: '+506-8765-4321',
          baseCost: 3000,
          paymentStatus: 'partial',
          amountPaid: 1500,
          notes: 'Updated contact info',
        });
      });

      it('should return 404 when vendor not found', async () => {
        (vendorService.update as jest.Mock).mockResolvedValue({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Vendor not found' },
        } as any);

        const request = {
          json: async () => ({ name: 'Updated Name' }),
          url: 'http://localhost:3000/api/admin/vendors/invalid-id',
        } as any;

        const response = await PUT_VENDOR(request, { params: Promise.resolve({ id: 'invalid-id' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NOT_FOUND');
      });

      it('should return 400 for validation errors', async () => {
        (vendorService.update as jest.Mock).mockResolvedValue({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [{ path: ['baseCost'], message: 'Base cost must be positive' }],
          },
        } as any);

        const request = {
          json: async () => ({ baseCost: -100 }), // Invalid: negative cost
          url: 'http://localhost:3000/api/admin/vendors/vendor-1',
        } as any;

        const response = await PUT_VENDOR(request, { params: Promise.resolve({ id: 'vendor-1' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('GET /api/admin/vendors', () => {
      it('should list vendors with filters', async () => {
        const mockVendors = {
          vendors: [
            {
              id: 'vendor-1',
              name: 'Costa Rica Photography',
              category: 'photography',
              pricingModel: 'flat_rate',
              baseCost: 2500,
              paymentStatus: 'unpaid',
            },
            {
              id: 'vendor-2',
              name: 'DJ Services',
              category: 'music',
              pricingModel: 'hourly',
              baseCost: 150,
              paymentStatus: 'paid',
            },
          ],
          total: 2,
          page: 1,
          pageSize: 50,
          totalPages: 1,
        };

        (vendorService.list as jest.Mock).mockResolvedValue({
          success: true,
          data: mockVendors,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/vendors?category=photography&paymentStatus=unpaid',
        } as any;

        const response = await GET_VENDORS(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockVendors);
        expect(vendorService.list).toHaveBeenCalledWith({
          category: 'photography',
          paymentStatus: 'unpaid',
          pricingModel: undefined,
          page: 1,
          pageSize: 50,
        });
      });

      it('should handle pagination parameters', async () => {
        const mockVendors = {
          vendors: [],
          total: 0,
          page: 2,
          pageSize: 10,
          totalPages: 0,
        };

        (vendorService.list as jest.Mock).mockResolvedValue({
          success: true,
          data: mockVendors,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/vendors?page=2&pageSize=10',
        } as any;

        const response = await GET_VENDORS(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(vendorService.list).toHaveBeenCalledWith({
          page: 2,
          pageSize: 10,
        });
      });
    });

    describe('GET /api/admin/vendors/[id]', () => {
      it('should return vendor by ID', async () => {
        const mockVendor = {
          id: 'vendor-1',
          name: 'Costa Rica Photography',
          category: 'photography',
          contactName: 'John Photographer',
          email: 'john@crphoto.com',
          phone: '+506-1234-5678',
          pricingModel: 'flat_rate',
          baseCost: 2500,
          paymentStatus: 'unpaid',
          amountPaid: 0,
          notes: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        };

        (vendorService.get as jest.Mock).mockResolvedValue({
          success: true,
          data: mockVendor,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/vendors/vendor-1',
        } as any;

        const response = await GET_VENDOR_BY_ID(request, { params: Promise.resolve({ id: 'vendor-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockVendor);
        expect(vendorService.get).toHaveBeenCalledWith('vendor-1');
      });

      it('should return 404 when vendor not found', async () => {
        (vendorService.get as jest.Mock).mockResolvedValue({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Vendor not found' },
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/vendors/invalid-id',
        } as any;

        const response = await GET_VENDOR_BY_ID(request, { params: Promise.resolve({ id: 'invalid-id' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NOT_FOUND');
      });
    });

    describe('DELETE /api/admin/vendors/[id]', () => {
      it('should delete vendor successfully', async () => {
        (vendorService.deleteVendor as jest.Mock).mockResolvedValue({
          success: true,
          data: undefined,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/vendors/vendor-1',
        } as any;

        const response = await DELETE_VENDOR(request, { params: Promise.resolve({ id: 'vendor-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(vendorService.deleteVendor).toHaveBeenCalledWith('vendor-1');
      });

      it('should return 500 when deletion fails', async () => {
        (vendorService.deleteVendor as jest.Mock).mockResolvedValue({
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to delete' },
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/vendors/vendor-1',
        } as any;

        const response = await DELETE_VENDOR(request, { params: Promise.resolve({ id: 'vendor-1' }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('DATABASE_ERROR');
      });
    });
  });

  describe('Booking Operations', () => {
    describe('Payment Recording', () => {
      it('should record payment and update vendor status', async () => {
        const mockPaymentInfo = {
          vendorId: 'vendor-1',
          vendorName: 'Costa Rica Photography',
          baseCost: 2500,
          amountPaid: 1000,
          balanceDue: 1500,
          paymentStatus: 'partial',
        };

        (vendorService.recordPayment as jest.Mock).mockResolvedValue({
          success: true,
          data: mockPaymentInfo,
        } as any);

        // Simulate payment recording through vendor update
        const request = {
          json: async () => ({
            paymentStatus: 'partial',
            amountPaid: 1000,
          }),
          url: 'http://localhost:3000/api/admin/vendors/vendor-1',
        } as any;

        // Mock the update to simulate payment recording
        (vendorService.update as jest.Mock).mockResolvedValue({
          success: true,
          data: {
            id: 'vendor-1',
            name: 'Costa Rica Photography',
            category: 'photography',
            baseCost: 2500,
            paymentStatus: 'partial',
            amountPaid: 1000,
          },
        } as any);

        const response = await PUT_VENDOR(request, { params: Promise.resolve({ id: 'vendor-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.paymentStatus).toBe('partial');
        expect(data.data.amountPaid).toBe(1000);
      });

      it('should handle payment validation errors', async () => {
        (vendorService.update as jest.Mock).mockResolvedValue({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Payment amount exceeds vendor base cost',
            details: {
              baseCost: 2500,
              currentPaid: 2000,
              attemptedPayment: 1000,
              wouldTotal: 3000,
            },
          },
        } as any);

        const request = {
          json: async () => ({
            paymentStatus: 'paid',
            amountPaid: 3000, // Exceeds base cost of 2500
          }),
          url: 'http://localhost:3000/api/admin/vendors/vendor-1',
        } as any;

        const response = await PUT_VENDOR(request, { params: Promise.resolve({ id: 'vendor-1' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
        expect(data.error.message).toContain('exceeds');
      });
    });

    describe('Vendor Status Tracking', () => {
      it('should track vendor booking status changes', async () => {
        const mockVendor = {
          id: 'vendor-1',
          name: 'Costa Rica Photography',
          category: 'photography',
          baseCost: 2500,
          paymentStatus: 'paid',
          amountPaid: 2500,
          notes: 'Booking confirmed for June 15th',
        };

        (vendorService.update as jest.Mock).mockResolvedValue({
          success: true,
          data: mockVendor,
        } as any);

        const request = {
          json: async () => ({
            paymentStatus: 'paid',
            amountPaid: 2500,
            notes: 'Booking confirmed for June 15th',
          }),
          url: 'http://localhost:3000/api/admin/vendors/vendor-1',
        } as any;

        const response = await PUT_VENDOR(request, { params: Promise.resolve({ id: 'vendor-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.paymentStatus).toBe('paid');
        expect(data.data.notes).toContain('Booking confirmed');
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
        { handler: GET_VENDORS, request: { url: 'http://localhost:3000/api/admin/vendors' } },
        { handler: POST_VENDORS, request: { url: 'http://localhost:3000/api/admin/vendors', json: async () => ({}) } },
        { handler: GET_VENDOR_BY_ID, request: { url: 'http://localhost:3000/api/admin/vendors/vendor-1' }, params: { params: Promise.resolve({ id: 'vendor-1' }) } },
        { handler: PUT_VENDOR, request: { url: 'http://localhost:3000/api/admin/vendors/vendor-1', json: async () => ({}) }, params: { params: Promise.resolve({ id: 'vendor-1' }) } },
        { handler: DELETE_VENDOR, request: { url: 'http://localhost:3000/api/admin/vendors/vendor-1' }, params: { params: Promise.resolve({ id: 'vendor-1' }) } },
      ];

      for (const endpoint of endpoints) {
        const response = endpoint.params 
          ? await endpoint.handler(endpoint.request as any, endpoint.params as any)
          : await endpoint.handler(endpoint.request as any);
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

      const request = {
        url: 'http://localhost:3000/api/admin/vendors',
      } as any;

      const response = await GET_VENDORS(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });
});