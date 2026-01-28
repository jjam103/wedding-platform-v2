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
 * Guest with pending RSVP information.
 */
interface PendingRSVPGuest {
  guest_id: string;
  guest_name: string;
  guest_email: string;
  event_id?: string;
  event_name?: string;
  activity_id?: string;
  activity_name?: string;
  deadline: string;
  days_until_deadline: number;
}

/**
 * Finds guests with pending RSVPs approaching their deadline.
 * 
 * @param daysBeforeDeadline - Number of days before deadline to send reminder (default: 7)
 * @returns Result containing array of guests needing reminders
 * 
 * Requirements: 6.8, 22.2, 22.3, 19.3
 */
export async function findPendingRSVPs(
  daysBeforeDeadline: number = 7
): Promise<Result<PendingRSVPGuest[]>> {
  try {
    const now = new Date();
    const reminderDate = new Date(now);
    reminderDate.setDate(reminderDate.getDate() + daysBeforeDeadline);

    // Find events with upcoming RSVP deadlines
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, rsvp_deadline')
      .eq('rsvp_required', true)
      .not('rsvp_deadline', 'is', null)
      .gte('rsvp_deadline', now.toISOString().split('T')[0])
      .lte('rsvp_deadline', reminderDate.toISOString().split('T')[0])
      .eq('status', 'published');

    if (eventsError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch events with deadlines',
          details: eventsError,
        },
      };
    }

    const pendingGuests: PendingRSVPGuest[] = [];

    // For each event, find guests with pending RSVPs
    for (const event of events || []) {
      // Get all guests who should RSVP to this event
      const { data: guests, error: guestsError } = await supabase
        .from('guests')
        .select('id, first_name, last_name, email')
        .not('email', 'is', null)
        .eq('invitation_sent', true);

      if (guestsError) {
        continue; // Skip this event on error
      }

      for (const guest of guests || []) {
        // Check if guest has pending RSVP for this event
        const { data: rsvps, error: rsvpError } = await supabase
          .from('rsvps')
          .select('status')
          .eq('guest_id', guest.id)
          .eq('event_id', event.id);

        if (rsvpError) {
          continue; // Skip this guest on error
        }

        // If no RSVP or RSVP is pending, add to reminder list
        if (!rsvps || rsvps.length === 0 || rsvps.some((r) => r.status === 'pending')) {
          const deadline = new Date(event.rsvp_deadline!);
          const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          pendingGuests.push({
            guest_id: guest.id,
            guest_name: `${guest.first_name} ${guest.last_name}`,
            guest_email: guest.email!,
            event_id: event.id,
            event_name: event.name,
            deadline: event.rsvp_deadline!,
            days_until_deadline: daysUntil,
          });
        }
      }
    }

    // Also check activities with RSVP deadlines
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, name')
      .eq('status', 'published');

    if (!activitiesError && activities) {
      for (const activity of activities) {
        // Get guests who should RSVP to this activity
        const { data: guests, error: guestsError } = await supabase
          .from('guests')
          .select('id, first_name, last_name, email, rsvp_deadline')
          .not('email', 'is', null)
          .not('rsvp_deadline', 'is', null)
          .gte('rsvp_deadline', now.toISOString().split('T')[0])
          .lte('rsvp_deadline', reminderDate.toISOString().split('T')[0])
          .eq('invitation_sent', true);

        if (guestsError) {
          continue;
        }

        for (const guest of guests || []) {
          // Check if guest has pending RSVP for this activity
          const { data: rsvps, error: rsvpError } = await supabase
            .from('rsvps')
            .select('status')
            .eq('guest_id', guest.id)
            .eq('activity_id', activity.id);

          if (rsvpError) {
            continue;
          }

          if (!rsvps || rsvps.length === 0 || rsvps.some((r) => r.status === 'pending')) {
            const deadline = new Date(guest.rsvp_deadline!);
            const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            pendingGuests.push({
              guest_id: guest.id,
              guest_name: `${guest.first_name} ${guest.last_name}`,
              guest_email: guest.email!,
              activity_id: activity.id,
              activity_name: activity.name,
              deadline: guest.rsvp_deadline!,
              days_until_deadline: daysUntil,
            });
          }
        }
      }
    }

    return { success: true, data: pendingGuests };
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
 * Sends RSVP reminder email to a guest.
 * 
 * @param guest - Guest information with pending RSVP
 * @returns Result indicating success or error
 * 
 * Requirements: 6.8, 22.2, 22.3, 19.3
 */
