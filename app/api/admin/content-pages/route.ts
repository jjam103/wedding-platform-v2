import { NextRequest } from 'next/server';
import {
  withAuth,
  successResponse,
  errorResponse,
  validateBody,
  parsePagination,
  getPaginationRange,
  parseFilters,
} from '@/lib/apiHelpers';
import {
  createContentPage,
  listContentPages,
} from '@/services/contentPagesService';
import { createContentPageSchema } from '@/schemas/cmsSchemas';

/**
 * GET /api/admin/content-pages
 * 
 * List all content pages with optional filtering by status
 */
export async function GET(request: NextRequest) {
  return withAuth(async () => {
    try {
      const { searchParams } = new URL(request.url);

      // Parse filters
      const filters = parseFilters(searchParams, ['status']);
      
      // Validate status filter if provided
      const status = filters.status as 'draft' | 'published' | undefined;
      if (status && status !== 'draft' && status !== 'published') {
        return errorResponse(
          'VALIDATION_ERROR',
          'Invalid status filter. Must be "draft" or "published"',
          400
        );
      }

      // Call service
      const result = await listContentPages(status ? { status } : undefined);

      if (!result.success) {
        return errorResponse(
          result.error.code,
          result.error.message,
          500,
          result.error.details
        );
      }

      return successResponse(result.data);
    } catch (error) {
      console.error('GET /api/admin/content-pages error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch content pages', 500);
    }
  });
}

/**
 * POST /api/admin/content-pages
 * 
 * Create a new content page
 */
export async function POST(request: NextRequest) {
  return withAuth(async () => {
    try {
      const body = await request.json();

      // Validate request body
      const validation = validateBody(body, createContentPageSchema);
      if (!validation.success) {
        return errorResponse(
          validation.error.code,
          validation.error.message,
          400,
          validation.error.details
        );
      }

      // Call service
      const result = await createContentPage(validation.data);

      if (!result.success) {
        // Map error codes to appropriate HTTP status codes
        const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 : 500;
        return errorResponse(
          result.error.code,
          result.error.message,
          statusCode,
          result.error.details
        );
      }

      return successResponse(result.data, 201);
    } catch (error) {
      console.error('POST /api/admin/content-pages error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to create content page', 500);
    }
  });
}
