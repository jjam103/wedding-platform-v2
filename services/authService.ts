import { createClient } from '@supabase/supabase-js';
import type { Result } from '@/types';
import { success, error, unauthorizedError, unknownError } from '@/utils/errors';
import { ERROR_CODES } from '@/types';

/**
 * Authentication service for managing user authentication with Supabase Auth.
 * Supports email/password and magic link authentication methods.
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MagicLinkRequest {
  email: string;
  redirectTo?: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    role: 'super_admin' | 'host' | 'guest';
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'host' | 'guest';
  created_at: string;
  last_login: string;
}

/**
 * Creates a Supabase client for authentication operations.
 * 
 * @returns Configured Supabase client
 * @throws Error if required environment variables are missing
 */
function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Logs in a user with email and password.
 * 
 * @param credentials - User email and password
 * @returns Result containing auth session or error details
 * 
 * @example
 * const result = await authService.loginWithPassword({
 *   email: 'user@example.com',
 *   password: 'securePassword123'
 * });
 * 
 * if (result.success) {
 *   console.log('Logged in:', result.data.user.email);
 * }
 */
export async function loginWithPassword(
  credentials: LoginCredentials
): Promise<Result<AuthSession>> {
  try {
    const supabase = createAuthClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) {
      return error(
        ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid email or password',
        authError
      );
    }

    if (!data.session || !data.user) {
      return unauthorizedError('Failed to create session');
    }

    // Fetch user role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      // Default to guest role if user record doesn't exist yet
      const role = 'guest';
      
      return success({
        user: {
          id: data.user.id,
          email: data.user.email!,
          role,
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at || 0,
      });
    }

    return success({
      user: {
        id: data.user.id,
        email: data.user.email!,
        role: userData.role,
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at || 0,
    });
  } catch (err) {
    return unknownError(err);
  }
}

/**
 * Sends a magic link to the user's email for passwordless authentication.
 * 
 * @param request - Email and optional redirect URL
 * @returns Result indicating success or error
 * 
 * @example
 * const result = await authService.sendMagicLink({
 *   email: 'user@example.com',
 *   redirectTo: 'https://example.com/dashboard'
 * });
 */
export async function sendMagicLink(
  request: MagicLinkRequest
): Promise<Result<{ message: string }>> {
  try {
    const supabase = createAuthClient();

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: request.email,
      options: {
        emailRedirectTo: request.redirectTo,
      },
    });

    if (authError) {
      return error(
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        'Failed to send magic link',
        authError
      );
    }

    return success({
      message: 'Magic link sent successfully. Please check your email.',
    });
  } catch (err) {
    return unknownError(err);
  }
}

/**
 * Verifies and retrieves the current session.
 * 
 * @returns Result containing auth session or error if no valid session
 * 
 * @example
 * const result = await authService.getSession();
 * if (result.success) {
 *   console.log('Current user:', result.data.user.email);
 * }
 */
export async function getSession(): Promise<Result<AuthSession>> {
  try {
    const supabase = createAuthClient();

    const { data, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return error(
        ERROR_CODES.SESSION_EXPIRED,
        'Session expired or invalid',
        sessionError
      );
    }

    if (!data.session || !data.session.user) {
      return unauthorizedError('No active session');
    }

    // Fetch user role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.session.user.id)
      .single();

    const role = userData?.role || 'guest';

    return success({
      user: {
        id: data.session.user.id,
        email: data.session.user.email!,
        role,
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at || 0,
    });
  } catch (err) {
    return unknownError(err);
  }
}

/**
 * Refreshes an expired session using a refresh token.
 * 
 * @param refreshToken - The refresh token from the previous session
 * @returns Result containing new auth session or error
 * 
 * @example
 * const result = await authService.refreshSession(oldRefreshToken);
 */
export async function refreshSession(
  refreshToken: string
): Promise<Result<AuthSession>> {
  try {
    const supabase = createAuthClient();

    const { data, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (refreshError) {
      return error(
        ERROR_CODES.SESSION_EXPIRED,
        'Failed to refresh session',
        refreshError
      );
    }

    if (!data.session || !data.user) {
      return unauthorizedError('Failed to refresh session');
    }

    // Fetch user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const role = userData?.role || 'guest';

    return success({
      user: {
        id: data.user.id,
        email: data.user.email!,
        role,
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at || 0,
    });
  } catch (err) {
    return unknownError(err);
  }
}

/**
 * Logs out the current user and invalidates the session.
 * 
 * @returns Result indicating success or error
 * 
 * @example
 * const result = await authService.logout();
 * if (result.success) {
 *   console.log('Logged out successfully');
 * }
 */
export async function logout(): Promise<Result<{ message: string }>> {
  try {
    const supabase = createAuthClient();

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      return error(
        ERROR_CODES.UNKNOWN_ERROR,
        'Failed to logout',
        signOutError
      );
    }

    return success({ message: 'Logged out successfully' });
  } catch (err) {
    return unknownError(err);
  }
}

/**
 * Checks if a session is expired based on the expiration timestamp.
 * 
 * @param expiresAt - Unix timestamp of session expiration
 * @returns True if session is expired, false otherwise
 */
export function isSessionExpired(expiresAt: number): boolean {
  return Date.now() / 1000 >= expiresAt;
}

/**
 * Gets the current user from an active session.
 * 
 * @returns Result containing user data or error if not authenticated
 */
export async function getCurrentUser(): Promise<Result<User>> {
  try {
    const sessionResult = await getSession();
    
    if (!sessionResult.success) {
      return sessionResult;
    }

    const supabase = createAuthClient();
    const { data, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionResult.data.user.id)
      .single();

    if (userError || !data) {
      return error(
        ERROR_CODES.NOT_FOUND,
        'User not found',
        userError
      );
    }

    return success(data);
  } catch (err) {
    return unknownError(err);
  }
}
