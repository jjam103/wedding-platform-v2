import { createClient } from '@supabase/supabase-js';
import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * Cron job status types.
 */
export type CronJobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Cron job types supported by the system.
 */
export type CronJobType =
  | 'rsvp_deadline_reminders'
  | 'scheduled_email_processing'
  | 'webhook_retry'
  | 'temp_file_cleanup'
  | 'expired_session_cleanup';

/**
 * Cron job execution log entry.
 */
export interface CronJobLog {
  id: string;
  job_type: CronJobType;
  status: CronJobStatus;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  items_processed: number;
  items_failed: number;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Cron job execution result.
 */
export interface CronJobResult {
  jobType: CronJobType;
  status: CronJobStatus;
  itemsProcessed: number;
  itemsFailed: number;
  durationMs: number;
  errors: string[];
}

// Initialize Supabase client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Creates a cron job log entry at the start of execution.
 * 
 * @param jobType - Type of cron job being executed
 * @returns Result containing the log entry ID
 */
async function startJobLog(jobType: CronJobType): Promise<Result<string>> {
  try {
    const { data, error } = await supabase
      .from('cron_job_logs')
      .insert({
        job_type: jobType,
        status: 'running',
        started_at: new Date().toISOString(),
        items_processed: 0,
        items_failed: 0,
      })
      .select('id')
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to create job log',
          details: error,
        },
      };
    }

    return { success: true, data: data.id };
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
 * Updates a cron job log entry at the end of execution.
 * 
 * @param logId - Log entry ID
 * @param result - Job execution result
 * @returns Result indicating success or error
 */
async function completeJobLog(
  logId: string,
  result: Omit<CronJobResult, 'jobType'>
): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('cron_job_logs')
      .update({
        status: result.status,
        completed_at: new Date().toISOString(),
        duration_ms: result.durationMs,
        items_processed: result.itemsProcessed,
        items_failed: result.itemsFailed,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
      })
      .eq('id', logId);

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to update job log',
          details: error,
        },
      };
    }

    return { success: true, data: undefined };
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
 * Executes a cron job with automatic logging and error handling.
 * 
 * @param jobType - Type of cron job to execute
 * @param jobFunction - Function that performs the job
 * @returns Result containing job execution details
 * 
 * @example
 * await executeCronJob('rsvp_deadline_reminders', async () => {
 *   // Job implementation
 *   return { itemsProcessed: 10, itemsFailed: 0 };
 * });
 */
export async function executeCronJob(
  jobType: CronJobType,
  jobFunction: () => Promise<{ itemsProcessed: number; itemsFailed: number }>
): Promise<Result<CronJobResult>> {
  const startTime = Date.now();
  const errors: string[] = [];

  // Start job log
  const logResult = await startJobLog(jobType);
  if (!logResult.success) {
    return {
      success: false,
      error: logResult.error,
    };
  }

  const logId = logResult.data;

  try {
    // Execute the job function
    const { itemsProcessed, itemsFailed } = await jobFunction();

    const durationMs = Date.now() - startTime;
    const status: CronJobStatus = itemsFailed > 0 ? 'completed' : 'completed';

    const result: CronJobResult = {
      jobType,
      status,
      itemsProcessed,
      itemsFailed,
      durationMs,
      errors,
    };

    // Update job log
    await completeJobLog(logId, result);

    return { success: true, data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    const durationMs = Date.now() - startTime;

    const result: CronJobResult = {
      jobType,
      status: 'failed',
      itemsProcessed: 0,
      itemsFailed: 0,
      durationMs,
      errors,
    };

    // Update job log with failure
    await completeJobLog(logId, result);

    return {
      success: false,
      error: {
        code: ERROR_CODES.CRON_JOB_ERROR,
        message: `Cron job ${jobType} failed: ${errorMessage}`,
        details: error,
      },
    };
  }
}

/**
 * Gets recent cron job execution logs.
 * 
 * @param jobType - Optional filter by job type
 * @param limit - Maximum number of logs to return (default: 100)
 * @returns Result containing array of job logs
 */
export async function getJobLogs(
  jobType?: CronJobType,
  limit: number = 100
): Promise<Result<CronJobLog[]>> {
  try {
    let query = supabase
      .from('cron_job_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch job logs',
          details: error,
        },
      };
    }

    return { success: true, data: data || [] };
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
 * Gets cron job execution statistics.
 * 
 * @param jobType - Optional filter by job type
 * @param since - Optional start date for statistics (ISO string)
 * @returns Result containing job statistics
 */
export async function getJobStats(
  jobType?: CronJobType,
  since?: string
): Promise<
  Result<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDurationMs: number;
    totalItemsProcessed: number;
    totalItemsFailed: number;
  }>
> {
  try {
    let query = supabase.from('cron_job_logs').select('*');

    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    if (since) {
      query = query.gte('started_at', since);
    }

    const { data: logs, error } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch job statistics',
          details: error,
        },
      };
    }

    const stats = {
      totalExecutions: logs.length,
      successfulExecutions: logs.filter((l) => l.status === 'completed').length,
      failedExecutions: logs.filter((l) => l.status === 'failed').length,
      averageDurationMs:
        logs.length > 0
          ? logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / logs.length
          : 0,
      totalItemsProcessed: logs.reduce((sum, l) => sum + (l.items_processed || 0), 0),
      totalItemsFailed: logs.reduce((sum, l) => sum + (l.items_failed || 0), 0),
    };

    return { success: true, data: stats };
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
 * Checks if a cron job is currently running.
 * 
 * @param jobType - Type of cron job to check
 * @returns Result indicating if job is running
 */
export async function isJobRunning(jobType: CronJobType): Promise<Result<boolean>> {
  try {
    const { data, error } = await supabase
      .from('cron_job_logs')
      .select('id')
      .eq('job_type', jobType)
      .eq('status', 'running')
      .limit(1);

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to check job status',
          details: error,
        },
      };
    }

    return { success: true, data: (data || []).length > 0 };
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

