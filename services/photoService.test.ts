/**
 * Test Suite: photoService
 * 
 * Tests upload operations and moderation workflow for photo management.
 * Focuses on core functionality: upload operations and moderation workflow.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Set up environment variables BEFORE any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock external dependencies - Pattern A
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = (jest.fn() as any);
  const mockStorageFrom = (jest.fn() as any);
  const mockUpload = (jest.fn() as any);
  const mockGetPublicUrl = (jest.fn() as any);
  
  const mockSupabaseClient = {
    from: mockFrom,
    storage: {
      from: mockStorageFrom,
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    },
  };
  
  return {
    createClient: jest.fn(() => mockSupabaseClient),
    __mockFrom: mockFrom,
    __mockStorageFrom: mockStorageFrom,
    __mockUpload: mockUpload,
    __mockGetPublicUrl: mockGetPublicUrl,
  };
});

jest.mock('./b2Service', () => ({
  uploadToB2: (jest.fn() as any),
  isB2Healthy: (jest.fn() as any),
}));

jest.mock('../utils/sanitization', () => ({
  sanitizeInput: jest.fn((input: string) => input.replace(/<[^>]*>/g, '')),
  sanitizeRichText: jest.fn((input: string) => input),
}));

// Import service using require() AFTER mocking
const photoService = require('./photoService');
const { 
  uploadPhoto, 
  moderatePhoto, 
  getPhoto, 
  updatePhoto, 
  deletePhoto 
} = photoService;

const mockB2Service = require('./b2Service');
const mockSanitization = require('../utils/sanitization');

// Get mocked functions from Supabase mock
const { 
  __mockFrom: mockFrom,
  __mockStorageFrom: mockStorageFrom,
  __mockUpload: mockUpload,
  __mockGetPublicUrl: mockGetPublicUrl,
} = require('@supabase/supabase-js');

describe('photoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules(); // Force fresh module load
    
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    
    // Default sanitization behavior
    mockSanitization.sanitizeInput.mockImplementation((input: string) => 
      input.replace(/<[^>]*>/g, '')
    );
  });

  describe('uploadPhoto - Upload Operations', () => {
    const mockFile = Buffer.from('fake-image-data');
    const mockFileName = 'test-photo.jpg';
    const mockContentType = 'image/jpeg';
    const mockMetadata = {
      uploader_id: '123e4567-e89b-12d3-a456-426614174000',
      page_type: 'memory' as const,
      caption: 'Test photo caption',
      alt_text: 'Test alt text',
    };

    it('should return success with photo data when B2 upload succeeds', async () => {
      // Arrange
      mockB2Service.isB2Healthy.mockResolvedValue({ success: true, data: true });
      mockB2Service.uploadToB2.mockResolvedValue({
        success: true,
        data: { url: 'https://cdn.example.com/photo.jpg', key: 'photos/123-test-photo.jpg' }
      });
      
      const expectedPhoto = {
        id: 'photo-1',
        uploader_id: mockMetadata.uploader_id,
        page_type: mockMetadata.page_type,
        caption: mockMetadata.caption,
        alt_text: mockMetadata.alt_text,
        photo_url: 'https://cdn.example.com/photo.jpg',
        storage_type: 'b2',
        moderation_status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      // Mock database insert chain - use mockImplementation for fresh chain each call
      mockFrom.mockImplementation(() => ({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: expectedPhoto, error: null }),
          }),
        }),
      }));

      // Act
      const result = await uploadPhoto(mockFile, mockFileName, mockContentType, mockMetadata);

      // Debug logging
      console.log('mockFrom called:', mockFrom.mock.calls.length, 'times');
      console.log('result:', JSON.stringify(result, null, 2));

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toBeNull();
        expect(result.data.storage_type).toBe('b2');
        expect(result.data.photo_url).toBe('https://cdn.example.com/photo.jpg');
      }
      expect(mockB2Service.uploadToB2).toHaveBeenCalledWith(mockFile, mockFileName, mockContentType);
      expect(mockSanitization.sanitizeInput).toHaveBeenCalledWith(mockMetadata.caption);
    });

    it('should fallback to Supabase Storage when B2 upload fails', async () => {
      // Arrange
      mockB2Service.isB2Healthy.mockResolvedValue({ success: true, data: true });
      mockB2Service.uploadToB2.mockResolvedValue({
        success: false,
        error: { code: 'UPLOAD_ERROR', message: 'B2 upload failed' }
      });
      
      // Mock Supabase Storage upload
      mockStorageFrom.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });
      mockUpload.mockResolvedValue({
        data: { path: 'photos/123-test-photo.jpg' },
        error: null
      });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://supabase.example.com/photo.jpg' }
      });
      
      const expectedPhoto = {
        id: 'photo-1',
        storage_type: 'supabase',
        photo_url: 'https://supabase.example.com/photo.jpg',
      };
      
      // Mock database insert chain
      mockFrom.mockReturnValue({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: expectedPhoto, error: null }),
          }),
        }),
      });

      // Act
      const result = await uploadPhoto(mockFile, mockFileName, mockContentType, mockMetadata);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storage_type).toBe('supabase');
        expect(result.data.photo_url).toBe('https://supabase.example.com/photo.jpg');
      }
    });

    it('should return VALIDATION_ERROR when metadata is invalid', async () => {
      // Arrange
      const invalidMetadata = {
        uploader_id: 'invalid-uuid',
        page_type: 'invalid-type' as any,
      };

      // Act
      const result = await uploadPhoto(mockFile, mockFileName, mockContentType, invalidMetadata);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Invalid photo metadata');
      }
    });

    it('should return DATABASE_ERROR when database insert fails', async () => {
      // Arrange
      mockB2Service.isB2Healthy.mockResolvedValue({ success: true, data: true });
      mockB2Service.uploadToB2.mockResolvedValue({
        success: true,
        data: { url: 'https://cdn.example.com/photo.jpg', key: 'photos/123-test-photo.jpg' }
      });
      
      // Mock database error
      mockFrom.mockReturnValue({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ 
              data: null, 
              error: { message: 'Database connection failed' } 
            }),
          }),
        }),
      });

      // Act
      const result = await uploadPhoto(mockFile, mockFileName, mockContentType, mockMetadata);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Database connection failed');
      }
    });

    it('should sanitize malicious input in caption and alt_text', async () => {
      // Arrange
      const maliciousMetadata = {
        ...mockMetadata,
        caption: '<script>alert("xss")</script>Malicious caption',
        alt_text: '<img src=x onerror=alert(1)>Malicious alt text',
      };
      
      mockB2Service.isB2Healthy.mockResolvedValue({ success: true, data: true });
      mockB2Service.uploadToB2.mockResolvedValue({
        success: true,
        data: { url: 'https://cdn.example.com/photo.jpg', key: 'photos/123-test-photo.jpg' }
      });
      
      const expectedPhoto = { id: 'photo-1', storage_type: 'b2' };
      mockFrom.mockReturnValue({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: expectedPhoto, error: null }),
          }),
        }),
      });

      // Act
      const result = await uploadPhoto(mockFile, mockFileName, mockContentType, maliciousMetadata);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSanitization.sanitizeInput).toHaveBeenCalledWith('<script>alert("xss")</script>Malicious caption');
      expect(mockSanitization.sanitizeInput).toHaveBeenCalledWith('<img src=x onerror=alert(1)>Malicious alt text');
    });
  });

  describe('moderatePhoto - Moderation Workflow', () => {
    const mockPhotoId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return success with updated photo when approving photo', async () => {
      // Arrange
      const moderationData = {
        moderation_status: 'approved' as const,
        moderation_reason: 'Photo meets guidelines',
      };
      
      const expectedPhoto = {
        id: mockPhotoId,
        moderation_status: 'approved',
        moderation_reason: 'Photo meets guidelines',
        moderated_at: '2024-01-01T00:00:00Z',
      };
      
      // Mock database update chain
      mockFrom.mockReturnValue({
        update: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            select: (jest.fn() as any).mockReturnValue({
              single: (jest.fn() as any).mockResolvedValue({ data: expectedPhoto, error: null }),
            }),
          }),
        }),
      });

      // Act
      const result = await moderatePhoto(mockPhotoId, moderationData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.moderation_status).toBe('approved');
        expect(result.data.moderation_reason).toBe('Photo meets guidelines');
        expect(result.data.moderated_at).toBeDefined();
      }
      expect(mockSanitization.sanitizeInput).toHaveBeenCalledWith('Photo meets guidelines');
    });

    it('should return success when rejecting photo with reason', async () => {
      // Arrange
      const moderationData = {
        moderation_status: 'rejected' as const,
        moderation_reason: 'Inappropriate content',
      };
      
      const expectedPhoto = {
        id: mockPhotoId,
        moderation_status: 'rejected',
        moderation_reason: 'Inappropriate content',
        moderated_at: '2024-01-01T00:00:00Z',
      };
      
      // Mock database update chain
      mockFrom.mockReturnValue({
        update: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            select: (jest.fn() as any).mockReturnValue({
              single: (jest.fn() as any).mockResolvedValue({ data: expectedPhoto, error: null }),
            }),
          }),
        }),
      });

      // Act
      const result = await moderatePhoto(mockPhotoId, moderationData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.moderation_status).toBe('rejected');
        expect(result.data.moderation_reason).toBe('Inappropriate content');
      }
    });

    it('should return VALIDATION_ERROR when moderation data is invalid', async () => {
      // Arrange
      const invalidModerationData = {
        moderation_status: 'invalid-status' as any,
      };

      // Act
      const result = await moderatePhoto(mockPhotoId, invalidModerationData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Invalid moderation data');
      }
    });

    it('should return NOT_FOUND when photo does not exist', async () => {
      // Arrange
      const moderationData = {
        moderation_status: 'approved' as const,
      };
      
      // Mock database not found error
      mockFrom.mockReturnValue({
        update: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            select: (jest.fn() as any).mockReturnValue({
              single: (jest.fn() as any).mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' }
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await moderatePhoto(mockPhotoId, moderationData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should sanitize malicious input in moderation reason', async () => {
      // Arrange
      const moderationData = {
        moderation_status: 'rejected' as const,
        moderation_reason: '<script>alert("xss")</script>Inappropriate content',
      };
      
      const expectedPhoto = {
        id: mockPhotoId,
        moderation_status: 'rejected',
        moderation_reason: 'Inappropriate content',
      };
      
      // Mock database update chain
      mockFrom.mockReturnValue({
        update: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            select: (jest.fn() as any).mockReturnValue({
              single: (jest.fn() as any).mockResolvedValue({ data: expectedPhoto, error: null }),
            }),
          }),
        }),
      });

      // Act
      const result = await moderatePhoto(mockPhotoId, moderationData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSanitization.sanitizeInput).toHaveBeenCalledWith('<script>alert("xss")</script>Inappropriate content');
    });
  });

  describe('getPhoto', () => {
    const mockPhotoId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return success with photo data when photo exists', async () => {
      // Arrange
      const expectedPhoto = {
        id: mockPhotoId,
        uploader_id: '123e4567-e89b-12d3-a456-426614174000',
        photo_url: 'https://cdn.example.com/photo.jpg',
        storage_type: 'b2',
        page_type: 'memory',
        moderation_status: 'approved',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      // Mock database select chain
      mockFrom.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: expectedPhoto, error: null }),
          }),
        }),
      });

      // Act
      const result = await getPhoto(mockPhotoId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(mockPhotoId);
        expect(result.data.moderation_status).toBe('approved');
      }
    });

    it('should return NOT_FOUND when photo does not exist', async () => {
      // Arrange
      mockFrom.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' }
            }),
          }),
        }),
      });

      // Act
      const result = await getPhoto(mockPhotoId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('updatePhoto', () => {
    const mockPhotoId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return success with updated photo when update succeeds', async () => {
      // Arrange
      const updates = {
        caption: 'Updated caption',
        alt_text: 'Updated alt text',
        display_order: 5,
      };
      
      const expectedPhoto = {
        id: mockPhotoId,
        caption: 'Updated caption',
        alt_text: 'Updated alt text',
        display_order: 5,
      };
      
      // Mock database update chain
      mockFrom.mockReturnValue({
        update: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            select: (jest.fn() as any).mockReturnValue({
              single: (jest.fn() as any).mockResolvedValue({ data: expectedPhoto, error: null }),
            }),
          }),
        }),
      });

      // Act
      const result = await updatePhoto(mockPhotoId, updates);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.caption).toBe('Updated caption');
        expect(result.data.alt_text).toBe('Updated alt text');
        expect(result.data.display_order).toBe(5);
      }
      expect(mockSanitization.sanitizeInput).toHaveBeenCalledWith('Updated caption');
      expect(mockSanitization.sanitizeInput).toHaveBeenCalledWith('Updated alt text');
    });

    it('should return VALIDATION_ERROR when update data is invalid', async () => {
      // Arrange
      const invalidUpdates = {
        display_order: -1, // Invalid negative order
      };

      // Act
      const result = await updatePhoto(mockPhotoId, invalidUpdates);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Invalid update data');
      }
    });
  });

  describe('deletePhoto', () => {
    const mockPhotoId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return success when photo is deleted successfully', async () => {
      // Arrange
      mockFrom.mockReturnValue({
        delete: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockResolvedValue({ data: null, error: null }),
        }),
      });

      // Act
      const result = await deletePhoto(mockPhotoId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should return DATABASE_ERROR when database delete fails', async () => {
      // Arrange
      mockFrom.mockReturnValue({
        delete: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          }),
        }),
      });

      // Act
      const result = await deletePhoto(mockPhotoId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Database connection failed');
      }
    });
  });
});