export async function sendRSVPReminder(guest: PendingRSVPGuest): Promise<Result<void>> {
  try {
    const eventOrActivity = guest.event_name || guest.activity_name || 'the event';
    const deadlineDate = new Date(guest.deadline).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `RSVP Reminder: ${eventOrActivity} - ${guest.days_until_deadline} days left`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">RSVP Reminder</h2>
        <p>Hi ${guest.guest_name},</p>
        <p>This is a friendly reminder that your RSVP for <strong>${eventOrActivity}</strong> is still pending.</p>
        <p><strong>Deadline:</strong> ${deadlineDate} (${guest.days_until_deadline} days from now)</p>
        <p>Please take a moment to let us know if you'll be attending by visiting your guest portal.</p>
        <p style="margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/guest/rsvp" 
             style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Submit Your RSVP
          </a>
        </p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          If you have any questions, please don't hesitate to reach out.
        </p>
        <p style="color: #6b7280; font-size: 14px;">Pura Vida! 🌴</p>
      </div>
    `;

    const text = `
Hi ${guest.guest_name},

This is a friendly reminder that your RSVP for ${eventOrActivity} is still pending.

Deadline: ${deadlineDate} (${guest.days_until_deadline} days from now)

Please take a moment to let us know if you'll be attending by visiting your guest portal:
${process.env.NEXT_PUBLIC_APP_URL}/guest/rsvp

If you have any questions, please don't hesitate to reach out.

Pura Vida! 🌴
    `;

    const emailResult = await sendEmail({
      to: guest.guest_email,
      subject,
      html,
      text,
    });

    if (!emailResult.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.EMAIL_SERVICE_ERROR,
          message: `Failed to send reminder to ${guest.guest_email}`,
          details: emailResult.error,
        },
      };
    }

    // Log the reminder sent
    await supabase.from('rsvp_reminders_sent').insert({
      guest_id: guest.guest_id,
      event_id: guest.event_id,
      activity_id: guest.activity_id,
      sent_at: new Date().toISOString(),
      days_before_deadline: guest.days_until_deadline,
    });

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
 * Processes all pending RSVP reminders.
 * This function should be called by a scheduled cron job.
 * 
 * @param daysBeforeDeadline - Number of days before deadline to send reminder (default: 7)
 * @returns Result containing processing statistics
 * 
 * Requirements: 6.8, 22.2, 22.3, 19.3
 * 
 * @example
 * // Run daily to send reminders 7 days before deadline
 * await processRSVPReminders(7);
 */
export async function processRSVPReminders(
  daysBeforeDeadline: number = 7
): Promise<Result<CronJobResult>> {
  return executeCronJob('rsvp_deadline_reminders', async () => {
    // Find guests needing reminders
    const pendingResult = await findPendingRSVPs(daysBeforeDeadline);

    if (!pendingResult.success) {
      throw new Error(pendingResult.error.message);
    }

    const pendingGuests = pendingResult.data;
    let sent = 0;
    let failed = 0;

    // Send reminder to each guest
    for (const guest of pendingGuests) {
      const reminderResult = await sendRSVPReminder(guest);

      if (reminderResult.success) {
        sent++;
      } else {
        failed++;
        console.error(`Failed to send reminder to ${guest.guest_email}:`, reminderResult.error);
      }
    }

    return {
      itemsProcessed: sent,
      itemsFailed: failed,
    };
  });
}

/**
 * Gets RSVP reminder statistics.
 * 
 * @param since - Optional start date for statistics (ISO string)
 * @returns Result containing reminder statistics
 */
export async function getReminderStats(
  since?: string
): Promise<
  Result<{
    totalReminders: number;
    remindersByEvent: Record<string, number>;
    remindersByActivity: Record<string, number>;
  }>
> {
  try {
    let query = supabase.from('rsvp_reminders_sent').select('*');

    if (since) {
      query = query.gte('sent_at', since);
    }

    const { data: reminders, error } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch reminder statistics',
          details: error,
        },
      };
    }

    const remindersByEvent: Record<string, number> = {};
    const remindersByActivity: Record<string, number> = {};

    for (const reminder of reminders || []) {
      if (reminder.event_id) {
        remindersByEvent[reminder.event_id] = (remindersByEvent[reminder.event_id] || 0) + 1;
      }
      if (reminder.activity_id) {
        remindersByActivity[reminder.activity_id] = (remindersByActivity[reminder.activity_id] || 0) + 1;
      }
    }

    return {
      success: true,
      data: {
        totalReminders: reminders?.length || 0,
        remindersByEvent,
        remindersByActivity,
      },
    };
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

