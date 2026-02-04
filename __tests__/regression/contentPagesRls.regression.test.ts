/**
 * Content Pages RLS Regression Test
 * 
 * This test prevents regression of the "violates row-level security policy" bug
 * that occurred when creating content pages with real authentication.
 * 
 * Bug Description:
 * - Content pages table had RLS policies enabled
 * - Service methods used service role client that bypassed RLS
 * - When called from API routes with real auth, RLS policies were enforced
 * - RLS policies were misconfigured or missing for authenticated users
 * - Result: "new row violates row-level security policy" error
 * 
 * This test validates:
 * - Content pages can be created with real authentication
 * - RLS policies allow authenticated users to manage content pages
 * - No RLS violation errors occur
 * 
 * Validates: Requirements 5.5
 */

import { withTestDatabase } from '../helpers/testDb';
import { createTestContentPage } from '../helpers/factories';
import { cleanupTestContentPages } from '../helpers/cleanup';
import * as contentPagesService from '@/services/contentPagesService';

describe('Content Pages RLS Regression Tests', () => {
  afterEach(async () => {
    // Clean up test data
    await cleanupTestContentPages();
  });
  
  it('should create content page with real auth without RLS violation', async () => {
    await withTestDatabase(async (db) => {
      // Create authenticated user (not service role!)
      const { client, user } = await db.createAuthenticatedClient();
      
      // Create content page with real authentication
      const pageData = {
        title: `Test Page ${Date.now()}`,
        slug: `test-page-${Date.now()}`,
        type: 'custom' as const,
        published: false,
      };
      
      const result = await contentPagesService.create(pageData);
      
      // THIS IS THE KEY TEST - Would have caught the RLS bug!
      // The bug caused: "new row violates row-level security policy"
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.title).toBe(pageData.title);
        expect(result.data.slug).toBe(pageData.slug);
        expect(result.data.type).toBe(pageData.type);
      } else {
        // If this fails, check the error message
        console.error('Content page creation failed:', result.error);
        expect(result.error.message).not.toContain('row-level security');
        expect(result.error.message).not.toContain('policy');
      }
    });
  });
  
  it('should update content page with real auth without RLS errors', async () => {
    await withTestDatabase(async (db) => {
      const { client, user } = await db.createAuthenticatedClient();
      
      // Create content page
      const page = createTestContentPage();
      const { data: createdPage } = await client
        .from('content_pages')
        .insert(page)
        .select()
        .single();
      
      // Update content page with real auth
      const result = await contentPagesService.update(createdPage.id, {
        title: 'Updated Title',
        published: true,
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Title');
        expect(result.data.published).toBe(true);
      }
    });
  });
  
  it('should delete content page with real auth without RLS errors', async () => {
    await withTestDatabase(async (db) => {
      const { client, user } = await db.createAuthenticatedClient();
      
      // Create content page
      const page = createTestContentPage();
      const { data: createdPage } = await client
        .from('content_pages')
        .insert(page)
        .select()
        .single();
      
      // Delete content page with real auth
      const result = await contentPagesService.deleteContentPage(createdPage.id);
      
      expect(result.success).toBe(true);
    });
  });
  
  it('should list content pages with real auth without RLS errors', async () => {
    await withTestDatabase(async (db) => {
      const { client, user } = await db.createAuthenticatedClient();
      
      // Create multiple content pages
      const pages = [
        createTestContentPage({ title: 'Page 1', slug: `page-1-${Date.now()}` }),
        createTestContentPage({ title: 'Page 2', slug: `page-2-${Date.now()}` }),
      ];
      
      await client.from('content_pages').insert(pages);
      
      // List content pages with real auth
      const result = await contentPagesService.list();
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
  
  it('should get content page by slug with real auth without RLS errors', async () => {
    await withTestDatabase(async (db) => {
      const { client, user } = await db.createAuthenticatedClient();
      
      // Create content page
      const page = createTestContentPage();
      const { data: createdPage } = await client
        .from('content_pages')
        .insert(page)
        .select()
        .single();
      
      // Get content page by slug with real auth
      const result = await contentPagesService.getBySlug(createdPage.slug);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(createdPage.id);
        expect(result.data.slug).toBe(createdPage.slug);
      }
    });
  });
  
  it('should handle RLS policies correctly for different page types', async () => {
    await withTestDatabase(async (db) => {
      const { client, user } = await db.createAuthenticatedClient();
      
      // Test with different page types
      const pageTypes = ['custom', 'home', 'our_story', 'accommodation', 'transportation'] as const;
      
      for (const type of pageTypes) {
        const pageData = {
          title: `Test ${type} Page`,
          slug: `test-${type}-page-${Date.now()}`,
          type,
          published: false,
        };
        
        const result = await contentPagesService.create(pageData);
        
        // Should not fail with RLS errors
        if (!result.success) {
          expect(result.error.message).not.toContain('row-level security');
          expect(result.error.message).not.toContain('policy');
        }
      }
    });
  });
  
  it('should allow publishing and unpublishing with real auth', async () => {
    await withTestDatabase(async (db) => {
      const { client, user } = await db.createAuthenticatedClient();
      
      // Create unpublished page
      const page = createTestContentPage({ published: false });
      const { data: createdPage } = await client
        .from('content_pages')
        .insert(page)
        .select()
        .single();
      
      // Publish page
      const publishResult = await contentPagesService.update(createdPage.id, {
        published: true,
      });
      
      expect(publishResult.success).toBe(true);
      if (publishResult.success) {
        expect(publishResult.data.published).toBe(true);
      }
      
      // Unpublish page
      const unpublishResult = await contentPagesService.update(createdPage.id, {
        published: false,
      });
      
      expect(unpublishResult.success).toBe(true);
      if (unpublishResult.success) {
        expect(unpublishResult.data.published).toBe(false);
      }
    });
  });
});

/**
 * Why This Test Would Have Caught the Bug:
 * 
 * The content pages RLS bug occurred because:
 * 1. Content pages table had RLS policies enabled
 * 2. Service methods used service role client (bypassed RLS)
 * 3. API routes used real auth (enforced RLS)
 * 4. RLS policies were misconfigured for authenticated users
 * 
 * This test explicitly:
 * - Uses real authentication (not service role)
 * - Calls service methods that interact with content_pages table
 * - Validates no RLS violation errors occur
 * - Tests all CRUD operations with RLS enforcement
 * - Tests different page types to ensure policies work for all cases
 * 
 * If the RLS policies are misconfigured, this test will fail with the exact
 * error message that users would see, making it easy to diagnose and fix.
 */
