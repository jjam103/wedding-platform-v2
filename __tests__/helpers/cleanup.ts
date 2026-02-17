/**
 * Test Cleanup Utilities
 * 
 * Utilities for cleaning up test data after tests run.
 * Ensures test isolation and prevents data leakage between tests.
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase client for test cleanup
 * Uses service role key to bypass RLS for cleanup operations
 */
function getCleanupClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials for test cleanup');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Clean up test guests by email pattern
 * Matches ALL @example.com emails (test domain for E2E tests)
 * This catches test.user%, john.doe%, john%, and any other test patterns
 */
export async function cleanupTestGuests(emailPattern = '%@example.com'): Promise<void> {
  const supabase = getCleanupClient();
  
  // Count before cleanup for logging
  const { count: beforeCount } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .like('email', emailPattern);
  
  // Delete all guests with @example.com domain
  const { error } = await supabase
    .from('guests')
    .delete()
    .like('email', emailPattern);
  
  if (error) {
    console.error('Failed to cleanup test guests:', error);
    return;
  }
  
  // Count after cleanup for verification
  const { count: afterCount } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .like('email', emailPattern);
  
  const cleaned = (beforeCount || 0) - (afterCount || 0);
  if (cleaned > 0) {
    console.log(`   Cleaned up ${cleaned} test guests`);
  }
}

/**
 * Clean up test guest groups by name pattern
 * Matches any group with "Test" or "Cleanup" in the name
 * Note: Table is named 'groups' not 'guest_groups'
 */
export async function cleanupTestGuestGroups(namePattern = '%Test%'): Promise<void> {
  const supabase = getCleanupClient();
  
  // Count before cleanup
  const { count: beforeCount } = await supabase
    .from('groups')
    .select('*', { count: 'exact', head: true })
    .or('name.like.%Test%,name.like.%Cleanup%');
  
  // Clean up any group with "Test" or "Cleanup" in the name
  const { error } = await supabase
    .from('groups')
    .delete()
    .or('name.like.%Test%,name.like.%Cleanup%');
  
  if (error) {
    console.error('Failed to cleanup test guest groups:', error);
    return;
  }
  
  // Count after cleanup
  const { count: afterCount } = await supabase
    .from('groups')
    .select('*', { count: 'exact', head: true })
    .or('name.like.%Test%,name.like.%Cleanup%');
  
  const cleaned = (beforeCount || 0) - (afterCount || 0);
  if (cleaned > 0) {
    console.log(`   Cleaned up ${cleaned} test guest groups`);
  }
}

/**
 * Clean up test events by name pattern
 */
export async function cleanupTestEvents(namePattern = 'Test Event%'): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('events')
    .delete()
    .like('name', namePattern);
  
  if (error) {
    console.error('Failed to cleanup test events:', error);
  }
}

/**
 * Clean up test activities by name pattern
 */
export async function cleanupTestActivities(namePattern = 'Test Activity%'): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('activities')
    .delete()
    .like('name', namePattern);
  
  if (error) {
    console.error('Failed to cleanup test activities:', error);
  }
}

/**
 * Clean up test accommodations by name pattern
 */
export async function cleanupTestAccommodations(namePattern = 'Test Hotel%'): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('accommodations')
    .delete()
    .like('name', namePattern);
  
  if (error) {
    console.error('Failed to cleanup test accommodations:', error);
  }
}

/**
 * Clean up test room types by name pattern
 */
export async function cleanupTestRoomTypes(namePattern = 'Test Room%'): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('room_types')
    .delete()
    .like('name', namePattern);
  
  if (error) {
    console.error('Failed to cleanup test room types:', error);
  }
}

/**
 * Clean up test locations by name pattern
 */
export async function cleanupTestLocations(namePattern = 'Test Location%'): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('locations')
    .delete()
    .like('name', namePattern);
  
  if (error) {
    console.error('Failed to cleanup test locations:', error);
  }
}

/**
 * Clean up test sections by page type and page ID pattern
 * Note: sections table uses page_type and page_id, not page_slug
 */
