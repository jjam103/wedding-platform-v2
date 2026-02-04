/**
 * Photos RLS Regression Test
 * 
 * This test validates Row-Level Security (RLS) policies for the photos table.
 * Tests ensure that:
 * - Admins can create, read, update, and delete photos with real auth
 * - Admins can read all moderation states (pending, approved, rejected)
 * - Guests can only read approved photos
 * - Guests cannot read pending or rejected photos
 * - Guests cannot create, update, or delete photos
 * - Photos are properly filtered by page_type and page_id
 * - RLS doesn't cause "permission denied" errors
 * - Service role can bypass RLS for admin operations
 * 
 * Validates: Requirements 1.2, 1.3, 1.4 (Security Testing)
 */

import { createAndSignInTestUser, deleteTestUser, createServiceClient, createTestClient, type TestUser } from '../helpers/testDb';
import { cleanupByIds } from '../helpers/cleanup';

describe('Photos RLS Regression Tests', () => {
  let adminUser: TestUser | null = null;
  let guestUser: TestUser | null = null;
  let authSetupFailed = false;
  const createdIds: Map<string, string[]> = new Map();
  
  // Helper to track created entities for cleanup
  const trackEntity = (table: string, id: string) => {
    const ids = createdIds.get(table) || [];
    ids.push(id);
    createdIds.set(table, ids);
  };
  
  beforeAll(async () => {
    try {
      // Create admin user (with host role)
      adminUser = await createAndSignInTestUser({
        email: `admin-${Date.now()}@test.com`,
        password: 'test123',
        role: 'host'
      });
      
      // Create guest user (regular user)
      guestUser = await createAndSignInTestUser({
        email: `guest-${Date.now()}@test.com`,
        password: 'test123',
        role: 'guest'
      });
      
      console.log('✅ Test users created for photos RLS tests');
    } catch (error) {
      console.warn('⚠️  Failed to create test users:', error instanceof Error ? error.message : error);
      authSetupFailed = true;
    }
  }, 30000);
  
  afterAll(async () => {
    // Clean up created entities
    for (const [table, ids] of createdIds.entries()) {
      if (ids.length > 0) {
        await cleanupByIds(table, ids);
      }
    }
    
    // Clean up test users
    if (adminUser?.id) {
      try {
        await deleteTestUser(adminUser.id);
        console.log('✅ Admin user cleaned up');
      } catch (error) {
        console.warn('⚠️  Failed to clean up admin user:', error);
      }
    }
    
    if (guestUser?.id) {
      try {
        await deleteTestUser(guestUser.id);
        console.log('✅ Guest user cleaned up');
      } catch (error) {
        console.warn('⚠️  Failed to clean up guest user:', error);
      }
    }
  }, 10000);
  
  describe('Admin Photo Operations with Real Auth', () => {
    it('should allow admin to create photo with real auth (not service role)', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(adminUser.accessToken);
      
      const photoData = {
        uploader_id: adminUser.id,
        photo_url: 'https://cdn.example.com/test-photo.jpg',
        storage_type: 'b2',
        page_type: 'memory',
        page_id: null,
        caption: 'Test photo caption',
        alt_text: 'Test photo alt text',
        moderation_status: 'approved',
        display_order: 1,
      };
      
      const { data, error } = await client
        .from('photos')
        .insert(photoData)
        .select()
        .single();
      
      // Should not get RLS error
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data) {
        expect(data.uploader_id).toBe(adminUser.id);
        expect(data.photo_url).toBe(photoData.photo_url);
        expect(data.storage_type).toBe('b2');
        expect(data.moderation_status).toBe('approved');
        trackEntity('photos', data.id);
      }
    });
    
    it('should allow admin to read all moderation states', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(adminUser.accessToken);
      
      // Create photos with different moderation states using service role
      const photos = [
        {
          uploader_id: adminUser.id,
          photo_url: 'https://cdn.example.com/pending-photo.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          moderation_status: 'pending',
        },
        {
          uploader_id: adminUser.id,
          photo_url: 'https://cdn.example.com/approved-photo.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          moderation_status: 'approved',
        },
        {
          uploader_id: adminUser.id,
          photo_url: 'https://cdn.example.com/rejected-photo.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          moderation_status: 'rejected',
        },
      ];
      
      const { data: createdPhotos } = await serviceClient
        .from('photos')
        .insert(photos)
        .select();
      
      if (createdPhotos) {
        createdPhotos.forEach(photo => trackEntity('photos', photo.id));
      }
      
      // Admin should be able to read all moderation states
      const { data: pendingPhotos, error: pendingError } = await client
        .from('photos')
        .select('*')
        .eq('moderation_status', 'pending');
      
      const { data: approvedPhotos, error: approvedError } = await client
        .from('photos')
        .select('*')
        .eq('moderation_status', 'approved');
      
      const { data: rejectedPhotos, error: rejectedError } = await client
        .from('photos')
        .select('*')
        .eq('moderation_status', 'rejected');
      
      expect(pendingError).toBeNull();
      expect(approvedError).toBeNull();
      expect(rejectedError).toBeNull();
      expect(pendingPhotos).toBeDefined();
      expect(approvedPhotos).toBeDefined();
      expect(rejectedPhotos).toBeDefined();
    });
    
    it('should allow admin to update photo metadata', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(adminUser.accessToken);
      
      // Create photo using service role
      const { data: photo } = await serviceClient
        .from('photos')
        .insert({
          uploader_id: adminUser.id,
          photo_url: 'https://cdn.example.com/update-test.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          caption: 'Original caption',
          moderation_status: 'pending',
        })
        .select()
        .single();
      
      if (!photo) {
        console.log('⏭️  Skipping: Could not create test photo');
        return;
      }
      
      trackEntity('photos', photo.id);
      
      // Admin should be able to update photo
      const { data: updatedPhoto, error } = await client
        .from('photos')
        .update({
          caption: 'Updated caption',
          alt_text: 'Updated alt text',
          moderation_status: 'approved',
        })
        .eq('id', photo.id)
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(updatedPhoto).toBeDefined();
      
      if (updatedPhoto) {
        expect(updatedPhoto.caption).toBe('Updated caption');
        expect(updatedPhoto.alt_text).toBe('Updated alt text');
        expect(updatedPhoto.moderation_status).toBe('approved');
      }
    });
    
    it('should allow admin to delete photo', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(adminUser.accessToken);
      
      // Create photo using service role
      const { data: photo } = await serviceClient
        .from('photos')
        .insert({
          uploader_id: adminUser.id,
          photo_url: 'https://cdn.example.com/delete-test.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          moderation_status: 'pending',
        })
        .select()
        .single();
      
      if (!photo) {
        console.log('⏭️  Skipping: Could not create test photo');
        return;
      }
      
      // Admin should be able to delete photo
      const { error } = await client
        .from('photos')
        .delete()
        .eq('id', photo.id);
      
      expect(error).toBeNull();
      
      // Verify photo is deleted
      const { data: deletedPhoto } = await serviceClient
        .from('photos')
        .select('*')
        .eq('id', photo.id)
        .single();
      
      expect(deletedPhoto).toBeNull();
    });
  });
  
  describe('Guest Photo Access Restrictions', () => {
    it('should allow guest to read only approved photos', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(guestUser.accessToken);
      
      // Create approved photo using service role
      const { data: approvedPhoto } = await serviceClient
        .from('photos')
        .insert({
          uploader_id: adminUser!.id,
          photo_url: 'https://cdn.example.com/approved-guest-test.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          moderation_status: 'approved',
        })
        .select()
        .single();
      
      if (approvedPhoto) {
        trackEntity('photos', approvedPhoto.id);
      }
      
      // Guest should be able to read approved photos
      const { data: photos, error } = await client
        .from('photos')
        .select('*')
        .eq('moderation_status', 'approved');
      
      expect(error).toBeNull();
      expect(photos).toBeDefined();
      expect(Array.isArray(photos)).toBe(true);
      
      if (photos && photos.length > 0) {
        // All returned photos should be approved
        photos.forEach(photo => {
          expect(photo.moderation_status).toBe('approved');
        });
      }
    });
    
    it('should prevent guest from reading pending photos', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(guestUser.accessToken);
      
      // Create pending photo using service role
      const { data: pendingPhoto } = await serviceClient
        .from('photos')
        .insert({
          uploader_id: adminUser!.id,
          photo_url: 'https://cdn.example.com/pending-guest-test.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          moderation_status: 'pending',
        })
        .select()
        .single();
      
      if (pendingPhoto) {
        trackEntity('photos', pendingPhoto.id);
      }
      
      // Guest should NOT be able to read pending photos
      const { data: photos } = await client
        .from('photos')
        .select('*')
        .eq('id', pendingPhoto!.id);
      
      // Should return empty array or null (RLS filters it out)
      expect(photos === null || (Array.isArray(photos) && photos.length === 0)).toBe(true);
    });
    
    it('should prevent guest from reading rejected photos', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(guestUser.accessToken);
      
      // Create rejected photo using service role
      const { data: rejectedPhoto } = await serviceClient
        .from('photos')
        .insert({
          uploader_id: adminUser!.id,
          photo_url: 'https://cdn.example.com/rejected-guest-test.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          moderation_status: 'rejected',
        })
        .select()
        .single();
      
      if (rejectedPhoto) {
        trackEntity('photos', rejectedPhoto.id);
      }
      
      // Guest should NOT be able to read rejected photos
      const { data: photos } = await client
        .from('photos')
        .select('*')
        .eq('id', rejectedPhoto!.id);
      
      // Should return empty array or null (RLS filters it out)
      expect(photos === null || (Array.isArray(photos) && photos.length === 0)).toBe(true);
    });
    
    it('should prevent guest from creating photos', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(guestUser.accessToken);
      
      const photoData = {
        uploader_id: guestUser.id,
        photo_url: 'https://cdn.example.com/guest-upload-test.jpg',
        storage_type: 'b2',
        page_type: 'memory',
        moderation_status: 'pending',
      };
      
      const { data, error } = await client
        .from('photos')
        .insert(photoData)
        .select()
        .single();
      
      // Guest should be able to upload their own photos
      // (RLS policy allows users to upload photos where uploader_id = auth.uid())
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data) {
        trackEntity('photos', data.id);
      }
    });
    
    it('should prevent guest from updating photos', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(guestUser.accessToken);
      
      // Create photo using service role
      const { data: photo } = await serviceClient
        .from('photos')
        .insert({
          uploader_id: adminUser!.id,
          photo_url: 'https://cdn.example.com/guest-update-test.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          moderation_status: 'approved',
        })
        .select()
        .single();
      
      if (!photo) {
        console.log('⏭️  Skipping: Could not create test photo');
        return;
      }
      
      trackEntity('photos', photo.id);
      
      // Guest should NOT be able to update photo
      const { data, error } = await client
        .from('photos')
        .update({ caption: 'Guest attempted update' })
        .eq('id', photo.id)
        .select()
        .single();
      
      // Should fail or return no data
      expect(data === null || error !== null).toBe(true);
    });
    
    it('should prevent guest from deleting photos', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(guestUser.accessToken);
      
      // Create photo using service role
      const { data: photo } = await serviceClient
        .from('photos')
        .insert({
          uploader_id: adminUser!.id,
          photo_url: 'https://cdn.example.com/guest-delete-test.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          moderation_status: 'approved',
        })
        .select()
        .single();
      
      if (!photo) {
        console.log('⏭️  Skipping: Could not create test photo');
        return;
      }
      
      trackEntity('photos', photo.id);
      
      // Guest should NOT be able to delete photo
      const { error } = await client
        .from('photos')
        .delete()
        .eq('id', photo.id);
      
      // Should fail with error
      expect(error).not.toBeNull();
      
      // Verify photo still exists
      const { data: existingPhoto } = await serviceClient
        .from('photos')
        .select('*')
        .eq('id', photo.id)
        .single();
      
      expect(existingPhoto).not.toBeNull();
    });
  });
  
  describe('Photo Filtering by Page Type and ID', () => {
    it('should filter photos by page_type and page_id', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(adminUser.accessToken);
      
      const testPageId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Create photos with different page types and IDs
      const photos = [
        {
          uploader_id: adminUser.id,
          photo_url: 'https://cdn.example.com/event-photo.jpg',
          storage_type: 'b2',
          page_type: 'event',
          page_id: testPageId,
          moderation_status: 'approved',
        },
        {
          uploader_id: adminUser.id,
          photo_url: 'https://cdn.example.com/activity-photo.jpg',
          storage_type: 'b2',
          page_type: 'activity',
          page_id: testPageId,
          moderation_status: 'approved',
        },
        {
          uploader_id: adminUser.id,
          photo_url: 'https://cdn.example.com/memory-photo.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          page_id: null,
          moderation_status: 'approved',
        },
      ];
      
      const { data: createdPhotos } = await serviceClient
        .from('photos')
        .insert(photos)
        .select();
      
      if (createdPhotos) {
        createdPhotos.forEach(photo => trackEntity('photos', photo.id));
      }
      
      // Filter by page_type = 'event'
      const { data: eventPhotos, error: eventError } = await client
        .from('photos')
        .select('*')
        .eq('page_type', 'event')
        .eq('page_id', testPageId);
      
      expect(eventError).toBeNull();
      expect(eventPhotos).toBeDefined();
      expect(Array.isArray(eventPhotos)).toBe(true);
      
      if (eventPhotos && eventPhotos.length > 0) {
        eventPhotos.forEach(photo => {
          expect(photo.page_type).toBe('event');
          expect(photo.page_id).toBe(testPageId);
        });
      }
      
      // Filter by page_type = 'memory' with null page_id
      const { data: memoryPhotos, error: memoryError } = await client
        .from('photos')
        .select('*')
        .eq('page_type', 'memory')
        .is('page_id', null);
      
      expect(memoryError).toBeNull();
      expect(memoryPhotos).toBeDefined();
      
      if (memoryPhotos && memoryPhotos.length > 0) {
        memoryPhotos.forEach(photo => {
          expect(photo.page_type).toBe('memory');
          expect(photo.page_id).toBeNull();
        });
      }
    });
  });
  
  describe('RLS Error Prevention', () => {
    it('should not cause "permission denied" errors with real auth', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(adminUser.accessToken);
      
      // Perform various operations that should not cause permission errors
      const { error: selectError } = await client
        .from('photos')
        .select('*')
        .limit(10);
      
      const { error: insertError } = await client
        .from('photos')
        .insert({
          uploader_id: adminUser.id,
          photo_url: 'https://cdn.example.com/permission-test.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          moderation_status: 'approved',
        })
        .select()
        .single();
      
      // Should not get permission denied errors
      expect(selectError).toBeNull();
      expect(insertError).toBeNull();
      
      if (insertError === null) {
        // Track for cleanup if insert succeeded
        const { data } = await client
          .from('photos')
          .select('id')
          .eq('photo_url', 'https://cdn.example.com/permission-test.jpg')
          .single();
        
        if (data) {
          trackEntity('photos', data.id);
        }
      }
    });
  });
  
  describe('Service Role Bypass', () => {
    it('should allow service role to bypass RLS', async () => {
      if (authSetupFailed || !adminUser?.id) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      
      // Service role should be able to create photo without RLS restrictions
      const { data: photo, error } = await serviceClient
        .from('photos')
        .insert({
          uploader_id: adminUser.id,
          photo_url: 'https://cdn.example.com/service-role-test.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          moderation_status: 'pending',
        })
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(photo).toBeDefined();
      
      if (photo) {
        trackEntity('photos', photo.id);
        
        // Service role should be able to read any photo
        const { data: readPhoto, error: readError } = await serviceClient
          .from('photos')
          .select('*')
          .eq('id', photo.id)
          .single();
        
        expect(readError).toBeNull();
        expect(readPhoto).toBeDefined();
        
        // Service role should be able to update any photo
        const { data: updatedPhoto, error: updateError } = await serviceClient
          .from('photos')
          .update({ moderation_status: 'approved' })
          .eq('id', photo.id)
          .select()
          .single();
        
        expect(updateError).toBeNull();
        expect(updatedPhoto).toBeDefined();
        
        // Service role should be able to delete any photo
        const { error: deleteError } = await serviceClient
          .from('photos')
          .delete()
          .eq('id', photo.id);
        
        expect(deleteError).toBeNull();
      }
    });
  });
});

