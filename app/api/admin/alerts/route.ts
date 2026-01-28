import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

/**
 * GET /api/admin/alerts
 * 
 * Fetches real-time alerts for the admin dashboard including:
 * - Capacity warnings
 * - RSVP deadline reminders
 * - Pending moderation items
 * - Payment reminders
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Verify user is admin/host
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['super_admin', 'host'].includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // 3. Generate alerts
    const alerts: Alert[] = [];

    // Check for capacity warnings
    const { data: activities } = await supabase
      .from('activities')
      .select('id, name, capacity')
      .not('capacity', 'is', null);

    if (activities) {
      for (const activity of activities) {
        const { count: rsvpCount } = await supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', activity.id)
          .eq('status', 'attending');

        if (rsvpCount && activity.capacity && rsvpCount >= activity.capacity * 0.9) {
          alerts.push({
            id: `capacity-${activity.id}`,
            type: 'warning',
            message: `Activity "${activity.name}" is at ${Math.round((rsvpCount / activity.capacity) * 100)}% capacity`,
            timestamp: new Date(),
          });
        }
      }
    }

    // Check for upcoming RSVP deadlines
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: upcomingDeadlines } = await supabase
      .from('events')
      .select('id, name, rsvp_deadline')
      .not('rsvp_deadline', 'is', null)
      .gte('rsvp_deadline', now.toISOString())
      .lte('rsvp_deadline', sevenDaysFromNow.toISOString());

    if (upcomingDeadlines) {
      for (const event of upcomingDeadlines) {
        const daysUntil = Math.ceil(
          (new Date(event.rsvp_deadline).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );
        alerts.push({
          id: `deadline-${event.id}`,
          type: 'info',
          message: `RSVP deadline for "${event.name}" is in ${daysUntil} days`,
          timestamp: new Date(),
        });
      }
    }

    // Check for pending photo moderation
    const { count: pendingPhotos } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'pending');

    if (pendingPhotos && pendingPhotos > 0) {
      alerts.push({
        id: 'pending-photos',
        type: 'info',
        message: `${pendingPhotos} photo${pendingPhotos > 1 ? 's' : ''} pending moderation`,
        timestamp: new Date(),
      });
    }

    // Check for unpaid vendors
    const { data: unpaidVendors } = await supabase
      .from('vendors')
      .select('id, name, base_cost, amount_paid')
      .eq('payment_status', 'unpaid');

    if (unpaidVendors && unpaidVendors.length > 0) {
      const totalUnpaid = unpaidVendors.reduce((sum, v) => sum + (v.base_cost - v.amount_paid), 0);
      alerts.push({
        id: 'unpaid-vendors',
        type: 'warning',
        message: `${unpaidVendors.length} vendor${unpaidVendors.length > 1 ? 's' : ''} with outstanding payments ($${totalUnpaid.toLocaleString()})`,
        timestamp: new Date(),
      });
    }

    // Sort alerts by type priority (error > warning > info)
    const typePriority = { error: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => typePriority[a.type] - typePriority[b.type]);

    return NextResponse.json({ success: true, data: alerts }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
