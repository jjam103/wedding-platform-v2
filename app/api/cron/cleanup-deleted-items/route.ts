/**
 * Cleanup Deleted Items Cron Job
 * 
 * GET /api/cron/cleanup-deleted-items - Runs the cleanup job
 * 
 * This endpoint should be called by a cron job scheduler (e.g., Vercel Cron Jobs)
 * to run daily at 2 AM.
 * 
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-deleted-items",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

import { NextResponse } from 'next/server';
import { cleanupOldDeletedItems } from '@/services/deletedItemsCleanupService';

export async function GET(request: Request) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' },
        },
        { status: 401 }
      );
    }

    // Run cleanup
    const result = await cleanupOldDeletedItems();

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Cleanup completed successfully',
        ...result.data,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