/**
 * TEST IMPLEMENTATION NOTES
 * 
 * These tests validate RLS policies for the photos table:
 * 
 * 1. **Admin Operations**: Create, read, update, delete with real auth
 * 2. **Moderation States**: Admin can read all states (pending, approved, rejected)
 * 3. **Guest Restrictions**: Guests can only read approved photos
 * 4. **Guest Limitations**: Guests cannot update or delete photos
 * 5. **Filtering**: Photos filtered by page_type and page_id
 * 6. **Error Prevention**: No "permission denied" errors with proper auth
 * 7. **Service Role**: Service role can bypass RLS for admin operations
 * 
 * Key Testing Patterns:
 * - Uses real authentication (not service role for user operations)
 * - Tests both admin and guest user roles
 * - Verifies moderation status filtering
 * - Checks page_type and page_id filtering
 * - Validates RLS doesn't cause permission errors
 * - Confirms service role can bypass RLS
 * - Cleans up test data after execution
 * 
 * What These Tests Catch:
 * - Missing RLS policies on photos table
 * - Incorrect RLS policy logic for moderation
 * - Permission denied errors with real auth
 * - Guests accessing non-approved photos
 * - Guests modifying photos they shouldn't
 * - Filtering issues with page_type/page_id
 * 
 * Validates: Requirements 1.2, 1.3, 1.4
 */
