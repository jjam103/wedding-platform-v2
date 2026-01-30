import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { auditLogService } from '@/services/auditLogService';

/**
 * GET /api/admin/audit-logs
 * Retrieves audit logs with optional filtering and pagination
 */
export async function GET(request: Request) {
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
            cookiesToSet.forEach(({ name, value }) => {
              cookieStore.set(name, value);
            });
          },
        },
      }
    );
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

    // 2. Parse query parameters
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
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!, 10)
      : 1;
    const page_size = searchParams.get('page_size')
      ? parseInt(searchParams.get('page_size')!, 10)
      : 50;

    // 3. Call service
    const result = await auditLogService.list(supabase, {
      user_id,
      entity_type,
      entity_id,
      operation_type,
      start_date,
      end_date,
      page,
      page_size,
    });

    // 4. Return response
    if (!result.success) {
      const statusCode =
        result.error.code === 'UNAUTHORIZED'
          ? 401
          : result.error.code === 'NOT_FOUND'
            ? 404
            : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
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
