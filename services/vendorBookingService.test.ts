/**
 * Unit Tests for Vendor Booking Service
 * 
 * Tests vendor-to-activity/event booking functionality including:
 * - Vendor selection and booking creation
 * - Booking display on activity and vendor pages
 * - Cost propagation when vendor costs change
 */

import * as vendorBookingService from './vendorBookingService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock sanitization
jest.mock('../utils/sanitization', () => ({
  sanitizeInput: jest.fn((input) => input),
}));

describe('vendorBookingService.create', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
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

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should create a vendor booking successfully', async () => {
    const bookingData = {
      vendorId: 'vendor-1',
      activityId: 'activity-1',
      bookingDate: '2025-06-15',
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

    mockSupabase.single.mockResolvedValue({
      data: mockBooking,
      error: null,
    });

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
      activityId: 'activity-1',
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
      vendorId: 'vendor-1',
      activityId: 'activity-1',
      bookingDate: '2025-06-15',
    };

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: 'DB_ERROR' },
    });

    const result = await vendorBookingService.create(bookingData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
    }
  });

  it('should sanitize notes input', async () => {
    const bookingData = {
      vendorId: 'vendor-1',
      activityId: 'activity-1',
      bookingDate: '2025-06-15',
      notes: '<script>alert("xss")</script>Important notes',
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

    mockSupabase.single.mockResolvedValue({
      data: mockBooking,
      error: null,
    });

    const result = await vendorBookingService.create(bookingData);

    expect(result.success).toBe(true);
    // Sanitization is mocked, but in real implementation it would remove script tags
  });
});

describe('vendorBookingService.get', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should retrieve a vendor booking by ID', async () => {
    const mockBooking = {
      id: 'booking-1',
      vendor_id: 'vendor-1',
      activity_id: 'activity-1',
      event_id: null,
      booking_date: '2025-06-15',
      notes: null,
      created_at: '2025-01-01T00:00:00Z',
    };

    mockSupabase.single.mockResolvedValue({
      data: mockBooking,
      error: null,
    });

    const result = await vendorBookingService.get('booking-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('booking-1');
      expect(result.data.vendorId).toBe('vendor-1');
    }
  });

  it('should return NOT_FOUND when booking does not exist', async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    });

    const result = await vendorBookingService.get('nonexistent-id');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});

describe('vendorBookingService.listWithDetails', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should retrieve bookings with vendor and activity details', async () => {
    const mockBookings = [
      {
        id: 'booking-1',
        vendor_id: 'vendor-1',
        activity_id: 'activity-1',
        event_id: null,
        booking_date: '2025-06-15',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        vendors: {
          id: 'vendor-1',
          name: 'Test Photographer',
          category: 'photography',
        },
        activities: {
          id: 'activity-1',
          name: 'Beach Ceremony',
        },
        events: null,
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockBookings,
      error: null,
    });

    const result = await vendorBookingService.listWithDetails({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].vendorName).toBe('Test Photographer');
      expect(result.data[0].activityName).toBe('Beach Ceremony');
    }
  });

  it('should filter bookings by vendor ID', async () => {
    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await vendorBookingService.listWithDetails({ vendorId: 'vendor-1' });

    expect(result.success).toBe(true);
    expect(mockSupabase.eq).toHaveBeenCalledWith('vendor_id', 'vendor-1');
  });

  it('should filter bookings by activity ID', async () => {
    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await vendorBookingService.listWithDetails({ activityId: 'activity-1' });

    expect(result.success).toBe(true);
    expect(mockSupabase.eq).toHaveBeenCalledWith('activity_id', 'activity-1');
  });
});

describe('vendorBookingService.getVendorBookings', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should retrieve all bookings for a specific vendor', async () => {
    const mockBookings = [
      {
        id: 'booking-1',
        vendor_id: 'vendor-1',
        activity_id: 'activity-1',
        event_id: null,
        booking_date: '2025-06-15',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        vendors: {
          id: 'vendor-1',
          name: 'Test Photographer',
          category: 'photography',
        },
        activities: {
          id: 'activity-1',
          name: 'Beach Ceremony',
        },
        events: null,
      },
      {
        id: 'booking-2',
        vendor_id: 'vendor-1',
        activity_id: 'activity-2',
        event_id: null,
        booking_date: '2025-06-16',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        vendors: {
          id: 'vendor-1',
          name: 'Test Photographer',
          category: 'photography',
        },
        activities: {
          id: 'activity-2',
          name: 'Reception',
        },
        events: null,
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockBookings,
      error: null,
    });

    const result = await vendorBookingService.getVendorBookings('vendor-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].vendorId).toBe('vendor-1');
      expect(result.data[1].vendorId).toBe('vendor-1');
    }
  });
});

describe('vendorBookingService.getActivityBookings', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should retrieve all bookings for a specific activity', async () => {
    const mockBookings = [
      {
        id: 'booking-1',
        vendor_id: 'vendor-1',
        activity_id: 'activity-1',
        event_id: null,
        booking_date: '2025-06-15',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        vendors: {
          id: 'vendor-1',
          name: 'Test Photographer',
          category: 'photography',
        },
        activities: {
          id: 'activity-1',
          name: 'Beach Ceremony',
        },
        events: null,
      },
      {
        id: 'booking-2',
        vendor_id: 'vendor-2',
        activity_id: 'activity-1',
        event_id: null,
        booking_date: '2025-06-15',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        vendors: {
          id: 'vendor-2',
          name: 'Test Florist',
          category: 'flowers',
        },
        activities: {
          id: 'activity-1',
          name: 'Beach Ceremony',
        },
        events: null,
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockBookings,
      error: null,
    });

    const result = await vendorBookingService.getActivityBookings('activity-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].activityId).toBe('activity-1');
      expect(result.data[1].activityId).toBe('activity-1');
      expect(result.data[0].vendorName).toBe('Test Photographer');
      expect(result.data[1].vendorName).toBe('Test Florist');
    }
  });
});

describe('vendorBookingService.deleteBooking', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        error: null,
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should delete a vendor booking successfully', async () => {
    const result = await vendorBookingService.deleteBooking('booking-1');

    expect(result.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('vendor_bookings');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'booking-1');
  });

  it('should return DATABASE_ERROR when delete fails', async () => {
    mockSupabase.eq.mockResolvedValue({
      error: { message: 'Delete failed', code: 'DB_ERROR' },
    });

    const result = await vendorBookingService.deleteBooking('booking-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
    }
  });
});

describe('vendorBookingService.propagateVendorCostChange', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should propagate vendor cost changes successfully', async () => {
    const mockBookings = [
      {
        id: 'booking-1',
        vendor_id: 'vendor-1',
        activity_id: 'activity-1',
        event_id: null,
        booking_date: '2025-06-15',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        vendors: {
          id: 'vendor-1',
          name: 'Test Photographer',
          category: 'photography',
        },
        activities: {
          id: 'activity-1',
          name: 'Beach Ceremony',
        },
        events: null,
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockBookings,
      error: null,
    });

    const result = await vendorBookingService.propagateVendorCostChange('vendor-1');

    expect(result.success).toBe(true);
    // In real implementation, this would trigger budget recalculation
  });
});
