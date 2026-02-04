/**
 * Test Database Configuration
 * 
 * Provides Supabase client instances configured for testing.
 * Supports both authenticated (RLS-enforced) and service role (RLS-bypassed) clients.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Get Supabase URL from environment
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  return url;
}

/**
 * Get Supabase anon key from environment
 */
function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  }
  return key;
}

/**
 * Get Supabase service role key from environment
 */
function getSupabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return key;
}

/**
 * Create an authenticated Supabase client for testing
 * This client respects RLS policies and should be used for most tests
 * 
 * @param accessToken - Optional access token for authenticated requests
 * @returns Supabase client with RLS enforcement
 */
export function createTestClient(accessToken?: string): SupabaseClient {
  const client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  // If access token provided, set it for authenticated requests
  if (accessToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
    });
  }
  
  return client;
}

/**
 * Create a service role Supabase client for testing
 * This client bypasses RLS policies and should ONLY be used for:
 * - Test setup (creating test data)
 * - Test cleanup (deleting test data)
 * - Testing service-level logic that doesn't involve RLS
 * 
 * WARNING: Never use this for testing RLS policies!
 * 
 * @returns Supabase client with RLS bypass
 */
export function createServiceClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Test user credentials for authentication tests
 */
export interface TestUser {
  email: string;
  password: string;
  id?: string;
  accessToken?: string;
  role?: 'super_admin' | 'host' | 'guest';
}

/**
 * Create a test user in the database
 * Uses service role to bypass RLS for user creation
 * 
 * @param email - User email
 * @param password - User password
 * @param role - User role (super_admin, host, or guest)
 * @returns Test user with credentials
 */
export async function createTestUser(
  email: string = `test.${Date.now()}@example.com`,
  password: string = 'test123456',
  role: 'super_admin' | 'host' | 'guest' = 'guest'
): Promise<TestUser> {
  const serviceClient = createServiceClient();
  
  // Create user with admin API
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email for testing
  });
  
  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }
  
  if (!data.user) {
    throw new Error('User creation succeeded but no user returned');
  }
  
  // Insert user record with role in users table
  const { error: userError } = await serviceClient
    .from('users')
    .insert({
      id: data.user.id,
      email,
      role,
    });
  
  if (userError) {
    // Clean up auth user if users table insert fails
    await serviceClient.auth.admin.deleteUser(data.user.id);
    throw new Error(`Failed to create user record: ${userError.message}`);
  }
  
  return {
    email,
    password,
    id: data.user.id,
    role,
  };
}

/**
 * Sign in a test user and get access token
 * 
 * @param email - User email
 * @param password - User password
 * @returns Test user with access token
 */
export async function signInTestUser(
  email: string,
  password: string
): Promise<TestUser> {
  const client = createTestClient();
  
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(`Failed to sign in test user: ${error.message}`);
  }
  
  if (!data.session) {
    throw new Error('Sign in succeeded but no session returned');
  }
  
  // Get user role from users table
  const serviceClient = createServiceClient();
  const { data: userData } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();
  
  return {
    email,
    password,
    id: data.user.id,
    accessToken: data.session.access_token,
    role: userData?.role || 'guest',
  };
}

/**
 * Delete a test user from the database
 * Uses service role to bypass RLS for user deletion
 * 
 * @param userId - User ID to delete
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const serviceClient = createServiceClient();
  
  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  
  if (error) {
    console.error(`Failed to delete test user ${userId}:`, error);
  }
}

/**
 * Create and sign in a test user in one step
 * Useful for tests that need an authenticated user
 * 
 * @param options - Optional user configuration
 * @returns Test user with access token
 */
export async function createAndSignInTestUser(options?: {
  email?: string;
  password?: string;
  role?: 'super_admin' | 'host' | 'guest';
}): Promise<TestUser> {
  const email = options?.email || `test.${Date.now()}@example.com`;
  const password = options?.password || 'test123456';
  const role = options?.role || 'guest';
  
  await createTestUser(email, password, role);
  return signInTestUser(email, password);
}

/**
 * Test database helper class for managing test data lifecycle
 */
export class TestDatabase {
  private serviceClient: SupabaseClient;
  private testClient: SupabaseClient;
  private createdUsers: string[] = [];
  
  constructor() {
    this.serviceClient = createServiceClient();
    this.testClient = createTestClient();
  }
  
  /**
   * Get service client (bypasses RLS)
   */
  getServiceClient(): SupabaseClient {
    return this.serviceClient;
  }
  
  /**
   * Get test client (respects RLS)
   */
  getTestClient(): SupabaseClient {
    return this.testClient;
  }
  
  /**
   * Create an authenticated test client
   */
  async createAuthenticatedClient(): Promise<{ client: SupabaseClient; user: TestUser }> {
    const user = await createAndSignInTestUser();
    this.createdUsers.push(user.id!);
    
    const client = createTestClient(user.accessToken);
    
    return { client, user };
  }
  
  /**
   * Clean up all test data and users
   */
  async cleanup(): Promise<void> {
    // Delete created users
    for (const userId of this.createdUsers) {
      await deleteTestUser(userId);
    }
    
    this.createdUsers = [];
  }
}

