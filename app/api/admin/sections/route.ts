/**
 * API Route: POST /api/admin/sections
 * 
 * Creates a new section with columns
 * 
 * Validates: Requirements 15.1
 */

import { NextResponse } from 'next/server';
import { verifyAuth, errorResponse, successResponse, validateBody } from '@/lib/apiHelpers';
import { createSection } from '@/services/sectionsService';
import { createSectionSchema } from '@/schemas/cmsSchemas';

export async function POST(request: Request) {
  try {
    // 1. Verify authentication
    const authResult = await verifyAuth();
    if (!authResult.success) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = validateBody(body, createSectionSchema);

    if (!validation.success) {
      return errorResponse(
        validation.error.code,
        validation.error.message,
        400,
        validation.error.details
      );
    }

    // 3. Create section
    const result = await createSection(validation.data);

    // 4. Return response
    if (!result.success) {
      return errorResponse(
        result.error.code,
        result.error.message,
        500,
        result.error.details
      );
    }

    return successResponse(result.data, 201);
  } catch (error) {
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
