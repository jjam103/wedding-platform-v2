/**
 * API Route: POST /api/admin/sections/check-circular
 * 
 * Checks for circular references in section content
 * 
 * Validates: Requirements 15.7
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuth, errorResponse, successResponse, validateBody } from '@/lib/apiHelpers';
import { detectCircularReferences } from '@/services/sectionsService';

const checkCircularSchema = z.object({
  pageId: z.string().uuid(),
  references: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.enum(['activity', 'event', 'accommodation', 'location']),
      name: z.string().optional(),
      slug: z.string().optional(),
    })
  ),
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
    const validation = validateBody(body, checkCircularSchema);

    if (!validation.success) {
      return errorResponse(
        validation.error.code,
        validation.error.message,
        400,
        validation.error.details
      );
    }

    // 3. Check for circular references
    const result = await detectCircularReferences(
      validation.data.pageId,
      validation.data.references
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

    return successResponse({ hasCircularReferences: result.data });
  } catch (error) {
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
