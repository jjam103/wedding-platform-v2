import { createClient } from '@supabase/supabase-js';
import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';
import { sendEmail } from './emailService';
import { executeCronJob, type CronJobResult } from './cronService';

// Initialize Supabase client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Processes scheduled emails that are due to be sent.
 * This function should be called by a scheduled cron job.
 * 
 * @returns Result containing processing statistics
 * 
 * Requirements: 22.4, 12.5
 * 
 * @example
 * // Run every minute to process scheduled emails
 * await processScheduledEmails();
 */
export async function processScheduledEmails(): Promise<Result<CronJobResult>> {
  return executeCronJob('scheduled_email_processing', async () => {
    try {
      // Get all scheduled emails that are due to be sent
      const { data: scheduledEmails, error: fetchError } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(100); // Process in batches

      if (fetchError) {
        throw new Error(`Failed to fetch scheduled emails: ${fetchError.message}`);
      }

      if (!scheduledEmails || scheduledEmails.length === 0) {
        return {
          itemsProcessed: 0,
          itemsFailed: 0,
        };
      }

      let sent = 0;
      let failed = 0;

      // Process each scheduled email
      for (const scheduledEmail of scheduledEmails) {
        try {
          // Mark as processing
          await supabase
            .from('scheduled_emails')
            .update({ status: 'processing' })
            .eq('id', scheduledEmail.id);

          // Send the email
          const emailResult = await sendEmail({
            to: scheduledEmail.recipient_email,
            subject: scheduledEmail.subject,
            html: scheduledEmail.html,
            text: scheduledEmail.text,
            template_id: scheduledEmail.template_id,
          });

          if (emailResult.success) {
            // Mark as sent
            await supabase
              .from('scheduled_emails')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
              })
              .eq('id', scheduledEmail.id);

            sent++;
          } else {
            // Mark as failed
            await supabase
              .from('scheduled_emails')
              .update({
                status: 'failed',
                error_message: emailResult.error.message,
              })
              .eq('id', scheduledEmail.id);

            failed++;
            console.error(
              `Failed to send scheduled email ${scheduledEmail.id}:`,
              emailResult.error
            );
          }
        } catch (error) {
          // Mark as failed
          await supabase
            .from('scheduled_emails')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', scheduledEmail.id);

          failed++;
          console.error(`Error processing scheduled email ${scheduledEmail.id}:`, error);
        }
      }

      return {
        itemsProcessed: sent,
        itemsFailed: failed,
      };
    } catch (error) {
      throw new Error(
        `Email queue processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });
}

/**
 * Gets statistics about scheduled emails.
 * 
 * @returns Result containing scheduled email statistics
 */
export async function getScheduledEmailStats(): Promise<
  Result<{
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    total: number;
  }>
> {
  try {
    const { data: emails, error } = await supabase
      .from('scheduled_emails')
      .select('status');

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch scheduled email statistics',
          details: error,
        },
      };
    }

    const stats = {
      pending: emails.filter((e) => e.status === 'pending').length,
      processing: emails.filter((e) => e.status === 'processing').length,
      sent: emails.filter((e) => e.status === 'sent').length,
      failed: emails.filter((e) => e.status === 'failed').length,
      total: emails.length,
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
 * Retries failed scheduled emails.
 * 
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Result containing retry statistics
 */
export async function retryFailedScheduledEmails(
  maxRetries: number = 3
): Promise<Result<{ retried: number; failed: number }>> {
  try {
    // Get failed emails that haven't exceeded max retries
    const { data: failedEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'failed')
      .or(`retry_count.is.null,retry_count.lt.${maxRetries}`)
      .limit(50); // Process in batches

    if (fetchError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch failed emails',
          details: fetchError,
        },
      };
    }

    if (!failedEmails || failedEmails.length === 0) {
      return { success: true, data: { retried: 0, failed: 0 } };
    }

    let retried = 0;
    let failed = 0;

    for (const email of failedEmails) {
      const retryCount = (email.retry_count || 0) + 1;

      // Update retry count and reset to pending
      await supabase
        .from('scheduled_emails')
        .update({
          status: 'pending',
          retry_count: retryCount,
          error_message: null,
        })
        .eq('id', email.id);

      retried++;
    }

    return { success: true, data: { retried, failed } };
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
 * Cancels a scheduled email before it's sent.
 * 
 * @param emailId - Scheduled email ID
 * @returns Result indicating success or error
 */
export async function cancelScheduledEmail(emailId: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('scheduled_emails')
      .update({ status: 'cancelled' })
      .eq('id', emailId)
      .eq('status', 'pending'); // Only cancel if still pending

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to cancel scheduled email',
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