/**
 * Create a test database instance
 */
export function createTestDatabase(): TestDatabase {
  return new TestDatabase();
}

/**
 * Helper to run a test with automatic database cleanup
 */
export async function withTestDatabase<T>(
  fn: (db: TestDatabase) => Promise<T>
): Promise<T> {
  const db = createTestDatabase();
  
  try {
    return await fn(db);
  } finally {
    await db.cleanup();
  }
}

/**
 * Wait for database operation to complete
 * Useful for tests that need to wait for async operations
 */
export async function waitForDb(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a database operation with exponential backoff
 * Useful for handling transient database errors
 */
export async function retryDbOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await waitForDb(delay);
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}


/**
 * Test database helper object with convenience methods
 */
export const testDb = {
  /**
   * Create a guest in the test database
   */
  async createGuest(data: {
    email: string;
    auth_method: 'email_matching' | 'magic_link';
    first_name: string;
    last_name: string;
    group_id?: string;
  }) {
    const serviceClient = createServiceClient();
    
    // Create group if not provided
    let groupId = data.group_id;
    if (!groupId) {
      const { data: group, error: groupError } = await serviceClient
        .from('groups')
        .insert({ name: `Test Group ${Date.now()}` })
        .select()
        .single();
      
      if (groupError) throw new Error(`Failed to create group: ${groupError.message}`);
      groupId = group.id;
    }
    
    const { data: guest, error } = await serviceClient
      .from('guests')
      .insert({
        email: data.email,
        auth_method: data.auth_method,
        first_name: data.first_name,
        last_name: data.last_name,
        group_id: groupId,
        age_type: 'adult',
        guest_type: 'wedding_guest',
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create guest: ${error.message}`);
    return guest;
  },

  /**
   * Get guest sessions for a specific guest
   */
  async getGuestSessions(guestId: string) {
    const serviceClient = createServiceClient();
    
    const { data, error } = await serviceClient
      .from('guest_sessions')
      .select('*')
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to get guest sessions: ${error.message}`);
    return data || [];
  },

  /**
   * Get all guest sessions
   */
  async getAllGuestSessions() {
    const serviceClient = createServiceClient();
    
    const { data, error } = await serviceClient
      .from('guest_sessions')
      .select('*');
    
    if (error) throw new Error(`Failed to get all guest sessions: ${error.message}`);
    return data || [];
  },

  /**
   * Get audit logs matching criteria
   */
  async getAuditLogs(criteria: {
    action?: string;
    entity_type?: string;
    entity_id?: string;
  }) {
    const serviceClient = createServiceClient();
    
    let query = serviceClient.from('audit_logs').select('*');
    
    if (criteria.action) {
      query = query.eq('action', criteria.action);
    }
    if (criteria.entity_type) {
      query = query.eq('entity_type', criteria.entity_type);
    }
    if (criteria.entity_id) {
      query = query.eq('entity_id', criteria.entity_id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to get audit logs: ${error.message}`);
    return data || [];
  },

  /**
   * Get all guests
   */
  async getAllGuests() {
    const serviceClient = createServiceClient();
    
    const { data, error } = await serviceClient
      .from('guests')
      .select('*');
    
    if (error) throw new Error(`Failed to get all guests: ${error.message}`);
    return data || [];
  },

  /**
   * Create a magic link token in the test database
   */
  async createMagicLinkToken(data: {
    guest_id: string;
    expires_at: string;
    used?: boolean;
    used_at?: string;
  }) {
    const serviceClient = createServiceClient();
    
    // Generate secure token (32 bytes = 64 hex characters)
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const { data: tokenRecord, error } = await serviceClient
      .from('magic_link_tokens')
      .insert({
        guest_id: data.guest_id,
        token,
        expires_at: data.expires_at,
        used: data.used || false,
        used_at: data.used_at || null,
        ip_address: 'test-ip',
        user_agent: 'test-agent',
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create magic link token: ${error.message}`);
    return tokenRecord;
  },

  /**
   * Get magic link tokens for a specific guest
   */
  async getMagicLinkTokens(guestId: string) {
    const serviceClient = createServiceClient();
    
    const { data, error } = await serviceClient
      .from('magic_link_tokens')
      .select('*')
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to get magic link tokens: ${error.message}`);
    return data || [];
  },

  /**
   * Get a specific magic link token by ID
   */
  async getMagicLinkToken(tokenId: string) {
    const serviceClient = createServiceClient();
    
    const { data, error } = await serviceClient
      .from('magic_link_tokens')
      .select('*')
      .eq('id', tokenId)
      .single();
    
    if (error) throw new Error(`Failed to get magic link token: ${error.message}`);
    return data;
  },

  /**
   * Delete a guest and all related data
   */
  async deleteGuest(guestId: string) {
    const serviceClient = createServiceClient();
    
    // Delete related data first
    await serviceClient.from('guest_sessions').delete().eq('guest_id', guestId);
    await serviceClient.from('magic_link_tokens').delete().eq('guest_id', guestId);
    
    // Delete guest
    const { error } = await serviceClient
      .from('guests')
      .delete()
      .eq('id', guestId);
    
    if (error) throw new Error(`Failed to delete guest: ${error.message}`);
  },
};
