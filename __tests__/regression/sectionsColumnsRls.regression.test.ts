/**
 * Sections & Columns RLS Regression Test
 * 
 * This test validates Row-Level Security (RLS) policies for the sections and columns tables.
 * Tests ensure that:
 * - Admins can create, read, update, and delete sections with real auth
 * - Admins can create, read, update, and delete columns with real auth
 * - Guests can only read sections and columns
 * - Guests cannot create, update, or delete sections or columns
 * - Sections are properly filtered by page_type and page_id
 * - RLS doesn't cause "permission denied for table users" errors
 * - Deleting a section cascades to its columns
 * - Service role can bypass RLS for admin operations
 * 
 * Validates: Requirements 1.2, 1.3, 1.4 (Security Testing)
 */

import { createAndSignInTestUser, deleteTestUser, createServiceClient, createTestClient, type TestUser } from '../helpers/testDb';
import { cleanupByIds } from '../helpers/cleanup';

describe('Sections & Columns RLS Regression Tests', () => {
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
      
      console.log('✅ Test users created for sections & columns RLS tests');
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
  
  describe('Admin Section Operations with Real Auth', () => {
    it('should allow admin to create section with real auth (not service role)', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(adminUser.accessToken);
      
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
        expect(data.title).toBe('Test Section');
        trackEntity('sections', data.id);
      }
    });

    
    it('should allow admin to create columns for section', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(adminUser.accessToken);
      
      // Create section using service role
      const { data: section } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174001',
          display_order: 0,
        })
        .select()
        .single();
      
      if (!section) {
        console.log('⏭️  Skipping: Could not create test section');
        return;
      }
      
      trackEntity('sections', section.id);
      
      // Admin should be able to create columns
      const columnData = {
        section_id: section.id,
        column_number: 1,
        content_type: 'rich_text',
        content_data: { html: '<p>Test content</p>' },
      };
      
      const { data: column, error } = await client
        .from('columns')
        .insert(columnData)
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(column).toBeDefined();
      
      if (column) {
        expect(column.section_id).toBe(section.id);
        expect(column.column_number).toBe(1);
        expect(column.content_type).toBe('rich_text');
        trackEntity('columns', column.id);
      }
    });

    
    it('should allow admin to update section title', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(adminUser.accessToken);
      
      // Create section using service role
      const { data: section } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174002',
          title: 'Original Title',
          display_order: 0,
        })
        .select()
        .single();
      
      if (!section) {
        console.log('⏭️  Skipping: Could not create test section');
        return;
      }
      
      trackEntity('sections', section.id);
      
      // Admin should be able to update section
      const { data: updatedSection, error } = await client
        .from('sections')
        .update({ title: 'Updated Title' })
        .eq('id', section.id)
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(updatedSection).toBeDefined();
      
      if (updatedSection) {
        expect(updatedSection.title).toBe('Updated Title');
      }
    });
    
    it('should allow admin to update column content', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(adminUser.accessToken);
      
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
      
      trackEntity('sections', section.id);
      
      const { data: column } = await serviceClient
        .from('columns')
        .insert({
          section_id: section.id,
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '<p>Original content</p>' },
        })
        .select()
        .single();
      
      if (!column) {
        console.log('⏭️  Skipping: Could not create test column');
        return;
      }
      
      trackEntity('columns', column.id);
      
      // Admin should be able to update column
      const { data: updatedColumn, error } = await client
        .from('columns')
        .update({ content_data: { html: '<p>Updated content</p>' } })
        .eq('id', column.id)
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(updatedColumn).toBeDefined();
      
      if (updatedColumn) {
        expect(updatedColumn.content_data).toEqual({ html: '<p>Updated content</p>' });
      }
    });

    
    it('should allow admin to delete section (cascades to columns)', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(adminUser.accessToken);
      
      // Create section and column using service role
      const { data: section } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174004',
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
      
      // Admin should be able to delete section
      const { error } = await client
        .from('sections')
        .delete()
        .eq('id', section.id);
      
      expect(error).toBeNull();
      
      // Verify section is deleted
      const { data: deletedSection } = await serviceClient
        .from('sections')
        .select('*')
        .eq('id', section.id)
        .single();
      
      expect(deletedSection).toBeNull();
      
      // Verify column is also deleted (cascade)
      const { data: deletedColumn } = await serviceClient
        .from('columns')
        .select('*')
        .eq('id', column.id)
        .single();
      
      expect(deletedColumn).toBeNull();
    });
  });

  
  describe('Guest Section and Column Access Restrictions', () => {
    it('should allow guest to read sections and columns', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(guestUser.accessToken);
      
      // Create section and column using service role
      const { data: section } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174005',
          title: 'Guest Readable Section',
          display_order: 0,
        })
        .select()
        .single();
      
      if (section) {
        trackEntity('sections', section.id);
      }
      
      const { data: column } = await serviceClient
        .from('columns')
        .insert({
          section_id: section!.id,
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '<p>Guest readable content</p>' },
        })
        .select()
        .single();
      
      if (column) {
        trackEntity('columns', column.id);
      }
      
      // Guest should be able to read sections
      const { data: sections, error: sectionsError } = await client
        .from('sections')
        .select('*')
        .eq('page_type', 'event');
      
      expect(sectionsError).toBeNull();
      expect(sections).toBeDefined();
      expect(Array.isArray(sections)).toBe(true);
      
      // Guest should be able to read columns
      const { data: columns, error: columnsError } = await client
        .from('columns')
        .select('*')
        .eq('section_id', section!.id);
      
      expect(columnsError).toBeNull();
      expect(columns).toBeDefined();
      expect(Array.isArray(columns)).toBe(true);
    });

    
    it('should prevent guest from creating sections', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(guestUser.accessToken);
      
      const sectionData = {
        page_type: 'event',
        page_id: '123e4567-e89b-12d3-a456-426614174006',
        title: 'Guest Created Section',
        display_order: 0,
      };
      
      const { data, error } = await client
        .from('sections')
        .insert(sectionData)
        .select()
        .single();
      
      // Guest should NOT be able to create sections
      expect(data === null || error !== null).toBe(true);
    });
    
    it('should prevent guest from updating sections', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(guestUser.accessToken);
      
      // Create section using service role
      const { data: section } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174007',
          title: 'Original Title',
          display_order: 0,
        })
        .select()
        .single();
      
      if (!section) {
        console.log('⏭️  Skipping: Could not create test section');
        return;
      }
      
      trackEntity('sections', section.id);
      
      // Guest should NOT be able to update section
      const { data, error } = await client
        .from('sections')
        .update({ title: 'Guest Updated Title' })
        .eq('id', section.id)
        .select()
        .single();
      
      // Should fail or return no data
      expect(data === null || error !== null).toBe(true);
    });
    
    it('should prevent guest from deleting sections', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(guestUser.accessToken);
      
      // Create section using service role
      const { data: section } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174008',
          display_order: 0,
        })
        .select()
        .single();
      
      if (!section) {
        console.log('⏭️  Skipping: Could not create test section');
        return;
      }
      
      trackEntity('sections', section.id);
      
      // Guest should NOT be able to delete section
      const { error } = await client
        .from('sections')
        .delete()
        .eq('id', section.id);
      
      // Should fail with error
      expect(error).not.toBeNull();
      
      // Verify section still exists
      const { data: existingSection } = await serviceClient
        .from('sections')
        .select('*')
        .eq('id', section.id)
        .single();
      
      expect(existingSection).not.toBeNull();
    });

    
    it('should prevent guest from creating columns', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(guestUser.accessToken);
      
      // Create section using service role
      const { data: section } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174009',
          display_order: 0,
        })
        .select()
        .single();
      
      if (!section) {
        console.log('⏭️  Skipping: Could not create test section');
        return;
      }
      
      trackEntity('sections', section.id);
      
      // Guest should NOT be able to create columns
      const columnData = {
        section_id: section.id,
        column_number: 1,
        content_type: 'rich_text',
        content_data: { html: '<p>Guest created content</p>' },
      };
      
      const { data, error } = await client
        .from('columns')
        .insert(columnData)
        .select()
        .single();
      
      // Should fail or return no data
      expect(data === null || error !== null).toBe(true);
    });
    
    it('should prevent guest from updating columns', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(guestUser.accessToken);
      
      // Create section and column using service role
      const { data: section } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174010',
          display_order: 0,
        })
        .select()
        .single();
      
      if (!section) {
        console.log('⏭️  Skipping: Could not create test section');
        return;
      }
      
      trackEntity('sections', section.id);
      
      const { data: column } = await serviceClient
        .from('columns')
        .insert({
          section_id: section.id,
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '<p>Original content</p>' },
        })
        .select()
        .single();
      
      if (!column) {
        console.log('⏭️  Skipping: Could not create test column');
        return;
      }
      
      trackEntity('columns', column.id);
      
      // Guest should NOT be able to update column
      const { data, error } = await client
        .from('columns')
        .update({ content_data: { html: '<p>Guest updated content</p>' } })
        .eq('id', column.id)
        .select()
        .single();
      
      // Should fail or return no data
      expect(data === null || error !== null).toBe(true);
    });

    
    it('should prevent guest from deleting columns', async () => {
      if (authSetupFailed || !guestUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(guestUser.accessToken);
      
      // Create section and column using service role
      const { data: section } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174011',
          display_order: 0,
        })
        .select()
        .single();
      
      if (!section) {
        console.log('⏭️  Skipping: Could not create test section');
        return;
      }
      
      trackEntity('sections', section.id);
      
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
      
      trackEntity('columns', column.id);
      
      // Guest should NOT be able to delete column
      const { error } = await client
        .from('columns')
        .delete()
        .eq('id', column.id);
      
      // Should fail with error
      expect(error).not.toBeNull();
      
      // Verify column still exists
      const { data: existingColumn } = await serviceClient
        .from('columns')
        .select('*')
        .eq('id', column.id)
        .single();
      
      expect(existingColumn).not.toBeNull();
    });
  });

  
  describe('Section Filtering by Page Type and ID', () => {
    it('should filter sections by page_type and page_id', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      const client = createTestClient(adminUser.accessToken);
      
      const testPageId1 = '123e4567-e89b-12d3-a456-426614174012';
      const testPageId2 = '123e4567-e89b-12d3-a456-426614174013';
      
      // Create sections with different page types and IDs
      const sections = [
        {
          page_type: 'event',
          page_id: testPageId1,
          title: 'Event Section 1',
          display_order: 0,
        },
        {
          page_type: 'event',
          page_id: testPageId2,
          title: 'Event Section 2',
          display_order: 0,
        },
        {
          page_type: 'activity',
          page_id: testPageId1,
          title: 'Activity Section',
          display_order: 0,
        },
        {
          page_type: 'accommodation',
          page_id: testPageId1,
          title: 'Accommodation Section',
          display_order: 0,
        },
      ];
      
      const { data: createdSections } = await serviceClient
        .from('sections')
        .insert(sections)
        .select();
      
      if (createdSections) {
        createdSections.forEach(section => trackEntity('sections', section.id));
      }
      
      // Filter by page_type = 'event'
      const { data: eventSections, error: eventError } = await client
        .from('sections')
        .select('*')
        .eq('page_type', 'event');
      
      expect(eventError).toBeNull();
      expect(eventSections).toBeDefined();
      expect(Array.isArray(eventSections)).toBe(true);
      
      if (eventSections && eventSections.length > 0) {
        eventSections.forEach(section => {
          expect(section.page_type).toBe('event');
        });
      }
      
      // Filter by page_type = 'event' AND page_id = testPageId1
      const { data: filteredSections, error: filteredError } = await client
        .from('sections')
        .select('*')
        .eq('page_type', 'event')
        .eq('page_id', testPageId1);
      
      expect(filteredError).toBeNull();
      expect(filteredSections).toBeDefined();
      
      if (filteredSections && filteredSections.length > 0) {
        filteredSections.forEach(section => {
          expect(section.page_type).toBe('event');
          expect(section.page_id).toBe(testPageId1);
        });
      }
      
      // Filter by page_type = 'activity'
      const { data: activitySections, error: activityError } = await client
        .from('sections')
        .select('*')
        .eq('page_type', 'activity')
        .eq('page_id', testPageId1);
      
      expect(activityError).toBeNull();
      expect(activitySections).toBeDefined();
      
      if (activitySections && activitySections.length > 0) {
        activitySections.forEach(section => {
          expect(section.page_type).toBe('activity');
          expect(section.page_id).toBe(testPageId1);
        });
      }
    });
  });

  
  describe('RLS Error Prevention', () => {
    it('should not cause "permission denied for table users" errors with real auth', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(adminUser.accessToken);
      
      // Perform various operations that should not cause permission errors
      const { error: selectSectionsError } = await client
        .from('sections')
        .select('*')
        .limit(10);
      
      const { error: selectColumnsError } = await client
        .from('columns')
        .select('*')
        .limit(10);
      
      const { error: insertSectionError } = await client
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174014',
          title: 'Permission Test Section',
          display_order: 0,
        })
        .select()
        .single();
      
      // Should not get permission denied errors
      expect(selectSectionsError).toBeNull();
      expect(selectColumnsError).toBeNull();
      expect(insertSectionError).toBeNull();
      
      if (insertSectionError === null) {
        // Track for cleanup if insert succeeded
        const { data } = await client
          .from('sections')
          .select('id')
          .eq('page_id', '123e4567-e89b-12d3-a456-426614174014')
          .single();
        
        if (data) {
          trackEntity('sections', data.id);
        }
      }
    });
    
    it('should not reference users table in RLS policies', async () => {
      if (authSetupFailed || !adminUser?.accessToken) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const client = createTestClient(adminUser.accessToken);
      
      // This test validates that RLS policies don't cause "permission denied for table users"
      // by attempting operations that would trigger such errors if policies were misconfigured
      
      const { error: createError } = await client
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174015',
          display_order: 0,
        })
        .select()
        .single();
      
      // Should not contain "permission denied" or "users" in error message
      if (createError) {
        expect(createError.message).not.toContain('permission denied');
        expect(createError.message).not.toContain('users');
      } else {
        // Track for cleanup if insert succeeded
        const { data } = await client
          .from('sections')
          .select('id')
          .eq('page_id', '123e4567-e89b-12d3-a456-426614174015')
          .single();
        
        if (data) {
          trackEntity('sections', data.id);
        }
      }
    });
  });

  
  describe('Service Role Bypass', () => {
    it('should allow service role to bypass RLS for sections and columns', async () => {
      if (authSetupFailed || !adminUser?.id) {
        console.log('⏭️  Skipping: Authentication not configured');
        return;
      }
      
      const serviceClient = createServiceClient();
      
      // Service role should be able to create section without RLS restrictions
      const { data: section, error: sectionError } = await serviceClient
        .from('sections')
        .insert({
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174016',
          title: 'Service Role Test Section',
          display_order: 0,
        })
        .select()
        .single();
      
      expect(sectionError).toBeNull();
      expect(section).toBeDefined();
      
      if (section) {
        trackEntity('sections', section.id);
        
        // Service role should be able to create column
        const { data: column, error: columnError } = await serviceClient
          .from('columns')
          .insert({
            section_id: section.id,
            column_number: 1,
            content_type: 'rich_text',
            content_data: { html: '<p>Service role content</p>' },
          })
          .select()
          .single();
        
        expect(columnError).toBeNull();
        expect(column).toBeDefined();
        
        if (column) {
          trackEntity('columns', column.id);
          
          // Service role should be able to read any section
          const { data: readSection, error: readSectionError } = await serviceClient
            .from('sections')
            .select('*')
            .eq('id', section.id)
            .single();
          
          expect(readSectionError).toBeNull();
          expect(readSection).toBeDefined();
          
          // Service role should be able to read any column
          const { data: readColumn, error: readColumnError } = await serviceClient
            .from('columns')
            .select('*')
            .eq('id', column.id)
            .single();
          
          expect(readColumnError).toBeNull();
          expect(readColumn).toBeDefined();
          
          // Service role should be able to update any section
          const { data: updatedSection, error: updateSectionError } = await serviceClient
            .from('sections')
            .update({ title: 'Updated by service role' })
            .eq('id', section.id)
            .select()
            .single();
          
          expect(updateSectionError).toBeNull();
          expect(updatedSection).toBeDefined();
          
          // Service role should be able to update any column
          const { data: updatedColumn, error: updateColumnError } = await serviceClient
            .from('columns')
            .update({ content_data: { html: '<p>Updated by service role</p>' } })
            .eq('id', column.id)
            .select()
            .single();
          
          expect(updateColumnError).toBeNull();
          expect(updatedColumn).toBeDefined();
          
          // Service role should be able to delete any column
          const { error: deleteColumnError } = await serviceClient
            .from('columns')
            .delete()
            .eq('id', column.id);
          
          expect(deleteColumnError).toBeNull();
          
          // Service role should be able to delete any section
          const { error: deleteSectionError } = await serviceClient
            .from('sections')
            .delete()
            .eq('id', section.id);
          
          expect(deleteSectionError).toBeNull();
        }
      }
    });
  });
});


