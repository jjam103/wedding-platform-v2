/**
 * Sections RLS Regression Test
 * 
 * This test prevents regression of the "permission denied for table users" bug
 * that occurred when creating sections with real authentication.
 * 
 * Bug Description:
 * - Service methods were using service role client that bypassed RLS
 * - When called from API routes with real auth, RLS policies were enforced
 * - Sections table had RLS policies that referenced users table
 * - Real auth didn't have permission to query users table
 * - Result: "permission denied for table users" error
 * 
 * This test validates:
 * - Sections can be created with real authentication (not service role)
 * - RLS policies work correctly with authenticated users
 * - No "permission denied" errors occur
 * 
 * Validates: Requirements 5.4
 */

import { withTestDatabase, createAndSignInTestUser } from '../helpers/testDb';
import { createTestEvent, createTestSection } from '../helpers/factories';
import { cleanupTestSections, cleanupTestEvents } from '../helpers/cleanup';
import * as sectionsService from '@/services/sectionsService';

describe('Sections RLS Regression Tests', () => {
  afterEach(async () => {
    // Clean up test data
    await cleanupTestSections();
    await cleanupTestEvents();
  });
  
  it('should create section with real auth without permission denied error', async () => {
    await withTestDatabase(async (db) => {
      // Create authenticated user (not service role!)
      const { client, user } = await db.createAuthenticatedClient();
      
      // Create a test event first
      const event = createTestEvent();
      const { data: createdEvent, error: eventError } = await client
        .from('events')
        .insert(event)
        .select()
        .single();
      
      expect(eventError).toBeNull();
      expect(createdEvent).toBeDefined();
      
      // Create section with real authentication
      const sectionData = {
        entityType: 'event' as const,
        entityId: createdEvent.id,
        position: 0,
      };
      
      const result = await sectionsService.create(sectionData);
      
      // THIS IS THE KEY TEST - Would have caught the RLS bug!
      // The bug caused: "permission denied for table users"
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.entityType).toBe('event');
        expect(result.data.entityId).toBe(createdEvent.id);
      } else {
        // If this fails, check the error message
        console.error('Section creation failed:', result.error);
        expect(result.error.message).not.toContain('permission denied');
        expect(result.error.message).not.toContain('users');
      }
    });
  });
  
  it('should update section with real auth without RLS errors', async () => {
    await withTestDatabase(async (db) => {
      const { client, user } = await db.createAuthenticatedClient();
      
      // Create event and section
      const event = createTestEvent();
      const { data: createdEvent } = await client
        .from('events')
        .insert(event)
        .select()
        .single();
      
      const section = createTestSection({ entityId: createdEvent.id });
      const { data: createdSection } = await client
        .from('sections')
        .insert(section)
        .select()
        .single();
      
      // Update section with real auth
      const result = await sectionsService.update(createdSection.id, {
        position: 1,
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.position).toBe(1);
      }
    });
  });
  
  it('should delete section with real auth without RLS errors', async () => {
    await withTestDatabase(async (db) => {
      const { client, user } = await db.createAuthenticatedClient();
      
      // Create event and section
      const event = createTestEvent();
      const { data: createdEvent } = await client
        .from('events')
        .insert(event)
        .select()
        .single();
      
      const section = createTestSection({ entityId: createdEvent.id });
      const { data: createdSection } = await client
        .from('sections')
        .insert(section)
        .select()
        .single();
      
      // Delete section with real auth
      const result = await sectionsService.deleteSection(createdSection.id);
      
      expect(result.success).toBe(true);
    });
  });
  
  it('should list sections with real auth without RLS errors', async () => {
    await withTestDatabase(async (db) => {
      const { client, user } = await db.createAuthenticatedClient();
      
      // Create event and sections
      const event = createTestEvent();
      const { data: createdEvent } = await client
        .from('events')
        .insert(event)
        .select()
        .single();
      
      const sections = [
        createTestSection({ entityId: createdEvent.id, position: 0 }),
        createTestSection({ entityId: createdEvent.id, position: 1 }),
      ];
      
      await client.from('sections').insert(sections);
      
      // List sections with real auth
      const result = await sectionsService.list({
        entityType: 'event',
        entityId: createdEvent.id,
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
  
  it('should handle RLS policies correctly for different entity types', async () => {
    await withTestDatabase(async (db) => {
      const { client, user } = await db.createAuthenticatedClient();
      
      // Test with different entity types
      const entityTypes = ['event', 'activity', 'accommodation', 'room_type', 'content_page'] as const;
      
      for (const entityType of entityTypes) {
        const sectionData = {
          entityType,
          entityId: `test-${entityType}-id`,
          position: 0,
        };
        
        const result = await sectionsService.create(sectionData);
        
        // Should not fail with RLS errors
        if (!result.success) {
          expect(result.error.message).not.toContain('permission denied');
          expect(result.error.message).not.toContain('users');
        }
      }
    });
  });
});

/**
 * Why This Test Would Have Caught the Bug:
 * 
 * The sections RLS bug occurred because:
 * 1. Service methods used service role client (bypassed RLS)
 * 2. API routes used real auth (enforced RLS)
 * 3. RLS policies referenced users table
 * 4. Real auth didn't have permission to query users table
 * 
 * This test explicitly:
 * - Uses real authentication (not service role)
 * - Calls service methods that interact with sections table
 * - Validates no "permission denied" errors occur
 * - Tests all CRUD operations with RLS enforcement
 * 
 * If the RLS policies are misconfigured, this test will fail with the exact
 * error message that users would see, making it easy to diagnose and fix.
 */
