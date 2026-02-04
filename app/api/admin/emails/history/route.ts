import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as emailService from '@/services/emailService';

/**
 * GET /api/admin/emails/history
 * Returns email history with delivery status
 * Requirements: 4.6, 4.7
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    if (searchParams.has('recipient')) {
      filters.recipient_email = searchParams.get('recipient');
    }

    if (searchParams.has('status')) {
      filters.delivery_status = searchParams.get('status');
    }

    if (searchParams.has('template_id')) {
      filters.template_id = searchParams.get('template_id');
    }

    if (searchParams.has('limit')) {
      filters.limit = parseInt(searchParams.get('limit') || '50', 10);
    }

    // Date range filtering
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // 3. Call service
    const result = await emailService.getEmailLogs(filters);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    // 4. Apply date filtering if needed (service doesn't support it yet)
    let filteredLogs = result.data;

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredLogs = filteredLogs.filter(log => 
        log.created_at && new Date(log.created_at) >= fromDate
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filteredLogs = filteredLogs.filter(log => 
        log.created_at && new Date(log.created_at) <= toDate
      );
    }

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: filteredLogs,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