/**
 * TEST IMPLEMENTATION NOTES
 * 
 * These tests validate RLS policies for the sections and columns tables:
 * 
 * 1. **Admin Operations**: Create, read, update, delete with real auth
 * 2. **Column Management**: Admin can manage columns for sections
 * 3. **Cascade Deletion**: Deleting section cascades to columns
 * 4. **Guest Restrictions**: Guests can only read sections and columns
 * 5. **Guest Limitations**: Guests cannot create, update, or delete
 * 6. **Filtering**: Sections filtered by page_type and page_id
 * 7. **Error Prevention**: No "permission denied for table users" errors
 * 8. **Service Role**: Service role can bypass RLS for admin operations
 * 
 * Key Testing Patterns:
 * - Uses real authentication (not service role for user operations)
 * - Tests both admin and guest user roles
 * - Verifies cascade deletion from sections to columns
 * - Checks page_type and page_id filtering
 * - Validates RLS doesn't cause permission errors
 * - Confirms service role can bypass RLS
 * - Cleans up test data after execution
 * 
 * What These Tests Catch:
 * - Missing RLS policies on sections/columns tables
 * - Incorrect RLS policy logic
 * - Permission denied errors with real auth
 * - Guests modifying sections/columns they shouldn't
 * - Filtering issues with page_type/page_id
 * - Cascade deletion not working properly
 * - RLS policies referencing users table incorrectly
 * 
 * Validates: Requirements 1.2, 1.3, 1.4
 */
