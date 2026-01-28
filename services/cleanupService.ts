import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';
import { executeCronJob, type CronJobResult } from './cronService';

// Initialize Supabase client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Cleans up temporary files older than the specified age.
 * 
 * @param maxAgeHours - Maximum age of files to keep in hours (default: 24)
 * @returns Result containing cleanup statistics
 * 
 * Requirements: 22.5, 22.7, 19.4
 */
export async function cleanupTempFiles(
  maxAgeHours: number = 24
): Promise<Result<{ filesDeleted: number; bytesFreed: number }>> {
  try {
    const tempDir = path.join(process.cwd(), 'tmp');
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const now = Date.now();

    let filesDeleted = 0;
    let bytesFreed = 0;

    // Check if temp directory exists
    try {
      await fs.access(tempDir);
    } catch {
      // Directory doesn't exist, nothing to clean
      return { success: true, data: { filesDeleted: 0, bytesFreed: 0 } };
    }

    // Read all files in temp directory
    const files = await fs.readdir(tempDir);

    for (const file of files) {
      const filePath = path.join(tempDir, file);

      try {
        const stats = await fs.stat(filePath);

        // Check if file is older than max age
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAgeMs) {
          // Delete the file
          await fs.unlink(filePath);
          filesDeleted++;
          bytesFreed += stats.size;
        }
      } catch (error) {
        // Skip files that can't be accessed or deleted
        console.error(`Failed to process file ${filePath}:`, error);
      }
    }

    return { success: true, data: { filesDeleted, bytesFreed } };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Cleans up expired sessions from the database.
 * 
 * @returns Result containing cleanup statistics
 * 
 * Requirements: 22.5, 22.8, 19.4
 */
export async function cleanupExpiredSessions(): Promise<
  Result<{ sessionsDeleted: number }>
> {
  try {
    // Note: Supabase Auth handles session cleanup automatically
    // This function is a placeholder for any custom session cleanup logic

    // Clean up any custom session-related data if needed
    // For example, cleaning up old session logs or temporary session data

    // Get expired sessions from auth.sessions (if accessible)
    // Since we're using Supabase Auth, expired sessions are handled automatically
    // We can clean up related data like old audit logs or temporary data

    return { success: true, data: { sessionsDeleted: 0 } };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Cleans up old audit logs to prevent database bloat.
 * 
 * @param retentionDays - Number of days to retain audit logs (default: 90)
 * @returns Result containing cleanup statistics
 * 
 * Requirements: 22.5, 19.4
 */
export async function cleanupOldAuditLogs(
  retentionDays: number = 90
): Promise<Result<{ logsDeleted: number }>> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { data, error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to delete old audit logs',
          details: error,
        },
      };
    }

    return { success: true, data: { logsDeleted: data?.length || 0 } };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Cleans up old cron job logs to prevent database bloat.
 * 
 * @param retentionDays - Number of days to retain cron job logs (default: 30)
 * @returns Result containing cleanup statistics
 * 
 * Requirements: 22.5, 22.6, 19.4
 */
export async function cleanupOldCronLogs(
  retentionDays: number = 30
): Promise<Result<{ logsDeleted: number }>> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { data, error } = await supabase
      .from('cron_job_logs')
      .delete()
      .lt('started_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to delete old cron job logs',
          details: error,
        },
      };
    }

    return { success: true, data: { logsDeleted: data?.length || 0 } };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Cleans up old email logs to prevent database bloat.
 * 
 * @param retentionDays - Number of days to retain email logs (default: 180)
 * @returns Result containing cleanup statistics
 * 
 * Requirements: 22.5, 19.4
 */
export async function cleanupOldEmailLogs(
  retentionDays: number = 180
): Promise<Result<{ logsDeleted: number }>> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { data, error } = await supabase
      .from('email_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to delete old email logs',
          details: error,
        },
      };
    }

    return { success: true, data: { logsDeleted: data?.length || 0 } };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Cleans up old webhook delivery logs to prevent database bloat.
 * 
 * @param retentionDays - Number of days to retain webhook logs (default: 30)
 * @returns Result containing cleanup statistics
 * 
 * Requirements: 22.5, 19.4
 */
export async function cleanupOldWebhookLogs(
  retentionDays: number = 30
): Promise<Result<{ logsDeleted: number }>> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { data, error } = await supabase
      .from('webhook_delivery_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to delete old webhook logs',
          details: error,
        },
      };
    }

    return { success: true, data: { logsDeleted: data?.length || 0 } };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Runs all cleanup tasks.
 * This function should be called by a scheduled cron job.
 * 
 * @returns Result containing combined cleanup statistics
 * 
 * Requirements: 22.5, 22.7, 22.8, 19.4
 * 
 * @example
 * // Run daily to clean up old data
 * await runAllCleanupTasks();
 */
export async function runAllCleanupTasks(): Promise<Result<CronJobResult>> {
  return executeCronJob('temp_file_cleanup', async () => {
    const results = {
      tempFiles: { filesDeleted: 0, bytesFreed: 0 },
      expiredSessions: { sessionsDeleted: 0 },
      auditLogs: { logsDeleted: 0 },
      cronLogs: { logsDeleted: 0 },
      emailLogs: { logsDeleted: 0 },
      webhookLogs: { logsDeleted: 0 },
    };

    let totalProcessed = 0;
    let totalFailed = 0;

    // Clean up temp files
    const tempFilesResult = await cleanupTempFiles(24);
    if (tempFilesResult.success) {
      results.tempFiles = tempFilesResult.data;
      totalProcessed += tempFilesResult.data.filesDeleted;
    } else {
      totalFailed++;
      console.error('Failed to clean up temp files:', tempFilesResult.error);
    }

    // Clean up expired sessions
    const sessionsResult = await cleanupExpiredSessions();
    if (sessionsResult.success) {
      results.expiredSessions = sessionsResult.data;
      totalProcessed += sessionsResult.data.sessionsDeleted;
    } else {
      totalFailed++;
      console.error('Failed to clean up expired sessions:', sessionsResult.error);
    }

    // Clean up old audit logs (90 days)
    const auditLogsResult = await cleanupOldAuditLogs(90);
    if (auditLogsResult.success) {
      results.auditLogs = auditLogsResult.data;
      totalProcessed += auditLogsResult.data.logsDeleted;
    } else {
      totalFailed++;
      console.error('Failed to clean up audit logs:', auditLogsResult.error);
    }

    // Clean up old cron logs (30 days)
    const cronLogsResult = await cleanupOldCronLogs(30);
    if (cronLogsResult.success) {
      results.cronLogs = cronLogsResult.data;
      totalProcessed += cronLogsResult.data.logsDeleted;
    } else {
      totalFailed++;
      console.error('Failed to clean up cron logs:', cronLogsResult.error);
    }

    // Clean up old email logs (180 days)
    const emailLogsResult = await cleanupOldEmailLogs(180);
    if (emailLogsResult.success) {
      results.emailLogs = emailLogsResult.data;
      totalProcessed += emailLogsResult.data.logsDeleted;
    } else {
      totalFailed++;
      console.error('Failed to clean up email logs:', emailLogsResult.error);
    }

    // Clean up old webhook logs (30 days)
    const webhookLogsResult = await cleanupOldWebhookLogs(30);
    if (webhookLogsResult.success) {
      results.webhookLogs = webhookLogsResult.data;
      totalProcessed += webhookLogsResult.data.logsDeleted;
    } else {
      totalFailed++;
      console.error('Failed to clean up webhook logs:', webhookLogsResult.error);
    }

    return {
      itemsProcessed: totalProcessed,
      itemsFailed: totalFailed,
    };
  });
}

