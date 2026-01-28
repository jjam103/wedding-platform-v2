/**
 * API Route: POST /api/admin/sections/reorder
 * 
 * Reorders sections for a page
 * 
 * Validates: Requirements 15.5
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuth, errorResponse, successResponse, validateBody } from '@/lib/apiHelpers';
import { reorderSections } from '@/services/sectionsService';

const reorderSchema = z.object({
  pageId: z.string().uuid(),
  sectionIds: z.array(z.string().uuid()).min(1),
});

export async function POST(request: Request) {
  try {
    // 1. Verify authentication
    const authResult = await verifyAuth();
    if (!authResult.success) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = validateBody(body, reorderSchema);

    if (!validation.success) {
      return errorResponse(
        validation.error.code,
        validation.error.message,
        400,
        validation.error.details
      );
    }

    // 3. Reorder sections
    const result = await reorderSections(
      validation.data.pageId,
      validation.data.sectionIds
    );

    // 4. Return response
    if (!result.success) {
      return errorResponse(
        result.error.code,
        result.error.message,
        500,
        result.error.details
      );
    }

    return successResponse({ message: 'Sections reordered successfully' });
  } catch (error) {
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
