// Mock Supabase client creation - service creates its own client
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn();
  const mockSupabaseClient = {
    from: mockFrom,
  };
  
  return {
    createClient: jest.fn(() => mockSupabaseClient),
    // Export mockFrom so we can access it in tests
    __mockFrom: mockFrom,
  };
});

// Mock sanitization
jest.mock('../utils/sanitization', () => ({
  sanitizeInput: jest.fn((input) => input?.replace(/<script>/g, '') || ''),
}));

// Import service AFTER mocking dependencies
import {
  create,
  get,
  update,
  deleteVendor,
  list,
  search,
  recordPayment,
  getPaymentInfo,
} from './vendorService';

// Get the mocked from function
const { __mockFrom: mockFrom } = require('@supabase/supabase-js');

describe('vendorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables for the service
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    
    // Reset Supabase mocks to default successful state
    mockFrom.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('create', () => {
    it('should return success with vendor data when valid input provided', async () => {
      const validData = {
        name: 'Costa Rica Photography',
        category: 'photography' as const,
        contactName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        pricingModel: 'flat_rate' as const,
        baseCost: 2500,
        notes: 'Professional wedding photography',
      };

      const mockCreatedVendor = {
        id: 'vendor-123',
        name: 'Costa Rica Photography',
        category: 'photography',
        contact_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        pricing_model: 'flat_rate',
        base_cost: '2500.00',
        payment_status: 'unpaid',
        amount_paid: '0.00',
        notes: 'Professional wedding photography',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      };

      // Set up the complete mock chain for insert operation
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedVendor,
              error: null,
            }),
          }),
        }),
      });

      const result = await create(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('vendor-123');
        expect(result.data.name).toBe('Costa Rica Photography');
        expect(result.data.baseCost).toBe(2500);
        expect(result.data.paymentStatus).toBe('unpaid');
      }
    });

    it('should return VALIDATION_ERROR when invalid input provided', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        category: 'invalid' as any,
        pricingModel: 'invalid' as any,
        baseCost: -100, // Invalid: negative cost
      };

      const result = await create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when insert fails', async () => {
      const validData = {
        name: 'Costa Rica Photography',
        category: 'photography' as const,
        contactName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        pricingModel: 'flat_rate' as const,
        baseCost: 2500,
        notes: 'Professional wedding photography',
      };

      // Set up the complete mock chain for database error
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
            }),
          }),
        }),
      });

      const result = await create(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should sanitize input to prevent XSS attacks', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>Costa Rica Photography',
        category: 'photography' as const,
        contactName: '<script>alert("xss")</script>John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        pricingModel: 'flat_rate' as const,
        baseCost: 2500,
        notes: '<script>alert("xss")</script>Professional wedding photography',
      };

      const mockCreatedVendor = {
        id: 'vendor-123',
        name: 'Costa Rica Photography',
        category: 'photography',
        contact_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        pricing_model: 'flat_rate',
        base_cost: '2500.00',
        payment_status: 'unpaid',
        amount_paid: '0.00',
        notes: 'Professional wedding photography',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      };

      // Set up the complete mock chain for successful insert
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedVendor,
              error: null,
            }),
          }),
        }),
      });

      const result = await create(maliciousData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).not.toContain('<script>');
        expect(result.data.contactName).not.toContain('<script>');
        expect(result.data.notes).not.toContain('<script>');
      }
    });
  });

  describe('get', () => {
    it('should return success with vendor data when vendor exists', async () => {
      const mockVendor = {
        id: 'vendor-123',
        name: 'Test Vendor',
        category: 'photography',
        contact_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        pricing_model: 'flat_rate',
        base_cost: '2500.00',
        payment_status: 'unpaid',
        amount_paid: '0.00',
        notes: 'Test notes',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      };

      // Set up the complete mock chain for select operation
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockVendor,
              error: null,
            }),
          }),
        }),
      });

      const result = await get('vendor-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('vendor-123');
        expect(result.data.name).toBe('Test Vendor');
      }
    });

    it('should return NOT_FOUND when vendor does not exist', async () => {
      // Set up the complete mock chain for not found scenario
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            }),
          }),
        }),
      });

      const result = await get('nonexistent-vendor');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      // Set up the complete mock chain for database error
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
            }),
          }),
        }),
      });

      const result = await get('vendor-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('update', () => {
    it('should return success with updated vendor data when valid input provided', async () => {
      const updateData = {
        name: 'Updated Vendor Name',
        baseCost: 3000,
      };

      const mockUpdatedVendor = {
        id: 'vendor-123',
        name: 'Updated Vendor Name',
        category: 'photography',
        contact_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        pricing_model: 'flat_rate',
        base_cost: '3000.00',
        payment_status: 'unpaid',
        amount_paid: '0.00',
        notes: 'Test notes',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z',
      };

      // Set up the complete mock chain for update operation
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedVendor,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await update('vendor-123', updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Vendor Name');
        expect(result.data.baseCost).toBe(3000);
      }
    });

    it('should return VALIDATION_ERROR when invalid input provided', async () => {
      const invalidData = {
        baseCost: -100, // Invalid: negative cost
      };

      const result = await update('vendor-123', invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return NOT_FOUND when vendor does not exist', async () => {
      const updateData = { name: 'Updated Name' };

      // Set up the complete mock chain for not found scenario
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' },
              }),
            }),
          }),
        }),
      });

      const result = await update('nonexistent-vendor', updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should return DATABASE_ERROR when update fails', async () => {
      const updateData = { name: 'Updated Name' };

      // Set up the complete mock chain for database error
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
              }),
            }),
          }),
        }),
      });

      const result = await update('vendor-123', updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should sanitize input to prevent XSS attacks', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>Updated Name',
        contactName: '<script>alert("xss")</script>Updated Contact',
      };

      const mockUpdatedVendor = {
        id: 'vendor-123',
        name: 'Updated Name',
        category: 'photography',
        contact_name: 'Updated Contact',
        email: 'john@example.com',
        phone: '+1234567890',
        pricing_model: 'flat_rate',
        base_cost: '2500.00',
        payment_status: 'unpaid',
        amount_paid: '0.00',
        notes: 'Test notes',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z',
      };

      // Set up the complete mock chain for successful update
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedVendor,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await update('vendor-123', maliciousData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).not.toContain('<script>');
        expect(result.data.contactName).not.toContain('<script>');
      }
    });
  });

  describe('deleteVendor', () => {
    it('should return success when vendor deleted successfully', async () => {
      // Set up the complete mock chain for successful delete
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const result = await deleteVendor('vendor-123');

      expect(result.success).toBe(true);
    });

    it('should return DATABASE_ERROR when delete fails', async () => {
      // Set up the complete mock chain for database error
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
          }),
        }),
      });

      const result = await deleteVendor('vendor-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('list', () => {
    it('should return success with paginated vendor list when vendors exist', async () => {
      const mockVendors = [
        {
          id: 'vendor-1',
          name: 'Vendor 1',
          category: 'photography',
          contact_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          pricing_model: 'flat_rate',
          base_cost: '2500.00',
          payment_status: 'unpaid',
          amount_paid: '0.00',
          notes: 'Test notes',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'vendor-2',
          name: 'Vendor 2',
          category: 'catering',
          contact_name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1234567891',
          pricing_model: 'per_guest',
          base_cost: '50.00',
          payment_status: 'paid',
          amount_paid: '5000.00',
          notes: 'Another test',
          created_at: '2024-01-01T11:00:00Z',
          updated_at: '2024-01-01T11:00:00Z',
        },
      ];

      // Set up the complete mock chain for list operation
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          range: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockVendors,
              error: null,
              count: 2,
            }),
          }),
        }),
      });

      const result = await list();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vendors).toHaveLength(2);
        expect(result.data.total).toBe(2);
      }
    });

    it('should return success with filtered vendor list when filters provided', async () => {
      const filters = {
        category: 'photography' as const,
        paymentStatus: 'unpaid' as const,
      };

      const mockVendors = [
        {
          id: 'vendor-1',
          name: 'Photography Vendor',
          category: 'photography',
          contact_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          pricing_model: 'flat_rate',
          base_cost: '2500.00',
          payment_status: 'unpaid',
          amount_paid: '0.00',
          notes: 'Test notes',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
        },
      ];

      // Set up the complete mock chain for filtered list operation
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              range: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockVendors,
                  error: null,
                  count: 15,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await list(filters);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vendors).toHaveLength(1);
        expect(result.data.total).toBe(15);
      }
    });

    it('should return success with empty list when no vendors exist', async () => {
      // Set up the complete mock chain for empty list
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          range: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0,
            }),
          }),
        }),
      });

      const result = await list();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vendors).toHaveLength(0);
        expect(result.data.total).toBe(0);
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      // Set up the complete mock chain for database error
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          range: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
            }),
          }),
        }),
      });

      const result = await list();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('search', () => {
    it('should return success with search results when vendors found', async () => {
      const searchParams = {
        query: 'photography',
        category: 'photography' as const,
      };

      const mockVendors = [
        {
          id: 'vendor-1',
          name: 'Photography Vendor',
          category: 'photography',
          contact_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          pricing_model: 'flat_rate',
          base_cost: '2500.00',
          payment_status: 'unpaid',
          amount_paid: '0.00',
          notes: 'Professional photography',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
        },
      ];

      // Set up the complete mock chain for search operation
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockVendors,
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      });

      const result = await search(searchParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vendors).toHaveLength(1);
        expect(result.data.total).toBe(1);
      }
    });

    it('should return success with empty results when no vendors match', async () => {
      const searchParams = {
        query: 'nonexistent',
      };

      // Set up the complete mock chain for empty search results
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0,
              }),
            }),
          }),
        }),
      });

      const result = await search(searchParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vendors).toHaveLength(0);
        expect(result.data.total).toBe(0);
      }
    });

    it('should return VALIDATION_ERROR when invalid search params provided', async () => {
      const invalidParams = {
        page: -1, // Invalid: negative page
      };

      const result = await search(invalidParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when search query fails', async () => {
      const searchParams = {
        query: 'photography',
      };

      // Set up the complete mock chain for database error
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
              }),
            }),
          }),
        }),
      });

      const result = await search(searchParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('recordPayment', () => {
    it('should return success with payment info when payment recorded successfully', async () => {
      const paymentData = {
        vendorId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
        amount: 1000,
        notes: 'Partial payment',
      };

      // Mock vendor lookup for get() call
      const mockVendor = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Vendor',
        category: 'photography',
        contact_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        pricing_model: 'flat_rate',
        base_cost: '2500.00',
        payment_status: 'unpaid',
        amount_paid: '0.00',
        notes: 'Test notes',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      };

      // Mock updated vendor after payment for update() call
      const mockUpdatedVendor = {
        ...mockVendor,
        payment_status: 'partial',
        amount_paid: '1000.00',
        updated_at: '2024-01-15T10:00:00Z',
      };

      // Set up mock to handle both get() and update() calls sequentially
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call is get() - select operation
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockVendor,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Second call is update() - update operation
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockUpdatedVendor,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      const result = await recordPayment(paymentData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vendorId).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(result.data.vendorName).toBe('Test Vendor');
        expect(result.data.amountPaid).toBe(1000);
        expect(result.data.paymentStatus).toBe('partial');
      }
    });

    it('should return VALIDATION_ERROR when invalid payment data provided', async () => {
      const invalidData = {
        vendorId: '', // Invalid: empty vendor ID
        amount: -100, // Invalid: negative amount
      };

      const result = await recordPayment(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when payment exceeds base cost', async () => {
      const paymentData = {
        vendorId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
        amount: 3000, // Exceeds base cost of 2500
      };

      const mockVendor = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Vendor',
        category: 'photography',
        contact_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        pricing_model: 'flat_rate',
        base_cost: '2500.00',
        payment_status: 'unpaid',
        amount_paid: '0.00',
        notes: 'Test notes',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      };

      // Set up the complete mock chain for get operation
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockVendor,
              error: null,
            }),
          }),
        }),
      });

      const result = await recordPayment(paymentData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Payment amount exceeds vendor base cost');
      }
    });

    it('should return NOT_FOUND when vendor does not exist', async () => {
      const paymentData = {
        vendorId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format but nonexistent vendor
        amount: 1000,
      };

      // Set up the complete mock chain for not found scenario
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            }),
          }),
        }),
      });

      const result = await recordPayment(paymentData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('getPaymentInfo', () => {
    it('should return success with payment info when vendor exists', async () => {
      const mockVendor = {
        id: 'vendor-123',
        name: 'Test Vendor',
        category: 'photography',
        contact_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        pricing_model: 'flat_rate',
        base_cost: '2500.00',
        payment_status: 'partial',
        amount_paid: '1000.00',
        notes: 'Test notes',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      };

      // Set up the complete mock chain for select operation
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockVendor,
              error: null,
            }),
          }),
        }),
      });

      const result = await getPaymentInfo('vendor-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vendorId).toBe('vendor-123');
        expect(result.data.vendorName).toBe('Test Vendor');
        expect(result.data.baseCost).toBe(2500);
        expect(result.data.amountPaid).toBe(1000);
        expect(result.data.balanceDue).toBe(1500);
        expect(result.data.paymentStatus).toBe('partial');
      }
    });

    it('should return NOT_FOUND when vendor does not exist', async () => {
      // Set up the complete mock chain for not found scenario
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            }),
          }),
        }),
      });

      const result = await getPaymentInfo('nonexistent-vendor');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      // Set up the complete mock chain for database error
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
            }),
          }),
        }),
      });

      const result = await getPaymentInfo('vendor-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });
});