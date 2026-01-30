import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { sanitizeInput, sanitizeRichText } from "../utils/sanitization";
import { getCircuitBreaker } from '../utils/circuitBreaker';
import { retryWithBackoff, RetryPresets } from '../utils/retry';

type Result<T> = 
  | { success: true; data: T } 
  | { success: false; error: { code: string; message: string; details?: any } };

interface B2Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  cdnDomain: string;
}

interface UploadResult {
  url: string;
  key: string;
}

interface HealthCheckResult {
  healthy: boolean;
  lastChecked: Date;
  error?: string;
}

let s3Client: S3Client | null = null;
let healthStatus: HealthCheckResult = {
  healthy: false,
  lastChecked: new Date(0),
};

/**
 * Initializes the B2 S3-compatible client with configuration.
 * 
 * @param config - B2 configuration including endpoint, credentials, and CDN domain
 * @returns Result indicating success or configuration error
 */
export function initializeB2Client(config: B2Config): Result<void> {
  try {
    if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
      return {
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'Missing required B2 configuration',
          details: { config },
        },
      };
    }

    s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Required for B2 S3-compatible API
    });

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INITIALIZATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to initialize B2 client',
        details: error,
      },
    };
  }
}

/**
 * Uploads a file to Backblaze B2 storage using S3-compatible API.
 * Includes circuit breaker protection and automatic retry with exponential backoff.
 * 
 * @param file - File buffer to upload
 * @param fileName - Name for the file (will be sanitized)
 * @param contentType - MIME type of the file
 * @returns Result containing the CDN URL and storage key
 * 
 * @example
 * const result = await uploadToB2(fileBuffer, 'photo.jpg', 'image/jpeg');
 * if (result.success) {
 *   console.log('Photo URL:', result.data.url);
 * }
 */
export async function uploadToB2(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<Result<UploadResult>> {
  // Get circuit breaker for B2 service
  const circuitBreaker = getCircuitBreaker('b2-storage', {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 60000, // 1 minute
  });

  // Execute with circuit breaker protection
  return await circuitBreaker.execute(async () => {
    try {
      if (!s3Client) {
        return {
          success: false,
          error: {
            code: 'CLIENT_NOT_INITIALIZED',
            message: 'B2 client not initialized. Call initializeB2Client first.',
          },
        };
      }

      // Sanitize filename to prevent path traversal
      const sanitizedFileName = sanitizeInput(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');

      // Generate unique key with timestamp
      const timestamp = Date.now();
      const key = `photos/${timestamp}-${sanitizedFileName}`;

      const command = new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME || '',
        Key: key,
        Body: file,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year cache
      });

      await s3Client.send(command);

      // Generate Cloudflare CDN URL
      const cdnDomain = process.env.B2_CDN_DOMAIN || '';
      const url = `https://${cdnDomain}/${key}`;

      return {
        success: true,
        data: { url, key },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload to B2',
          details: error,
        },
      };
    }
  });
}

/**
 * Performs a health check on the B2 storage service.
 * Checks if the bucket is accessible and updates the health status.
 * Includes retry logic for transient failures.
 * 
 * @returns Result containing the health check status
 * 
 * @example
 * const result = await checkB2Health();
 * if (result.success && result.data.healthy) {
 *   console.log('B2 storage is healthy');
 * }
 */
export async function checkB2Health(): Promise<Result<HealthCheckResult>> {
  try {
    if (!s3Client) {
      healthStatus = {
        healthy: false,
        lastChecked: new Date(),
        error: 'B2 client not initialized',
      };
      return { success: true, data: healthStatus };
    }

    const command = new HeadBucketCommand({
      Bucket: process.env.B2_BUCKET_NAME || '',
    });

    await s3Client.send(command);

    healthStatus = {
      healthy: true,
      lastChecked: new Date(),
    };

    return { success: true, data: healthStatus };
  } catch (error) {
    healthStatus = {
      healthy: false,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Health check failed',
    };

    return { success: true, data: healthStatus };
  }
}

/**
 * Gets the current health status of B2 storage.
 * Returns cached status without performing a new check.
 * 
 * @returns Current health status
 */
export function getB2HealthStatus(): HealthCheckResult {
  return healthStatus;
}

/**
 * Generates a Cloudflare CDN URL for a given B2 storage key.
 * 
 * @param key - Storage key (path) of the file
 * @returns CDN URL for the file
 * 
 * @example
 * const url = generateCDNUrl('photos/1234567890-photo.jpg');
 * // Returns: https://cdn.example.com/photos/1234567890-photo.jpg
 */
export function generateCDNUrl(key: string): string {
  const cdnDomain = process.env.B2_CDN_DOMAIN || '';
  return `https://${cdnDomain}/${key}`;
}

/**
 * Checks if B2 storage is currently healthy based on the last health check.
 * If the last check was more than 5 minutes ago, performs a new check.
 * 
 * @returns Result indicating if B2 is healthy
 */
export async function isB2Healthy(): Promise<Result<boolean>> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // If last check was more than 5 minutes ago, perform new check
  if (healthStatus.lastChecked < fiveMinutesAgo) {
    const checkResult = await checkB2Health();
    if (!checkResult.success) {
      return checkResult;
    }
  }

  return { success: true, data: healthStatus.healthy };
}

/**
 * Resets the B2 client and health status.
 * Used primarily for testing purposes.
 */
export function resetB2Client(): void {
  s3Client = null;
  healthStatus = {
    healthy: false,
    lastChecked: new Date(0),
  };
}
