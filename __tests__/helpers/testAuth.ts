/**
 * Test Authentication Helpers
 * 
 * Utilities for handling authentication in tests.
 * Provides helpers for creating authenticated requests, managing sessions, and testing auth flows.
 */

import { createTestClient, createAndSignInTestUser, type TestUser } from './testDb';

/**
 * Create an authenticated fetch request for API testing
 * 
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @param accessToken - Access token for authentication
 * @returns Fetch response
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  accessToken: string
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Content-Type', 'application/json');
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Create an authenticated API request for testing
 * 
 * @param path - API path (e.g., '/api/admin/guests')
 * @param options - Request options
 * @param accessToken - Access token for authentication
 * @returns Response object
 */
export async function authenticatedApiRequest(
  path: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {},
  accessToken: string
): Promise<Response> {
  const { method = 'GET', body, headers = {} } = options;
  
  const url = `http://localhost:3000${path}`;
  
  return authenticatedFetch(
    url,
    {
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    },
    accessToken
  );
}

/**
 * Create a mock authenticated request for route handler testing
 * 
 * @param path - Request path
 * @param options - Request options
 * @param accessToken - Access token for authentication
 * @returns Request object
 */
export function createAuthenticatedRequest(
  path: string,
  options: {
    method?: string;
    body?: any;
    searchParams?: Record<string, string>;
  } = {},
  accessToken: string
): Request {
  const { method = 'GET', body, searchParams = {} } = options;
  
  const url = new URL(path, 'http://localhost:3000');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  });
  
  return new Request(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Create an unauthenticated request for testing auth failures
 * 
 * @param path - Request path
 * @param options - Request options
 * @returns Request object
 */
export function createUnauthenticatedRequest(
  path: string,
  options: {
    method?: string;
    body?: any;
    searchParams?: Record<string, string>;
  } = {}
): Request {
  const { method = 'GET', body, searchParams = {} } = options;
  
  const url = new URL(path, 'http://localhost:3000');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  
  return new Request(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Test authentication context for managing auth state in tests
 */
export class TestAuthContext {
  private user: TestUser | null = null;
  
  /**
   * Sign in and store user context
   */
  async signIn(): Promise<TestUser> {
    this.user = await createAndSignInTestUser();
    return this.user;
  }
  
  /**
   * Get current user
   */
  getUser(): TestUser | null {
    return this.user;
  }
  
  /**
   * Get access token
   */
  getAccessToken(): string {
    if (!this.user?.accessToken) {
      throw new Error('No authenticated user. Call signIn() first.');
    }
    return this.user.accessToken;
  }
  
  /**
   * Create authenticated request
   */
  createRequest(
    path: string,
    options: {
      method?: string;
      body?: any;
      searchParams?: Record<string, string>;
    } = {}
  ): Request {
    return createAuthenticatedRequest(path, options, this.getAccessToken());
  }
  
  /**
   * Make authenticated API request
   */
  async apiRequest(
    path: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<Response> {
    return authenticatedApiRequest(path, options, this.getAccessToken());
  }
  
  /**
   * Sign out and clear context
   */
  signOut(): void {
    this.user = null;
  }
  
  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.user !== null && this.user.accessToken !== undefined;
  }
}

/**
 * Create a test auth context
 */
export function createTestAuthContext(): TestAuthContext {
  return new TestAuthContext();
}

/**
 * Helper to run a test with authenticated context
 */
export async function withAuthContext<T>(
  fn: (auth: TestAuthContext) => Promise<T>
): Promise<T> {
  const auth = createTestAuthContext();
  await auth.signIn();
  
  try {
    return await fn(auth);
  } finally {
    auth.signOut();
  }
}

/**
 * Mock session for testing components that use useSession
 */
export function createMockSession(user?: Partial<TestUser>) {
  return {
    user: {
      id: user?.id || 'test-user-id',
      email: user?.email || 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    access_token: user?.accessToken || 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600000, // 1 hour from now
    expires_in: 3600,
    token_type: 'bearer',
  };
}

/**
 * Mock auth state for testing
 */
export function createMockAuthState(authenticated: boolean = true) {
  if (!authenticated) {
    return {
      session: null,
      user: null,
      loading: false,
    };
  }
  
  return {
    session: createMockSession(),
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    loading: false,
  };
}

/**
 * Wait for authentication to complete
 * Useful for tests that need to wait for async auth operations
 */
export async function waitForAuth(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verify a request has valid authentication
 */
export function hasValidAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  return authHeader !== null && authHeader.startsWith('Bearer ');
}

/**
 * Extract access token from request
 */
export function extractAccessToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Create a request with expired token for testing token expiration
 */
export function createExpiredTokenRequest(
  path: string,
  options: {
    method?: string;
    body?: any;
  } = {}
): Request {
  const { method = 'GET', body } = options;
  
  const url = new URL(path, 'http://localhost:3000');
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer expired-token',
  });
  
  return new Request(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Create a request with invalid token for testing token validation
 */
export function createInvalidTokenRequest(
  path: string,
  options: {
    method?: string;
    body?: any;
  } = {}
): Request {
  const { method = 'GET', body } = options;
  
  const url = new URL(path, 'http://localhost:3000');
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer invalid-token-format',
  });
  
  return new Request(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}