export async function cleanupTestSections(pageIdPattern = 'test-page%'): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('sections')
    .delete()
    .like('page_id', pageIdPattern);
  
  if (error) {
    console.error('Failed to cleanup test sections:', error);
  }
}

/**
 * Clean up test content pages by slug pattern
 */
export async function cleanupTestContentPages(slugPattern = 'test-page%'): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('content_pages')
    .delete()
    .like('slug', slugPattern);
  
  if (error) {
    console.error('Failed to cleanup test content pages:', error);
  }
}

/**
 * Clean up test RSVPs by guest ID
 * Note: guest_id is UUID, use IN operator instead of LIKE
 */
export async function cleanupTestRSVPs(guestIds?: string[]): Promise<void> {
  const supabase = getCleanupClient();
  
  // If no specific guest IDs provided, clean up RSVPs for test guests
  if (!guestIds || guestIds.length === 0) {
    // Get test guests first (matches both test.user% and test-guest-% patterns)
    const { data: testGuests } = await supabase
      .from('guests')
      .select('id')
      .like('email', 'test%@example.com');
    
    if (testGuests && testGuests.length > 0) {
      guestIds = testGuests.map(g => g.id);
    } else {
      return; // No test guests, nothing to clean
    }
  }
  
  const { error } = await supabase
    .from('rsvps')
    .delete()
    .in('guest_id', guestIds);
  
  if (error) {
    console.error('Failed to cleanup test RSVPs:', error);
  }
}

/**
 * Clean up a specific entity by ID
 */
