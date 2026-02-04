import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './emailService';
import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Sends activity reminder emails to guests 48 hours before activities
 * Requirements: 26.10
 */
export async function sendActivityReminders(): Promise<Result<{ sent: number; failed: number }>> {
  try {
    // Get activities starting in 48 hours
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in49Hours = new Date(now.getTime() + 49 * 60 * 60 * 1000);

    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, name, date, time, location')
      .gte('date', in48Hours.toISOString().split('T')[0])
      .lte('date', in49Hours.toISOString().split('T')[0]);

    if (activitiesError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: activitiesError.message,
          details: activitiesError,
        },
      };
    }

    let sent = 0;
    let failed = 0;

    // For each activity, get attending guests and send reminders
    for (const activity of activities || []) {
      const { data: rsvps, error: rsvpsError } = await supabase
        .from('rsvps')
        .select('guest_id, guests(first_name, last_name, email)')
        .eq('activity_id', activity.id)
        .eq('status', 'attending');

      if (rsvpsError) {
        failed++;
        continue;
      }

      for (const rsvp of rsvps || []) {
        const guest = (rsvp as any).guests;
        if (!guest || !guest.email) continue;

        try {
          await sendEmail({
            to: guest.email,
            subject: `Reminder: ${activity.name} Tomorrow`,
            html: `
              <p>Hi ${guest.first_name},</p>
              <p>This is a reminder that you have an activity coming up!</p>
              <p><strong>Activity:</strong> ${activity.name}</p>
              <p><strong>Date:</strong> ${activity.date}</p>
              <p><strong>Time:</strong> ${activity.time || 'TBD'}</p>
              <p><strong>Location:</strong> ${activity.location || 'TBD'}</p>
              <p>See you there!</p>
            `,
            text: `Hi ${guest.first_name}, Reminder: ${activity.name} on ${activity.date} at ${activity.time || 'TBD'}. Location: ${activity.location || 'TBD'}`,
            template_id: undefined, // Could use 'activity_reminder' template
          });
          sent++;
        } catch (error) {
          failed++;
        }
      }
    }

    return {
      success: true,
      data: { sent, failed },
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

/**
 * Sends deadline notification emails to guests who haven't responded
 * Requirements: 4.8
 */
export async function sendDeadlineNotifications(): Promise<Result<{ sent: number; failed: number }>> {
  try {
    // Get activities with RSVP deadlines in 7 days, 3 days, or 1 day
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    const deadlineDates = [
      in7Days.toISOString().split('T')[0],
      in3Days.toISOString().split('T')[0],
      in1Day.toISOString().split('T')[0],
    ];

    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, name, rsvp_deadline')
      .in('rsvp_deadline', deadlineDates);

    if (activitiesError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: activitiesError.message,
          details: activitiesError,
        },
      };
    }

    let sent = 0;
    let failed = 0;

    // For each activity, find guests who haven't responded
    for (const activity of activities || []) {
      // Get all guests invited to this activity
      const { data: allGuests, error: guestsError } = await supabase
        .from('guests')
        .select('id, first_name, last_name, email');

      if (guestsError) {
        failed++;
        continue;
      }

      // Get guests who have already responded
      const { data: respondedRsvps, error: rsvpsError } = await supabase
        .from('rsvps')
        .select('guest_id')
        .eq('activity_id', activity.id)
        .neq('status', 'pending');

      if (rsvpsError) {
        failed++;
        continue;
      }

      const respondedGuestIds = new Set((respondedRsvps || []).map(r => r.guest_id));

      // Send reminders to guests who haven't responded
      for (const guest of allGuests || []) {
        if (respondedGuestIds.has(guest.id) || !guest.email) continue;

        try {
          await sendEmail({
            to: guest.email,
            subject: `RSVP Deadline Approaching for ${activity.name}`,
            html: `
              <p>Hi ${guest.first_name},</p>
              <p>This is a reminder that the RSVP deadline for ${activity.name} is approaching!</p>
              <p><strong>Deadline:</strong> ${activity.rsvp_deadline}</p>
              <p>Please submit your RSVP as soon as possible.</p>
              <p>Thank you!</p>
            `,
            text: `Hi ${guest.first_name}, RSVP deadline for ${activity.name} is ${activity.rsvp_deadline}. Please respond soon!`,
            template_id: undefined, // Could use 'deadline_reminder' template
          });
          sent++;
        } catch (error) {
          failed++;
        }
      }
    }

    return {
      success: true,
      data: { sent, failed },
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
