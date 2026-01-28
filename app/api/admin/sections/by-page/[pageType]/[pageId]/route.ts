/**
 * API Route: GET /api/admin/sections/by-page/:pageType/:pageId
 * 
 * Lists all sections for a given page
 * 
 * Validates: Requirements 15.2
 */

import { NextResponse } from 'next/server';
import { verifyAuth, errorResponse, successResponse } from '@/lib/apiHelpers';
import { listSections } from '@/services/sectionsService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pageType: string; pageId: string }> }
) {
  try {
    // 1. Verify authentication
    const authResult = await verifyAuth();
    if (!authResult.success) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // 2. Get sections
    const resolvedParams = await params;

    const result = await listSections(resolvedParams.pageType, resolvedParams.pageId);

    // 3. Return response
    if (!result.success) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500;
      return errorResponse(
        result.error.code,
        result.error.message,
        statusCode,
        result.error.details
      );
    }

    return successResponse(result.data);
  } catch (error) {
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