export async function cleanupById(table: string, id: string): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Failed to cleanup ${table} with id ${id}:`, error);
  }
}

/**
 * Clean up multiple entities by IDs
 */
export async function cleanupByIds(table: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from(table)
    .delete()
    .in('id', ids);
  
  if (error) {
    console.error(`Failed to cleanup ${table} with ids:`, error);
  }
}

/**
 * Clean up all test data (use with caution!)
 * This runs all cleanup functions in the correct order to handle foreign key constraints
 */
export async function cleanupAllTestData(): Promise<void> {
  console.log('🧹 Cleaning up all test data...');
  
  // Clean up in order to respect foreign key constraints
  await cleanupTestRSVPs();
  await cleanupTestGuests();
  await cleanupTestGuestGroups();
  await cleanupTestActivities();
  await cleanupTestEvents();
  await cleanupTestRoomTypes();
  await cleanupTestAccommodations();
  await cleanupTestLocations();
  await cleanupTestSections();
  await cleanupTestContentPages();
  
  console.log('✅ Test data cleanup complete');
}

/**
 * Create a cleanup tracker for tracking created entities during a test
 */
export class CleanupTracker {
  private entities: Map<string, string[]> = new Map();
  
  /**
   * Track an entity for cleanup
   */
  track(table: string, id: string): void {
    const ids = this.entities.get(table) || [];
    ids.push(id);
    this.entities.set(table, ids);
  }
  
  /**
   * Track multiple entities for cleanup
   */
  trackMany(table: string, ids: string[]): void {
    const existing = this.entities.get(table) || [];
    this.entities.set(table, [...existing, ...ids]);
  }
  
  /**
   * Clean up all tracked entities
   */
  async cleanup(): Promise<void> {
    // Clean up in reverse order of tracking (LIFO)
    const tables = Array.from(this.entities.keys()).reverse();
    
    for (const table of tables) {
      const ids = this.entities.get(table) || [];
      if (ids.length > 0) {
        await cleanupByIds(table, ids);
      }
    }
    
    this.entities.clear();
  }
  
  /**
   * Get all tracked entities
   */
  getTracked(): Map<string, string[]> {
    return new Map(this.entities);
  }
  
  /**
   * Clear tracking without cleanup
   */
  clear(): void {
    this.entities.clear();
  }
}

/**
 * Create a cleanup tracker instance
 */
export function createCleanupTracker(): CleanupTracker {
  return new CleanupTracker();
}

/**
 * Helper to run a test with automatic cleanup
 */
export async function withCleanup<T>(
  fn: (tracker: CleanupTracker) => Promise<T>
): Promise<T> {
  const tracker = createCleanupTracker();
  
  try {
    return await fn(tracker);
  } finally {
    await tracker.cleanup();
  }
}


/**
 * Clean up guest sessions for specific guests only
 * More targeted than cleanupGuestSessions which deletes ALL sessions
 */
export async function cleanupGuestSessionsForGuests(guestIds: string[]): Promise<void> {
  if (guestIds.length === 0) return;
  
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('guest_sessions')
    .delete()
    .in('guest_id', guestIds);
  
  if (error) {
    console.error('Failed to cleanup guest sessions for specific guests:', error);
  }
}

/**
 * Clean up all guest sessions
 */
export async function cleanupGuestSessions(): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('guest_sessions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (error) {
    console.error('Failed to cleanup guest sessions:', error);
  }
}

/**
 * Clean up all magic link tokens
 */
export async function cleanupMagicLinkTokens(): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('magic_link_tokens')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (error) {
    console.error('Failed to cleanup magic link tokens:', error);
  }
}

/**
 * Clean up all audit logs
 */
export async function cleanupAuditLogs(): Promise<void> {
  const supabase = getCleanupClient();
  
  const { error } = await supabase
    .from('audit_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (error) {
    console.error('Failed to cleanup audit logs:', error);
  }
}

/**
 * Comprehensive cleanup for integration tests
 * Cleans all test-related data in the correct order
 * 
 * Enhanced with verification to ensure cleanup completed successfully
 */
export async function cleanup(): Promise<void> {
  console.log('🧹 Running comprehensive test cleanup...');
  
  // Clean up in order to respect foreign key constraints
  // 1. Clean up sessions and tokens first (no dependencies)
  await cleanupGuestSessions();
  await cleanupMagicLinkTokens();
  await cleanupAuditLogs();
  
  // 2. Clean up RSVPs (depends on guests and activities)
  await cleanupTestRSVPs();
  
  // 3. Clean up guests (depends on groups)
  await cleanupTestGuests();
  
  // 4. Clean up groups (no dependencies on guests)
  await cleanupTestGuestGroups();
  
  // 5. Clean up activities (depends on events)
  await cleanupTestActivities();
  
  // 6. Clean up events (no dependencies)
  await cleanupTestEvents();
  
  // 7. Clean up room types (depends on accommodations)
  await cleanupTestRoomTypes();
  
  // 8. Clean up accommodations (depends on locations)
  await cleanupTestAccommodations();
  
  // 9. Clean up locations (no dependencies)
  await cleanupTestLocations();
  
  // 10. Clean up sections (depends on content pages)
  await cleanupTestSections();
  
  // 11. Clean up content pages (no dependencies)
  await cleanupTestContentPages();
  
  // Verify cleanup completed
  await verifyCleanupComplete();
  
  console.log('✅ Comprehensive cleanup complete');
}

/**
 * Verify that cleanup completed successfully
 * Checks for remaining test data and warns if found
 */
async function verifyCleanupComplete(): Promise<void> {
  const supabase = getCleanupClient();
  
  // Check for remaining test guests
  const { count: guestCount } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .like('email', '%@example.com');
  
  if (guestCount && guestCount > 0) {
    console.warn(`⚠️  Cleanup incomplete: ${guestCount} test guests remain`);
  }
  
  // Check for remaining test groups
  const { count: groupCount } = await supabase
    .from('groups')
    .select('*', { count: 'exact', head: true })
    .or('name.like.%Test%,name.like.%Cleanup%');
  
  if (groupCount && groupCount > 0) {
    console.warn(`⚠️  Cleanup incomplete: ${groupCount} test groups remain`);
  }
}

/**
 * Clean up test data from specific tables
 * Used by integration tests that need targeted cleanup
 */
export async function cleanupTestData(
  supabaseClient: any,
  options: { tables: string[] }
): Promise<void> {
  console.log('🧹 Cleaning up test data from tables:', options.tables);
  
  for (const table of options.tables) {
    const { error } = await supabaseClient
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
      console.error(`Failed to cleanup ${table}:`, error);
    }
  }
  
  console.log('✅ Test data cleanup complete');
}
