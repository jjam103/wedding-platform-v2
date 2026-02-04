import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkB2Health, getB2HealthStatus } from '@/services/b2Service';

/**
 * GET /api/admin/storage/health
 * 
 * Returns the health status of B2 storage.
 * Performs a new health check if the last check was more than 5 minutes ago.
 * 
 * @returns Health status with last check time and any error details
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
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Get current health status
    const currentStatus = getB2HealthStatus();
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 3. Perform new check if last check was more than 5 minutes ago
    let healthStatus = currentStatus;
    if (currentStatus.lastChecked < fiveMinutesAgo) {
      const checkResult = await checkB2Health();
      if (checkResult.success) {
        healthStatus = checkResult.data;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'HEALTH_CHECK_FAILED',
              message: 'Failed to perform health check',
              details: checkResult.error,
            },
          },
          { status: 500 }
        );
      }
    }

    // 4. Return health status
    return NextResponse.json(
      {
        success: true,
        data: {
          healthy: healthStatus.healthy,
          lastChecked: healthStatus.lastChecked.toISOString(),
          error: healthStatus.error,
          status: healthStatus.healthy ? 'healthy' : 'unhealthy',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Storage health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
