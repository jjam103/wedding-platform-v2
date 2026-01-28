/**
 * Guest Engagement Service Tests
 * 
 * Tests for guest engagement tracking functionality.
 */

import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('guestEngagementService', () => {
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
    it('should export trackPortalLogins function', () => {
      const { trackPortalLogins } = require('./guestEngagementService');
      expect(typeof trackPortalLogins).toBe('function');
    });

    it('should export trackPhotoUploads function', () => {
      const { trackPhotoUploads } = require('./guestEngagementService');
      expect(typeof trackPhotoUploads).toBe('function');
    });

    it('should export trackEmailEngagement function', () => {
      const { trackEmailEngagement } = require('./guestEngagementService');
      expect(typeof trackEmailEngagement).toBe('function');
    });

    it('should export getGuestEngagementReport function', () => {
      const { getGuestEngagementReport } = require('./guestEngagementService');
      expect(typeof getGuestEngagementReport).toBe('function');
    });
  });
});
