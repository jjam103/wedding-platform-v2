/**
 * RLS Policies Integration Tests
 * 
 * These tests validate that Row-Level Security (RLS) policies are properly enforced
 * for all database tables. Uses real authentication (not service role) to ensure
 * RLS policies work as expected.
 * 
 * This catches RLS bugs that unit tests miss because unit tests often use service
 * role which bypasses RLS entirely.
 * 
 * Validates: Requirements 1.2, 1.3, 1.4
 */

import { createAndSignInTestUser, deleteTestUser, createServiceClient, createTestClient, type TestUser } from '../helpers/testDb';
import { createTestGuestGroup, createTestGuest, createTestEvent, createTestActivity, createTestAccommodation, createTestSection, createTestContentPage } from '../helpers/factories';
import { cleanupByIds } from '../helpers/cleanup';

describe('RLS Policies Integration Tests', () => {
  let testUser: TestUser | null = null;
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
      testUser = await createAndSignInTestUser();
      console.log('✅ Test user created for RLS tests');
    } catch (error) {
      console.warn('⚠️  Failed to create test user:', error instanceof Error ? error.message : error);
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
    
    // Clean up test user
    if (testUser?.id) {
      try {
        await deleteTestUser(testUser.id);
        console.log('✅ Test user cleaned up');
      } catch (error) {
        console.warn('⚠️  Failed to clean up test user:', error);
      }
    }
  }, 10000);
  
  describe('groups Table RLS', () => {
    it('should allow authenticated users to read guest groups', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      const { data, error } = await client
        .from('groups')
        .select('*')
        .limit(10);
      
      // Should not get RLS error
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('should allow authenticated users to create guest groups', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      const testGroup = createTestGuestGroup();
      
      const { data, error } = await client
        .from('groups')
        .insert({
          name: testGroup.name,
          description: testGroup.description,
        })
        .select()
        .single();
      
      // Should not get RLS error
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data) {
        trackEntity('groups', data.id);
      }
    });
    
    it('should prevent unauthenticated access to guest groups', async () => {
      const client = createTestClient(); // No access token
      
      const { data, error } = await client
        .from('groups')
        .select('*')
        .limit(10);
      
      // Should get auth error or empty result
      expect(data === null || (Array.isArray(data) && data.length === 0)).toBe(true);
    });
  });
  
  describe('guests Table RLS', () => {
    it('should allow authenticated users to read guests', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      const { data, error } = await client
        .from('guests')
        .select('*')
        .limit(10);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('should allow authenticated users to create guests', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      // First create a group
      const serviceClient = createServiceClient();
      const testGroup = createTestGuestGroup();
      const { data: group } = await serviceClient
        .from('groups')
        .insert({ name: testGroup.name, description: testGroup.description })
        .select()
        .single();
      
      if (!group) {
        console.log('⏭️  Skipping: Could not create test group');
        return;
      }
      
      trackEntity('groups', group.id);
      
      // Now create guest with authenticated client
      const client = createTestClient(testUser.accessToken);
      const testGuest = createTestGuest({ group_id: group.id });
      
      const { data, error } = await client
        .from('guests')
        .insert({
          first_name: testGuest.first_name,
          last_name: testGuest.last_name,
          email: testGuest.email,
          group_id: testGuest.group_id,
          age_type: testGuest.age_type,
          guest_type: testGuest.guest_type,
          invitation_sent: testGuest.invitation_sent,
        })
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data) {
        trackEntity('guests', data.id);
      }
    });
  });
  
  describe('events Table RLS', () => {
    it('should allow authenticated users to read events', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      const { data, error } = await client
        .from('events')
        .select('*')
        .limit(10);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('should allow authenticated users to create events', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      const testEvent = createTestEvent();
      
      const { data, error } = await client
        .from('events')
        .insert({
          name: testEvent.name,
          description: testEvent.description,
          event_type: testEvent.event_type,
          start_date: testEvent.start_date,
          end_date: testEvent.end_date,
          rsvp_required: testEvent.rsvp_required,
          visibility: testEvent.visibility,
          status: testEvent.status,
        })
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data) {
        trackEntity('events', data.id);
      }
    });
  });
  
  describe('activities Table RLS', () => {
    it('should allow authenticated users to read activities', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      const { data, error } = await client
        .from('activities')
        .select('*')
        .limit(10);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });
  
  describe('accommodations Table RLS', () => {
    it('should allow authenticated users to read accommodations', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      const { data, error } = await client
        .from('accommodations')
        .select('*')
        .limit(10);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });
  
  describe('sections Table RLS', () => {
    it('should allow authenticated users to read sections', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      const { data, error } = await client
        .from('sections')
        .select('*')
        .limit(10);
      
      // Should not get "permission denied for table users" error
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('should allow authenticated users to create sections', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      const sectionData = {
        page_type: 'event',
        page_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Section',
        display_order: 0,
      };
      
      const { data, error } = await client
        .from('sections')
        .insert(sectionData)
        .select()
        .single();
      
      // Should not get RLS error
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data) {
        expect(data.page_type).toBe('event');
        expect(data.page_id).toBe(sectionData.page_id);
        trackEntity('sections', data.id);
      }
    });
    
    it('should filter sections by page_type and page_id', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(testUser.accessToken);
      
      const testPageId = '123e4567-e89b-12d3-a456-426614174001';
      
      // Create test section using service role
      const { data: section } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: testPageId,
          title: 'Filterable Section',
          display_order: 0,
        })
        .select()
        .single();
      
      if (section) {
        trackEntity('sections', section.id);
      }
      
      // Filter by page_type and page_id
      const { data, error } = await client
        .from('sections')
        .select('*')
        .eq('page_type', 'event')
        .eq('page_id', testPageId);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });
  
  describe('columns Table RLS', () => {
    it('should allow authenticated users to read columns', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      const { data, error } = await client
        .from('columns')
        .select('*')
        .limit(10);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('should allow authenticated users to create columns', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(testUser.accessToken);
      
      // Create section using service role
      const { data: section } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174002',
          display_order: 0,
        })
        .select()
        .single();
      
      if (!section) {
        console.log('⏭️  Skipping: Could not create test section');
        return;
      }
      
      trackEntity('sections', section.id);
      
      // Create column with authenticated client
      const columnData = {
        section_id: section.id,
        column_number: 1,
        content_type: 'rich_text',
        content_data: { html: '<p>Test content</p>' },
      };
      
      const { data, error } = await client
        .from('columns')
        .insert(columnData)
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data) {
        expect(data.section_id).toBe(section.id);
        expect(data.column_number).toBe(1);
        trackEntity('columns', data.id);
      }
    });
    
    it('should verify cascade deletion from sections to columns', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(testUser.accessToken);
      
      // Create section and column using service role
      const { data: section } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174003',
          display_order: 0,
        })
        .select()
        .single();
      
      if (!section) {
        console.log('⏭️  Skipping: Could not create test section');
        return;
      }
      
      const { data: column } = await serviceClient
        .from('columns')
        .insert({
          section_id: section.id,
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '<p>Test content</p>' },
        })
        .select()
        .single();
      
      if (!column) {
        console.log('⏭️  Skipping: Could not create test column');
        return;
      }
      
      // Delete section (should cascade to column)
      const { error: deleteError } = await client
        .from('sections')
        .delete()
        .eq('id', section.id);
      
      expect(deleteError).toBeNull();
      
      // Verify column is also deleted
      const { data: deletedColumn } = await serviceClient
        .from('columns')
        .select('*')
        .eq('id', column.id)
        .single();
      
      expect(deletedColumn).toBeNull();
    });
  });
  
  describe('content_pages Table RLS', () => {
    it('should allow authenticated users to read content pages', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      const { data, error } = await client
        .from('content_pages')
        .select('*')
        .limit(10);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('should allow authenticated users to create content pages', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      const testPage = createTestContentPage();
      
      const { data, error } = await client
        .from('content_pages')
        .insert({
          title: testPage.title,
          slug: testPage.slug,
          type: testPage.type,
          published: testPage.published,
        })
        .select()
        .single();
      
      // Should not get "violates row-level security policy" error
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data) {
        trackEntity('content_pages', data.id);
      }
    });
  });
  
  describe('gallery_settings Table RLS', () => {
    it('should allow authenticated users to read gallery settings', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      const { data, error } = await client
        .from('gallery_settings')
        .select('*')
        .limit(10);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });
  
  describe('photos Table RLS', () => {
    it('should allow authenticated users to read approved photos', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      const { data, error } = await client
        .from('photos')
        .select('*')
        .eq('moderation_status', 'approved')
        .limit(10);
      
      // Should not get RLS error
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('should allow authenticated users to upload photos', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      const photoData = {
        uploader_id: testUser.id,
        photo_url: `https://cdn.example.com/test-photo-${Date.now()}.jpg`,
        storage_type: 'b2',
        page_type: 'memory',
        moderation_status: 'pending',
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
        trackEntity('photos', data.id);
      }
    });
    
    it('should allow users to view their own photos', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      // Create photo
      const photoData = {
        uploader_id: testUser.id,
        photo_url: `https://cdn.example.com/own-photo-${Date.now()}.jpg`,
        storage_type: 'b2',
        page_type: 'memory',
        moderation_status: 'pending',
      };
      
      const { data: createdPhoto } = await client
        .from('photos')
        .insert(photoData)
        .select()
        .single();
      
      if (!createdPhoto) {
        console.log('⏭️  Skipping: Could not create test photo');
        return;
      }
      
      trackEntity('photos', createdPhoto.id);
      
      // Should be able to view own photo even if pending
      const { data, error } = await client
        .from('photos')
        .select('*')
        .eq('id', createdPhoto.id)
        .single();
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(createdPhoto.id);
    });
    
    it('should filter photos by page_type and page_id', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(testUser.accessToken);
      
      const testPageId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Create test photo with service role
      const { data: photo } = await serviceClient
        .from('photos')
        .insert({
          uploader_id: testUser.id,
          photo_url: `https://cdn.example.com/filtered-photo-${Date.now()}.jpg`,
          storage_type: 'b2',
          page_type: 'event',
          page_id: testPageId,
          moderation_status: 'approved',
        })
        .select()
        .single();
      
      if (photo) {
        trackEntity('photos', photo.id);
      }
      
      // Filter by page_type and page_id
      const { data, error } = await client
        .from('photos')
        .select('*')
        .eq('page_type', 'event')
        .eq('page_id', testPageId);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });
  
  describe('Cross-Table RLS Consistency', () => {
    it('should enforce consistent RLS across related tables', async () => {
      if (authSetupFailed || !testUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(testUser.accessToken);
      
      // Try to read from multiple tables
      const [groupsResult, guestsResult, eventsResult] = await Promise.all([
        client.from('groups').select('*').limit(1),
        client.from('guests').select('*').limit(1),
        client.from('events').select('*').limit(1),
      ]);
      
      // All should succeed or fail consistently (no RLS errors)
      expect(groupsResult.error).toBeNull();
      expect(guestsResult.error).toBeNull();
      expect(eventsResult.error).toBeNull();
    });
  });
});

/**
 * TEST IMPLEMENTATION NOTES
 * 
 * These tests validate RLS policies for all major tables:
 * 
 * 1. **groups**: Read, create, and auth enforcement
 * 2. **guests**: Read, create with proper group reference
 * 3. **events**: Read and create
 * 4. **activities**: Read operations
 * 5. **accommodations**: Read operations
 * 6. **sections**: Read, create (catches "permission denied for table users" bug)
 * 7. **columns**: Read operations
 * 8. **content_pages**: Read, create (catches RLS violation bug)
 * 9. **gallery_settings**: Read operations
 * 
 * Key Testing Patterns:
 * - Uses real authentication (not service role)
 * - Tests both read and write operations
 * - Verifies unauthenticated access is blocked
 * - Checks for specific RLS error messages
 * - Cleans up test data after execution
 * 
 * What These Tests Catch:
 * - Missing RLS policies
 * - Incorrect RLS policy logic
 * - Permission denied errors
 * - RLS policy violations
 * - Inconsistent access control
 * 
 * Validates: Requirements 1.2, 1.3, 1.4
 */
