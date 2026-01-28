/**
 * API Routes: PUT/DELETE /api/admin/sections/:id
 * 
 * Updates or deletes a section
 * 
 * Validates: Requirements 15.3, 15.4
 */

import { NextResponse } from 'next/server';
import { verifyAuth, errorResponse, successResponse, validateBody } from '@/lib/apiHelpers';
import { updateSection, deleteSection } from '@/services/sectionsService';
import { updateSectionSchema } from '@/schemas/cmsSchemas';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verify authentication
    const authResult = await verifyAuth();
    if (!authResult.success) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = validateBody(body, updateSectionSchema);

    if (!validation.success) {
      return errorResponse(
        validation.error.code,
        validation.error.message,
        400,
        validation.error.details
      );
    }

    // 3. Update section
    const resolvedParams = await params;

    const result = await updateSection(resolvedParams.id, validation.data);

    // 4. Return response
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verify authentication
    const authResult = await verifyAuth();
    if (!authResult.success) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // 2. Delete section
    const result = await deleteSection(resolvedParams.id);

    // 3. Return response
    if (!result.success) {
      return errorResponse(
        result.error.code,
        result.error.message,
        500,
        result.error.details
      );
    }

    return successResponse({ message: 'Section deleted successfully' });
  } catch (error) {
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
