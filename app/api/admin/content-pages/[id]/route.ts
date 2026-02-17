import { NextRequest } from 'next/server';
import {
  withAuth,
  successResponse,
  errorResponse,
  validateBody,
} from '@/lib/apiHelpers';
import {
  getContentPage,
  updateContentPage,
  deleteContentPage,
} from '@/services/contentPagesService';
import { updateContentPageSchema } from '@/schemas/cmsSchemas';
import { ERROR_CODES } from '@/types';

/**
 * GET /api/admin/content-pages/[id]
 * 
 * Get a single content page by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      if (!id) {
        return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Content page ID is required', 400);
      }

      // Call service
      const result = await getContentPage(id);

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
      console.error('GET /api/admin/content-pages/[id] error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch content page', 500);
    }
  });
}

/**
 * PUT /api/admin/content-pages/[id]
 * 
 * Update an existing content page
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      if (!id) {
        return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Content page ID is required', 400);
      }

      const body = await request.json();

      // Validate request body
      const validation = validateBody(body, updateContentPageSchema);
      if (!validation.success) {
        return errorResponse(
          validation.error.code,
          validation.error.message,
          400,
          validation.error.details
        );
      }

      // Call service
      const result = await updateContentPage(id, validation.data);

      if (!result.success) {
        // Map error codes to appropriate HTTP status codes
        let statusCode = 500;
        if (result.error.code === 'NOT_FOUND') {
          statusCode = 404;
        } else if (result.error.code === 'VALIDATION_ERROR') {
          statusCode = 400;
        }

        return errorResponse(
          result.error.code,
          result.error.message,
          statusCode,
          result.error.details
        );
      }

      return successResponse(result.data);
    } catch (error) {
      console.error('PUT /api/admin/content-pages/[id] error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to update content page', 500);
    }
  });
}

/**
 * DELETE /api/admin/content-pages/[id]
 * 
 * Delete a content page and all associated sections
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    try {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      if (!id) {
        return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Content page ID is required', 400);
      }

      // Call service
      const result = await deleteContentPage(id);

      if (!result.success) {
        const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500;
        return errorResponse(
          result.error.code,
          result.error.message,
          statusCode,
          result.error.details
        );
      }

      return successResponse({ message: 'Content page deleted successfully' });
    } catch (error) {
      console.error('DELETE /api/admin/content-pages/[id] error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to delete content page', 500);
    }
  });
}
