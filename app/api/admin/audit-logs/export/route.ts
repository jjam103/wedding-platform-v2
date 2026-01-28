import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { auditLogService } from '@/services/auditLogService';

/**
 * GET /api/admin/audit-logs/export
 * Exports audit logs to CSV format
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    // 2. Parse query parameters (same as list endpoint)
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id') || undefined;
    const entity_type = searchParams.get('entity_type') || undefined;
    const entity_id = searchParams.get('entity_id') || undefined;
    const operation_type = searchParams.get('operation_type') as
      | 'create'
      | 'update'
      | 'delete'
      | undefined;
    const start_date = searchParams.get('start_date')
      ? new Date(searchParams.get('start_date')!)
      : undefined;
    const end_date = searchParams.get('end_date')
      ? new Date(searchParams.get('end_date')!)
      : undefined;

    // 3. Get all logs (no pagination for export)
    const result = await auditLogService.list(supabase, {
      user_id,
      entity_type,
      entity_id,
      operation_type,
      start_date,
      end_date,
      page: 1,
      page_size: 10000, // Large page size for export
    });

    if (!result.success) {
      const statusCode =
        result.error.code === 'UNAUTHORIZED'
          ? 401
          : result.error.code === 'NOT_FOUND'
            ? 404
            : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    // 4. Convert to CSV
    const logs = result.data.logs;
    const headers = [
      'Timestamp',
      'User ID',
      'User Email',
      'Action',
      'Entity Type',
      'Entity ID',
      'IP Address',
      'User Agent',
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map((log) =>
        [
          log.created_at,
          log.user_id || '',
          log.user_email || '',
          log.operation_type,
          log.entity_type,
          log.entity_id,
          log.ip_address || '',
          log.user_agent ? `"${log.user_agent.replace(/"/g, '""')}"` : '',
        ].join(',')
      ),
    ];

    const csv = csvRows.join('\n');

    // 5. Return CSV response
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      },
      { status: 500 }
    );
  }
}
