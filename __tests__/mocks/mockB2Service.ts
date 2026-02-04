/**
 * Mock B2 Storage Service for E2E Testing
 * 
 * This mock service simulates Backblaze B2 storage operations without making real API calls.
 * It provides realistic responses for testing photo upload and storage functionality.
 */

import type { Result } from '@/types';

interface UploadResult {
  url: string;
  key: string;
}

interface HealthCheckResult {
  healthy: boolean;
  lastChecked: Date;
  error?: string;
}

interface B2Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  cdnDomain: string;
}

// Track mock uploads for debugging
const mockUploads: Array<{
  fileName: string;
  contentType: string;
  timestamp: number;
  key: string;
  url: string;
}> = [];

let mockHealthStatus: HealthCheckResult = {
  healthy: true,
  lastChecked: new Date(),
};

/**
 * Mock B2 configuration validation
 */
export function validateB2Config(): Result<B2Config> {
  // In test environment, always return success with mock config
  return {
    success: true,
    data: {
      endpoint: 'https://s3.us-west-004.backblazeb2.com',
      region: 'us-west-004',
      accessKeyId: 'test-b2-key-id',
      secretAccessKey: 'test-b2-key',
      bucket: 'test-bucket',
      cdnDomain: 'test-cdn.example.com',
    },
  };
}

/**
 * Mock B2 client initialization
 */
export function initializeB2Client(config: B2Config): Result<void> {
  console.log('🧪 [MOCK B2] Client initialized with config:', {
    endpoint: config.endpoint,
    region: config.region,
    bucket: config.bucket,
    cdnDomain: config.cdnDomain,
  });

  return { success: true, data: undefined };
}

/**
 * Mock file upload to B2
 * Returns a mock CDN URL without making real API calls
 */
export async function uploadToB2(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<Result<UploadResult>> {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate mock key and URL
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `photos/${timestamp}-${sanitizedFileName}`;
    const url = `https://test-cdn.example.com/${key}`;

    // Track upload for debugging
    mockUploads.push({
      fileName,
      contentType,
      timestamp,
      key,
      url,
    });

    console.log('🧪 [MOCK B2] File uploaded:', {
      fileName,
      contentType,
      size: file.length,
      key,
      url,
    });

    return {
      success: true,
      data: { url, key },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Mock upload failed',
        details: error,
      },
    };
  }
}

/**
 * Mock B2 health check
 * Always returns healthy status in test environment
 */
export async function checkB2Health(): Promise<Result<HealthCheckResult>> {
  mockHealthStatus = {
    healthy: true,
    lastChecked: new Date(),
  };

  console.log('🧪 [MOCK B2] Health check performed:', mockHealthStatus);

  return { success: true, data: mockHealthStatus };
}

/**
 * Get current mock health status
 */
export function getB2HealthStatus(): HealthCheckResult {
  return mockHealthStatus;
}

/**
 * Generate mock CDN URL
 */
export function generateCDNUrl(key: string): string {
  return `https://test-cdn.example.com/${key}`;
}

/**
 * Check if B2 is healthy (always true in mock)
 */
export async function isB2Healthy(): Promise<Result<boolean>> {
  return { success: true, data: true };
}

/**
 * Reset mock state (for test cleanup)
 */
export function resetB2Client(): void {
  mockUploads.length = 0;
  mockHealthStatus = {
    healthy: true,
    lastChecked: new Date(),
  };
  console.log('🧪 [MOCK B2] Client reset');
}

/**
 * Get all mock uploads (for test verification)
 */
export function getMockUploads() {
  return [...mockUploads];
}

/**
 * Simulate B2 failure for error testing
 */
export function simulateB2Failure(errorMessage: string = 'Simulated B2 failure'): void {
  mockHealthStatus = {
    healthy: false,
    lastChecked: new Date(),
    error: errorMessage,
  };
  console.log('🧪 [MOCK B2] Simulating failure:', errorMessage);
}
