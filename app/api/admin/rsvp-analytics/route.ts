import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface EventResponseRate {
  event_id: string;
  event_name: string;
  event_date: string;
  total_invited: number;
  total_responded: number;
  response_rate: number;
  by_status: {
    attending: number;
    declined: number;
    maybe: number;
    pending: number;
  };
}

interface ActivityResponseRate {
  activity_id: string;
  activity_name: string;
  activity_date: string;
  capacity: number | null;
  total_invited: number;
  total_responded: number;
  response_rate: number;
  capacity_utilization: number;
  by_status: {
    attending: number;
    declined: number;
    maybe: number;
    pending: number;
  };
}

interface ResponseTrend {
  date: string;
  attending: number;
  declined: number;
  maybe: number;
  cumulative_total: number;
}

interface RSVPAnalytics {
  overall_response_rate: number;
  response_counts: {
    attending: number;
    declined: number;
    maybe: number;
    pending: number;
  };
  event_response_rates: EventResponseRate[];
  activity_response_rates: ActivityResponseRate[];
  response_trends: ResponseTrend[];
  capacity_utilization: Array<{
    activity_id: string;
    activity_name: string;
    capacity: number;
    attending: number;
    utilization: number;
    warning_level: 'normal' | 'warning' | 'alert';
  }>;
  pending_reminders: number;
}

