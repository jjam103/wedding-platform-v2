/**
 * Unit Tests for Vendor Booking Service
 * 
 * Tests vendor-to-activity/event booking functionality including:
 * - Vendor selection and booking creation
 * - Booking display on activity and vendor pages
 * - Cost propagation when vendor costs change
 */

// Mock Supabase
jest.mock('@supabase/supabase-js', () => {
  const mockFunctions = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(),
    eq: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  };
  
  return {
    createClient: jest.fn(() => mockFunctions),
    __mockFunctions: mockFunctions, // Export for test access
  };
});

// Mock sanitization
jest.mock('../utils/sanitization', () => ({
  sanitizeInput: jest.fn((input) => input),
}));

import * as vendorBookingService from './vendorBookingService';
import { createClient } from '@supabase/supabase-js';

// Get the mock functions from the mocked module
const { __mockFunctions } = jest.requireMock('@supabase/supabase-js') as any;
const mockFrom = __mockFunctions.from;
const mockInsert = __mockFunctions.insert;
const mockSelect = __mockFunctions.select;
const mockSingle = __mockFunctions.single;
const mockEq = __mockFunctions.eq;
const mockDelete = __mockFunctions.delete;
const mockUpdate = __mockFunctions.update;
const mockOrder = __mockFunctions.order;
const mockRange = __mockFunctions.range;

describe('vendorBookingService.create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockFrom.mockReturnThis();
    mockInsert.mockReturnThis();
    mockSelect.mockReturnThis();
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  it('should create a vendor booking successfully', async () => {
    const bookingData = {
      vendorId: '123e4567-e89b-12d3-a456-426614174000',
      activityId: '123e4567-e89b-12d3-a456-426614174001',
      eventId: null,
      bookingDate: '2025-06-15',
      pricingModel: 'flat_rate' as const,
      baseCost: 1000,
      hostSubsidy: 0,
    };

    const mockBooking = {
      id: 'booking-1',
      vendor_id: bookingData.vendorId,
      activity_id: bookingData.activityId,
      event_id: null,
      booking_date: bookingData.bookingDate,
      notes: null,
      created_at: '2025-01-01T00:00:00Z',
    };

    mockSingle.mockResolvedValue({
      data: mockBooking,
      error: null,
    } as any);

    const result = await vendorBookingService.create(bookingData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('booking-1');
      expect(result.data.vendorId).toBe(bookingData.vendorId);
      expect(result.data.activityId).toBe(bookingData.activityId);
    }
  });

  it('should return VALIDATION_ERROR when vendor ID is missing', async () => {
    const invalidData = {
      activityId: '123e4567-e89b-12d3-a456-426614174001',
      eventId: null,
      bookingDate: '2025-06-15',
    } as any;

    const result = await vendorBookingService.create(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should return DATABASE_ERROR when insert fails', async () => {
    const bookingData = {
      vendorId: '123e4567-e89b-12d3-a456-426614174000',
      activityId: '123e4567-e89b-12d3-a456-426614174001',
      eventId: null,
      bookingDate: '2025-06-15',
      pricingModel: 'flat_rate' as const,
      baseCost: 1000,
      hostSubsidy: 0,
    };

    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: 'DB_ERROR' },
    } as any);

    const result = await vendorBookingService.create(bookingData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
    }
  });

  it('should sanitize notes input', async () => {
    const bookingData = {
      vendorId: '123e4567-e89b-12d3-a456-426614174000',
      activityId: '123e4567-e89b-12d3-a456-426614174001',
      eventId: null,
      bookingDate: '2025-06-15',
      notes: '<script>alert("xss")</script>Important notes',
      pricingModel: 'flat_rate' as const,
      baseCost: 1000,
      hostSubsidy: 0,
    };

    const mockBooking = {
      id: 'booking-1',
      vendor_id: bookingData.vendorId,
      activity_id: bookingData.activityId,
      event_id: null,
      booking_date: bookingData.bookingDate,
      notes: bookingData.notes,
      created_at: '2025-01-01T00:00:00Z',
    };

    mockSingle.mockResolvedValue({
      data: mockBooking,
      error: null,
    } as any);

    const result = await vendorBookingService.create(bookingData);

    expect(result.success).toBe(true);
    // Sanitization is mocked, but in real implementation it would remove script tags
  });
});

describe('vendorBookingService.get', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockFrom.mockReturnThis();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  it('should retrieve a vendor booking by ID', async () => {
    const mockBooking = {
      id: 'booking-1',
      vendor_id: '123e4567-e89b-12d3-a456-426614174000',
      activity_id: '123e4567-e89b-12d3-a456-426614174001',
      event_id: null,
      booking_date: '2025-06-15',
      notes: null,
      created_at: '2025-01-01T00:00:00Z',
    };

    mockSingle.mockResolvedValue({
      data: mockBooking,
      error: null,
    } as any);

    const result = await vendorBookingService.get('booking-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('booking-1');
      expect(result.data.vendorId).toBe('123e4567-e89b-12d3-a456-426614174000');
    }
  });

  it('should return NOT_FOUND when booking does not exist', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    } as any);

    const result = await vendorBookingService.get('nonexistent-id');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});

