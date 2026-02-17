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
    console.log('[Section Update] Request body:', JSON.stringify(body, null, 2));
    
    const validation = validateBody(body, updateSectionSchema);

    if (!validation.success) {
      console.error('[Section Update] Validation failed:', JSON.stringify(validation.error, null, 2));
      return errorResponse(
        validation.error.code,
        validation.error.message,
        400,
        validation.error.details
      );
    }

    console.log('[Section Update] Validation passed, updating section...');

    // 3. Update section
    const resolvedParams = await params;

    const result = await updateSection(resolvedParams.id, validation.data);

    // 4. Return response
    if (!result.success) {
      console.error('[Section Update] Service error:', result.error);
      
      // Map error codes to HTTP status codes
      let statusCode = 500;
      if (result.error.code === 'NOT_FOUND') {
        statusCode = 404;
      } else if (result.error.code === 'CIRCULAR_REFERENCE' || result.error.code === 'VALIDATION_ERROR') {
        statusCode = 400;
      }
      
      return errorResponse(
        result.error.code,
        result.error.message,
        statusCode,
        result.error.details
      );
    }

    console.log('[Section Update] Success');
    return successResponse(result.data);
  } catch (error) {
    console.error('[Section Update] Unexpected error:', error);
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

    // 2. Resolve params and delete section
    const resolvedParams = await params;
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