/**
 * GET /api/admin/rsvp-analytics
 * 
 * Get comprehensive RSVP analytics.
 * 
 * Query parameters:
 * - guestType: Filter by guest type (optional)
 * - fromDate: Start date for trends (optional)
 * - toDate: End date for trends (optional)
 * 
 * Requirements: 37.1-37.12
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const guestType = searchParams.get('guestType');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // 3. Create admin client
    const adminSupabase = createClient(supabaseUrl, supabaseKey);

    // Get all RSVPs
    let rsvpQuery = adminSupabase
      .from('rsvps')
      .select('id, guest_id, event_id, activity_id, status, guest_count, created_at');

    const { data: allRsvps, error: rsvpError } = await rsvpQuery;

    if (rsvpError) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: rsvpError.message } },
        { status: 500 }
      );
    }

    // Filter by guest type if specified
    let filteredRsvps = allRsvps;
    if (guestType) {
      const guestIds = allRsvps.map(r => r.guest_id);
      const { data: guests, error: guestError } = await adminSupabase
        .from('guests')
        .select('id, guest_type')
        .in('id', guestIds)
        .eq('guest_type', guestType);

      if (guestError) {
        return NextResponse.json(
          { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: guestError.message } },
          { status: 500 }
        );
      }

      const filteredGuestIds = new Set(guests.map(g => g.id));
      filteredRsvps = allRsvps.filter(r => filteredGuestIds.has(r.guest_id));
    }

    // Calculate overall response rate
    const totalRsvps = filteredRsvps.length;
    const respondedRsvps = filteredRsvps.filter(r => r.status !== 'pending').length;
    const overall_response_rate = totalRsvps > 0 ? (respondedRsvps / totalRsvps) * 100 : 0;

    // Calculate response counts
    const response_counts = {
      attending: filteredRsvps.filter(r => r.status === 'attending').length,
      declined: filteredRsvps.filter(r => r.status === 'declined').length,
      maybe: filteredRsvps.filter(r => r.status === 'maybe').length,
      pending: filteredRsvps.filter(r => r.status === 'pending').length,
    };

    // Get events and calculate response rates
    const { data: events, error: eventsError } = await adminSupabase
      .from('events')
      .select('id, name, date')
      .order('date', { ascending: true });

    if (eventsError) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: eventsError.message } },
        { status: 500 }
      );
    }

    const event_response_rates: EventResponseRate[] = events.map(event => {
      const eventRsvps = filteredRsvps.filter(r => r.event_id === event.id);
      const total_invited = eventRsvps.length;
      const total_responded = eventRsvps.filter(r => r.status !== 'pending').length;
      const response_rate = total_invited > 0 ? (total_responded / total_invited) * 100 : 0;

      return {
        event_id: event.id,
        event_name: event.name,
        event_date: event.date,
        total_invited,
        total_responded,
        response_rate: Math.round(response_rate * 100) / 100,
        by_status: {
          attending: eventRsvps.filter(r => r.status === 'attending').length,
          declined: eventRsvps.filter(r => r.status === 'declined').length,
          maybe: eventRsvps.filter(r => r.status === 'maybe').length,
          pending: eventRsvps.filter(r => r.status === 'pending').length,
        },
      };
    });

    // Get activities and calculate response rates with capacity
    const { data: activities, error: activitiesError } = await adminSupabase
      .from('activities')
      .select('id, name, date, capacity')
      .order('date', { ascending: true });

    if (activitiesError) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: activitiesError.message } },
        { status: 500 }
      );
    }

    const activity_response_rates: ActivityResponseRate[] = activities.map(activity => {
      const activityRsvps = filteredRsvps.filter(r => r.activity_id === activity.id);
      const total_invited = activityRsvps.length;
      const total_responded = activityRsvps.filter(r => r.status !== 'pending').length;
      const response_rate = total_invited > 0 ? (total_responded / total_invited) * 100 : 0;
      
      const attending = activityRsvps.filter(r => r.status === 'attending').reduce((sum, r) => sum + (r.guest_count || 1), 0);
      const capacity_utilization = activity.capacity ? (attending / activity.capacity) * 100 : 0;

      return {
        activity_id: activity.id,
        activity_name: activity.name,
        activity_date: activity.date,
        capacity: activity.capacity,
        total_invited,
        total_responded,
        response_rate: Math.round(response_rate * 100) / 100,
        capacity_utilization: Math.round(capacity_utilization * 100) / 100,
        by_status: {
          attending: activityRsvps.filter(r => r.status === 'attending').length,
          declined: activityRsvps.filter(r => r.status === 'declined').length,
          maybe: activityRsvps.filter(r => r.status === 'maybe').length,
          pending: activityRsvps.filter(r => r.status === 'pending').length,
        },
      };
    });

    // Calculate capacity utilization warnings
    const capacity_utilization = activities
      .filter(a => a.capacity)
      .map(activity => {
        const activityRsvps = filteredRsvps.filter(r => r.activity_id === activity.id);
        const attending = activityRsvps.filter(r => r.status === 'attending').reduce((sum, r) => sum + (r.guest_count || 1), 0);
        const utilization = activity.capacity ? (attending / activity.capacity) * 100 : 0;
        
        let warning_level: 'normal' | 'warning' | 'alert' = 'normal';
        if (utilization >= 100) {
          warning_level = 'alert';
        } else if (utilization >= 90) {
          warning_level = 'warning';
        }

        return {
          activity_id: activity.id,
          activity_name: activity.name,
          capacity: activity.capacity!,
          attending,
          utilization: Math.round(utilization * 100) / 100,
          warning_level,
        };
      })
      .filter(a => a.warning_level !== 'normal')
      .sort((a, b) => b.utilization - a.utilization);

    // Calculate response trends
    let trendsRsvps = filteredRsvps;
    if (fromDate || toDate) {
      trendsRsvps = filteredRsvps.filter(r => {
        const createdDate = new Date(r.created_at);
        if (fromDate && createdDate < new Date(fromDate)) return false;
        if (toDate && createdDate > new Date(toDate)) return false;
        return true;
      });
    }

    // Group by date
    const trendsByDate = new Map<string, { attending: number; declined: number; maybe: number }>();
    for (const rsvp of trendsRsvps) {
      if (rsvp.status === 'pending') continue;
      
      const date = new Date(rsvp.created_at).toISOString().split('T')[0];
      if (!trendsByDate.has(date)) {
        trendsByDate.set(date, { attending: 0, declined: 0, maybe: 0 });
      }
      const trend = trendsByDate.get(date)!;
      if (rsvp.status === 'attending') trend.attending++;
      else if (rsvp.status === 'declined') trend.declined++;
      else if (rsvp.status === 'maybe') trend.maybe++;
    }

    // Convert to array and calculate cumulative
    const response_trends: ResponseTrend[] = [];
    let cumulative_total = 0;
    const sortedDates = Array.from(trendsByDate.keys()).sort();
    
    for (const date of sortedDates) {
      const trend = trendsByDate.get(date)!;
      cumulative_total += trend.attending + trend.declined + trend.maybe;
      response_trends.push({
        date,
        attending: trend.attending,
        declined: trend.declined,
        maybe: trend.maybe,
        cumulative_total,
      });
    }

    // Calculate pending reminders (guests with pending RSVPs)
    const pending_reminders = new Set(
      filteredRsvps.filter(r => r.status === 'pending').map(r => r.guest_id)
    ).size;

    const analytics: RSVPAnalytics = {
      overall_response_rate: Math.round(overall_response_rate * 100) / 100,
      response_counts,
      event_response_rates,
      activity_response_rates,
      capacity_utilization,
      response_trends,
      pending_reminders,
    };

    return NextResponse.json({ success: true, data: analytics }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
