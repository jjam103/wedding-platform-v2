import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface DashboardMetrics {
  totalGuests: number;
  rsvpResponseRate: number;
  totalBudget: number;
  upcomingEvents: number;
  pendingPhotos: number;
  capacityAlerts: number;
}

/**
 * GET /api/admin/metrics
 * 
 * Fetches dashboard metrics for the admin portal including:
 * - Total guest count
 * - RSVP response rate
 * - Total budget
 * - Upcoming events count
 * - Pending photos count
 * - Capacity alerts count
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

    // 3. Fetch metrics
    const metrics: DashboardMetrics = {
      totalGuests: 0,
      rsvpResponseRate: 0,
      totalBudget: 0,
      upcomingEvents: 0,
      pendingPhotos: 0,
      capacityAlerts: 0,
    };

    // Total guests
    const { count: guestCount } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true });
    metrics.totalGuests = guestCount || 0;

    // RSVP response rate
    const { count: totalRsvps } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact', head: true });
    
    const { count: respondedRsvps } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'pending');

    if (totalRsvps && totalRsvps > 0) {
      metrics.rsvpResponseRate = ((respondedRsvps || 0) / totalRsvps) * 100;
    }

    // Total budget (sum of vendor costs)
    const { data: vendors } = await supabase
      .from('vendors')
      .select('base_cost');
    
    if (vendors) {
      metrics.totalBudget = vendors.reduce((sum, v) => sum + (v.base_cost || 0), 0);
    }

    // Upcoming events (events in the future)
    const { count: upcomingCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('start_date', new Date().toISOString())
      .eq('status', 'published');
    metrics.upcomingEvents = upcomingCount || 0;

    // Pending photos
    const { count: pendingCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'pending');
    metrics.pendingPhotos = pendingCount || 0;

    // Capacity alerts (activities at 90%+ capacity)
    const { data: activities } = await supabase
      .from('activities')
      .select('id, capacity')
      .not('capacity', 'is', null);

    if (activities) {
      let alertCount = 0;
      for (const activity of activities) {
        const { count: rsvpCount } = await supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', activity.id)
          .eq('status', 'attending');

        if (rsvpCount && activity.capacity && rsvpCount >= activity.capacity * 0.9) {
          alertCount++;
        }
      }
      metrics.capacityAlerts = alertCount;
    }

    return NextResponse.json({ success: true, data: metrics }, { status: 200 });
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
