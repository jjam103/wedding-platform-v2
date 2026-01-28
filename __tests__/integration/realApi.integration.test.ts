/**
 * Real API Integration Tests
 * 
 * These tests hit actual API endpoints with a running Next.js server
 * to catch runtime issues that mocked tests miss.
 * 
 * IMPORTANT: These tests require:
 * 1. A running Next.js dev server (npm run dev)
 * 2. Valid Supabase credentials in .env.local
 * 3. Test database with proper RLS policies
 */

import { spawn, ChildProcess } from 'child_process';

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const SERVER_STARTUP_TIMEOUT = 30000; // 30 seconds
const TEST_TIMEOUT = 10000; // 10 seconds per test

/**
 * Wait for server to be ready
 */
async function waitForServer(url: string, timeout: number = SERVER_STARTUP_TIMEOUT): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) {
        console.log('✅ Server is ready');
        return;
      }
    } catch (error) {
      // Server not ready yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error(`Server did not start within ${timeout}ms`);
}

/**
 * Check if server is already running
 */
async function isServerRunning(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

describe('Real API Integration Tests', () => {
  let serverProcess: ChildProcess | null = null;
  let serverWasRunning = false;

  beforeAll(async () => {
    // Check if server is already running
    serverWasRunning = await isServerRunning(API_BASE_URL);
    
    if (serverWasRunning) {
      console.log('ℹ️  Using existing server at', API_BASE_URL);
      return;
    }
    
    console.log('🚀 Starting Next.js dev server...');
    
    // Start Next.js dev server
    serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      detached: false,
    });
    
    // Log server output for debugging
    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('started')) {
        console.log('📡', output.trim());
      }
    });
    
    serverProcess.stderr?.on('data', (data) => {
      console.error('❌ Server error:', data.toString());
    });
    
    // Wait for server to be ready
    await waitForServer(API_BASE_URL);
  }, SERVER_STARTUP_TIMEOUT + 5000);

  afterAll(() => {
    if (serverProcess && !serverWasRunning) {
      console.log('🛑 Stopping Next.js dev server...');
      serverProcess.kill('SIGTERM');
      
      // Force kill if not stopped after 5 seconds
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          serverProcess.kill('SIGKILL');
        }
      }, 5000);
    }
  });

  describe('API Health Checks', () => {
    test('should respond to health check', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      
      // Even if endpoint doesn't exist, server should respond
      expect([200, 404, 405]).toContain(response.status);
    }, TEST_TIMEOUT);
  });

  describe('Authentication Endpoints', () => {
    test('logout endpoint should exist and respond', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Should respond (even if unauthorized)
      expect(response.status).toBeLessThan(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
    }, TEST_TIMEOUT);
  });

  describe('Admin API Endpoints', () => {
    test('locations endpoint should respond', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/locations`);
      
      // Should respond with 401 (unauthorized) or 200 (if somehow authenticated)
      expect([200, 401]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
      
      if (!data.success) {
        expect(data).toHaveProperty('error');
        expect(data.error).toHaveProperty('code');
      }
    }, TEST_TIMEOUT);

    test('content-pages endpoint should respond', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/content-pages`);
      
      // Should respond with 401 (unauthorized) or 200
      expect([200, 401]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
    }, TEST_TIMEOUT);

    test('guests endpoint should respond', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/guests`);
      
      // Should respond with 401 (unauthorized) or 200
      expect([200, 401]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
    }, TEST_TIMEOUT);

    test('activities endpoint should respond', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/activities`);
      
      // Should respond with 401 (unauthorized) or 200
      expect([200, 401]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
    }, TEST_TIMEOUT);
  });

  describe('API Response Format', () => {
    test('all API responses should have consistent format', async () => {
      const endpoints = [
        '/api/admin/locations',
        '/api/admin/content-pages',
        '/api/admin/guests',
      ];
      
      for (const endpoint of endpoints) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const data = await response.json();
        
        // All responses should have success field
        expect(data).toHaveProperty('success');
        expect(typeof data.success).toBe('boolean');
        
        // If success is false, should have error object
        if (!data.success) {
          expect(data).toHaveProperty('error');
          expect(data.error).toHaveProperty('code');
          expect(data.error).toHaveProperty('message');
        }
        
        // If success is true, should have data
        if (data.success) {
          expect(data).toHaveProperty('data');
        }
      }
    }, TEST_TIMEOUT * 3);
  });

  describe('Error Handling', () => {
    test('invalid endpoints should return 404', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/nonexistent-endpoint`);
      expect(response.status).toBe(404);
    }, TEST_TIMEOUT);

    test('invalid methods should return 405', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/locations`, {
        method: 'DELETE', // Assuming DELETE is not supported on collection
      });
      
      // Should be 405 (Method Not Allowed) or 401 (Unauthorized)
      expect([401, 405]).toContain(response.status);
    }, TEST_TIMEOUT);
  });

  describe('CORS and Headers', () => {
    test('API should set proper content-type headers', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/locations`);
      
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    }, TEST_TIMEOUT);
  });
});

/**
 * Usage Instructions:
 * 
 * 1. Run with existing server:
 *    npm run dev (in one terminal)
 *    npm run test:integration -- realApi (in another terminal)
 * 
 * 2. Run with auto-start server:
 *    npm run test:integration -- realApi
 *    (will start and stop server automatically)
 * 
 * 3. Run in CI/CD:
 *    Set TEST_API_URL environment variable to deployed URL
 *    npm run test:integration -- realApi
 */
