/**
 * Test Server Utilities
 * 
 * Utilities for starting and managing a real Next.js dev server for integration tests.
 * This allows testing against actual API routes instead of mocked implementations.
 */

import { spawn, ChildProcess } from 'child_process';

let serverProcess: ChildProcess | null = null;
const SERVER_PORT = 3001; // Use different port than dev server
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

/**
 * Wait for server to be ready by polling the health endpoint
 */
async function waitForServer(maxAttempts = 30, delayMs = 1000): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${SERVER_URL}/api/health`);
      if (response.ok) {
        console.log('✅ Test server is ready');
        return;
      }
    } catch (error) {
      // Server not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error(`Server did not start after ${maxAttempts} attempts`);
}

/**
 * Start Next.js dev server for testing
 */
export async function startTestServer(): Promise<string> {
  if (serverProcess) {
    console.log('⚠️  Test server already running');
    return SERVER_URL;
  }
  
  console.log('🚀 Starting test server...');
  
  serverProcess = spawn('npm', ['run', 'dev', '--', '-p', SERVER_PORT.toString()], {
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: SERVER_PORT.toString(),
    },
  });
  
  // Log server output for debugging
  serverProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Ready') || output.includes('started')) {
      console.log('📡 Server output:', output.trim());
    }
  });
  
  serverProcess.stderr?.on('data', (data) => {
    console.error('❌ Server error:', data.toString());
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
  });
  
  // Wait for server to be ready
  await waitForServer();
  
  return SERVER_URL;
}

/**
 * Stop the test server
 */
export async function stopTestServer(): Promise<void> {
  if (!serverProcess) {
    return;
  }
  
  console.log('🛑 Stopping test server...');
  
  return new Promise((resolve) => {
    if (!serverProcess) {
      resolve();
      return;
    }
    
    serverProcess.on('exit', () => {
      serverProcess = null;
      console.log('✅ Test server stopped');
      resolve();
    });
    
    // Try graceful shutdown first
    serverProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (serverProcess) {
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  });
}

/**
 * Make authenticated request to test server
 */
export async function authenticatedRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  // TODO: Implement authentication
  // For now, just make the request
  const url = `${SERVER_URL}${path}`;
  return fetch(url, options);
}

/**
 * Get test server URL
 */
export function getTestServerUrl(): string {
  return SERVER_URL;
}

/**
 * Check if test server is running
 */
export function isTestServerRunning(): boolean {
  return serverProcess !== null;
}
