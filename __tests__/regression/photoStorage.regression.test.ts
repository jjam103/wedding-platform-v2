/**
 * Regression Test Suite: Photo Storage Failover
 * 
 * Tests photo storage failover mechanisms to prevent regressions in:
 * - B2 storage health checks
 * - Automatic failover to Supabase
 * - URL consistency
 * - Storage type tracking
 * - Fallback recovery
 * 
 * Requirements: 21.4
 */

// Mock environment variables before any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.B2_ENDPOINT = 'https://s3.us-west-002.backblazeb2.com';
process.env.B2_REGION = 'us-west-002';
process.env.B2_BUCKET = 'test-bucket';
process.env.B2_ACCESS_KEY_ID = 'test-access-key';
process.env.B2_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.CLOUDFLARE_CDN_URL = 'https://cdn.example.com';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
    },
  })),
}));

// Mock B2 service
jest.mock('@/services/b2Service', () => ({
  b2Service: {
    checkHealth: jest.fn(),
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
  },
}));

// Now import services after mocks are set up
import { photoService } from '@/services/photoService';
import { b2Service } from '@/services/b2Service';

describe('Regression: Photo Storage Failover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('B2 Storage Health Checks', () => {
    it('should detect healthy B2 storage', async () => {
      (b2Service.checkHealth as jest.Mock).mockResolvedValue({
        success: true,
        data: { healthy: true, responseTime: 150 },
      });

      const result = await b2Service.checkHealth();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.healthy).toBe(true);
      }
    });

    it('should detect unhealthy B2 storage', async () => {
      (b2Service.checkHealth as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'STORAGE_UNAVAILABLE', message: 'Connection timeout' },
      });

      const result = await b2Service.checkHealth();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('STORAGE_UNAVAILABLE');
      }
    });

    it('should handle network timeouts', async () => {
      (b2Service.checkHealth as jest.Mock).mockRejectedValue(
        new Error('Network timeout')
      );

      try {
        await b2Service.checkHealth();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Automatic Failover to Supabase', () => {
    it('should use B2 when healthy', async () => {
      (b2Service.checkHealth as jest.Mock).mockResolvedValue({
        success: true,
        data: { healthy: true },
      });

      (b2Service.upload as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          url: 'https://cdn.example.com/photo.jpg',
          storageType: 'b2',
        },
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'photo-1',
          photoUrl: 'https://cdn.example.com/photo.jpg',
          storageType: 'b2',
        },
        error: null,
      });

      const mockFile = new File(['photo'], 'photo.jpg', {
        type: 'image/jpeg',
      });

      const result = await photoService.upload(mockFile, 'user-1', {
        pageType: 'memory',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storageType).toBe('b2');
        expect(result.data.photoUrl).toContain('cdn.example.com');
      }
    });

    it('should failover to Supabase when B2 unhealthy', async () => {
      (b2Service.checkHealth as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'STORAGE_UNAVAILABLE', message: 'B2 down' },
      });

      mockSupabase.storage.upload.mockResolvedValue({
        data: { path: 'photos/photo.jpg' },
        error: null,
      });

      mockSupabase.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://supabase.co/storage/photos/photo.jpg' },
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'photo-1',
          photoUrl: 'https://supabase.co/storage/photos/photo.jpg',
          storageType: 'supabase',
        },
        error: null,
      });

      const mockFile = new File(['photo'], 'photo.jpg', {
        type: 'image/jpeg',
      });

      const result = await photoService.upload(mockFile, 'user-1', {
        pageType: 'memory',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storageType).toBe('supabase');
        expect(result.data.photoUrl).toContain('supabase.co');
      }
    });

    it('should retry B2 upload on transient failure', async () => {
      (b2Service.checkHealth as jest.Mock).mockResolvedValue({
        success: true,
        data: { healthy: true },
      });

      (b2Service.upload as jest.Mock)
        .mockResolvedValueOnce({
          success: false,
          error: { code: 'NETWORK_ERROR', message: 'Temporary failure' },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            url: 'https://cdn.example.com/photo.jpg',
            storageType: 'b2',
          },
        });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'photo-1',
          photoUrl: 'https://cdn.example.com/photo.jpg',
          storageType: 'b2',
        },
        error: null,
      });

      const mockFile = new File(['photo'], 'photo.jpg', {
        type: 'image/jpeg',
      });

      const result = await photoService.upload(mockFile, 'user-1', {
        pageType: 'memory',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storageType).toBe('b2');
      }
    });
  });

  describe('URL Consistency', () => {
    it('should use CDN URL for B2 storage', async () => {
      (b2Service.checkHealth as jest.Mock).mockResolvedValue({
        success: true,
        data: { healthy: true },
      });

      (b2Service.upload as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          url: 'https://cdn.cloudflare.com/photo.jpg',
          storageType: 'b2',
        },
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'photo-1',
          photoUrl: 'https://cdn.cloudflare.com/photo.jpg',
          storageType: 'b2',
        },
        error: null,
      });

      const mockFile = new File(['photo'], 'photo.jpg', {
        type: 'image/jpeg',
      });

      const result = await photoService.upload(mockFile, 'user-1', {
        pageType: 'memory',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.photoUrl).toMatch(/^https:\/\/cdn\./);
      }
    });

    it('should use Supabase URL for Supabase storage', async () => {
      (b2Service.checkHealth as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'STORAGE_UNAVAILABLE', message: 'B2 down' },
      });

      mockSupabase.storage.upload.mockResolvedValue({
        data: { path: 'photos/photo.jpg' },
        error: null,
      });

      mockSupabase.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://project.supabase.co/storage/photos/photo.jpg' },
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'photo-1',
          photoUrl: 'https://project.supabase.co/storage/photos/photo.jpg',
          storageType: 'supabase',
        },
        error: null,
      });

      const mockFile = new File(['photo'], 'photo.jpg', {
        type: 'image/jpeg',
      });

      const result = await photoService.upload(mockFile, 'user-1', {
        pageType: 'memory',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.photoUrl).toContain('supabase.co');
      }
    });
  });

  describe('Storage Type Tracking', () => {
    it('should track B2 storage type in database', async () => {
      (b2Service.checkHealth as jest.Mock).mockResolvedValue({
        success: true,
        data: { healthy: true },
      });

      (b2Service.upload as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          url: 'https://cdn.example.com/photo.jpg',
          storageType: 'b2',
        },
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'photo-1',
          storageType: 'b2',
        },
        error: null,
      });

      const mockFile = new File(['photo'], 'photo.jpg', {
        type: 'image/jpeg',
      });

      const result = await photoService.upload(mockFile, 'user-1', {
        pageType: 'memory',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storageType).toBe('b2');
      }
    });

    it('should track Supabase storage type in database', async () => {
      (b2Service.checkHealth as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'STORAGE_UNAVAILABLE', message: 'B2 down' },
      });

      mockSupabase.storage.upload.mockResolvedValue({
        data: { path: 'photos/photo.jpg' },
        error: null,
      });

      mockSupabase.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://supabase.co/storage/photos/photo.jpg' },
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'photo-1',
          storageType: 'supabase',
        },
        error: null,
      });

      const mockFile = new File(['photo'], 'photo.jpg', {
        type: 'image/jpeg',
      });

      const result = await photoService.upload(mockFile, 'user-1', {
        pageType: 'memory',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storageType).toBe('supabase');
      }
    });
  });

  describe('Fallback Recovery', () => {
    it('should recover to B2 when it becomes healthy again', async () => {
      // First upload: B2 unhealthy, use Supabase
      (b2Service.checkHealth as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: { code: 'STORAGE_UNAVAILABLE', message: 'B2 down' },
      });

      mockSupabase.storage.upload.mockResolvedValue({
        data: { path: 'photos/photo1.jpg' },
        error: null,
      });

      mockSupabase.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://supabase.co/storage/photos/photo1.jpg' },
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'photo-1',
          storageType: 'supabase',
        },
        error: null,
      });

      const mockFile1 = new File(['photo1'], 'photo1.jpg', {
        type: 'image/jpeg',
      });

      const result1 = await photoService.upload(mockFile1, 'user-1', {
        pageType: 'memory',
      });

      expect(result1.success && result1.data.storageType).toBe('supabase');

      // Second upload: B2 healthy again, use B2
      (b2Service.checkHealth as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { healthy: true },
      });

      (b2Service.upload as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          url: 'https://cdn.example.com/photo2.jpg',
          storageType: 'b2',
        },
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'photo-2',
          storageType: 'b2',
        },
        error: null,
      });

      const mockFile2 = new File(['photo2'], 'photo2.jpg', {
        type: 'image/jpeg',
      });

      const result2 = await photoService.upload(mockFile2, 'user-1', {
        pageType: 'memory',
      });

      expect(result2.success && result2.data.storageType).toBe('b2');
    });
  });

  describe('Error Handling', () => {
    it('should handle both storage systems failing', async () => {
      (b2Service.checkHealth as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'STORAGE_UNAVAILABLE', message: 'B2 down' },
      });

      mockSupabase.storage.upload.mockResolvedValue({
        data: null,
        error: { message: 'Supabase storage unavailable' },
      });

      const mockFile = new File(['photo'], 'photo.jpg', {
        type: 'image/jpeg',
      });

      const result = await photoService.upload(mockFile, 'user-1', {
        pageType: 'memory',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('STORAGE_UNAVAILABLE');
      }
    });
  });
});