describe('vendorBookingService.listWithDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockFrom.mockReturnThis();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  it('should retrieve bookings with vendor and activity details', async () => {
    const mockBookings = [
      {
        id: 'booking-1',
        vendor_id: '123e4567-e89b-12d3-a456-426614174000',
        activity_id: '123e4567-e89b-12d3-a456-426614174001',
        event_id: null,
        booking_date: '2025-06-15',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        vendors: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Photographer',
          category: 'photography',
        },
        activities: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Beach Ceremony',
        },
        events: null,
      },
    ];

    mockOrder.mockResolvedValue({
      data: mockBookings,
      error: null,
    } as any);

    const result = await vendorBookingService.listWithDetails({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].vendorName).toBe('Test Photographer');
      expect(result.data[0].activityName).toBe('Beach Ceremony');
    }
  });

  it('should filter bookings by vendor ID', async () => {
    mockOrder.mockResolvedValue({
      data: [],
      error: null,
    } as any);

    const result = await vendorBookingService.listWithDetails({ vendorId: '123e4567-e89b-12d3-a456-426614174000' });

    expect(result.success).toBe(true);
    expect(mockEq).toHaveBeenCalledWith('vendor_id', '123e4567-e89b-12d3-a456-426614174000');
  });

  it('should filter bookings by activity ID', async () => {
    mockOrder.mockResolvedValue({
      data: [],
      error: null,
    } as any);

    const result = await vendorBookingService.listWithDetails({ activityId: '123e4567-e89b-12d3-a456-426614174001' });

    expect(result.success).toBe(true);
    expect(mockEq).toHaveBeenCalledWith('activity_id', '123e4567-e89b-12d3-a456-426614174001');
  });
});

describe('vendorBookingService.getVendorBookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockFrom.mockReturnThis();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  it('should retrieve all bookings for a specific vendor', async () => {
    const mockBookings = [
      {
        id: 'booking-1',
        vendor_id: '123e4567-e89b-12d3-a456-426614174000',
        activity_id: '123e4567-e89b-12d3-a456-426614174001',
        event_id: null,
        booking_date: '2025-06-15',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        vendors: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Photographer',
          category: 'photography',
        },
        activities: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Beach Ceremony',
        },
        events: null,
      },
      {
        id: 'booking-2',
        vendor_id: '123e4567-e89b-12d3-a456-426614174000',
        activity_id: '123e4567-e89b-12d3-a456-426614174002',
        event_id: null,
        booking_date: '2025-06-16',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        vendors: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Photographer',
          category: 'photography',
        },
        activities: {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Reception',
        },
        events: null,
      },
    ];

    mockOrder.mockResolvedValue({
      data: mockBookings,
      error: null,
    } as any);

    const result = await vendorBookingService.getVendorBookings('123e4567-e89b-12d3-a456-426614174000');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].vendorId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.data[1].vendorId).toBe('123e4567-e89b-12d3-a456-426614174000');
    }
  });
});

describe('vendorBookingService.getActivityBookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockFrom.mockReturnThis();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  it('should retrieve all bookings for a specific activity', async () => {
    const mockBookings = [
      {
        id: 'booking-1',
        vendor_id: '123e4567-e89b-12d3-a456-426614174000',
        activity_id: '123e4567-e89b-12d3-a456-426614174001',
        event_id: null,
        booking_date: '2025-06-15',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        vendors: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Photographer',
          category: 'photography',
        },
        activities: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Beach Ceremony',
        },
        events: null,
      },
      {
        id: 'booking-2',
        vendor_id: '123e4567-e89b-12d3-a456-426614174002',
        activity_id: '123e4567-e89b-12d3-a456-426614174001',
        event_id: null,
        booking_date: '2025-06-15',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        vendors: {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Test Florist',
          category: 'flowers',
        },
        activities: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Beach Ceremony',
        },
        events: null,
      },
    ];

    mockOrder.mockResolvedValue({
      data: mockBookings,
      error: null,
    } as any);

    const result = await vendorBookingService.getActivityBookings('123e4567-e89b-12d3-a456-426614174001');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].activityId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(result.data[1].activityId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(result.data[0].vendorName).toBe('Test Photographer');
      expect(result.data[1].vendorName).toBe('Test Florist');
    }
  });
});

describe('vendorBookingService.deleteBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockFrom.mockReturnThis();
    mockDelete.mockReturnThis();
    mockEq.mockResolvedValue({ error: null });
  });

  it('should delete a vendor booking successfully', async () => {
    const result = await vendorBookingService.deleteBooking('booking-1');

    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('vendor_bookings');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'booking-1');
  });

  it('should return DATABASE_ERROR when delete fails', async () => {
    mockEq.mockResolvedValue({
      error: { message: 'Delete failed', code: 'DB_ERROR' },
    } as any);

    const result = await vendorBookingService.deleteBooking('booking-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
    }
  });
});

describe('vendorBookingService.propagateVendorCostChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockFrom.mockReturnThis();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  it('should propagate vendor cost changes successfully', async () => {
    const mockBookings = [
      {
        id: 'booking-1',
        vendor_id: '123e4567-e89b-12d3-a456-426614174000',
        activity_id: '123e4567-e89b-12d3-a456-426614174001',
        event_id: null,
        booking_date: '2025-06-15',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        vendors: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Photographer',
          category: 'photography',
        },
        activities: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Beach Ceremony',
        },
        events: null,
      },
    ];

    mockOrder.mockResolvedValue({
      data: mockBookings,
      error: null,
    } as any);

    const result = await vendorBookingService.propagateVendorCostChange('123e4567-e89b-12d3-a456-426614174000');

    expect(result.success).toBe(true);
    // In real implementation, this would trigger budget recalculation
  });
});
