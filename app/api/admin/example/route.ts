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
import { z } from 'zod';
import { ERROR_CODES } from '@/types';

/**
 * Example API Route Template
 * 
 * Demonstrates:
 * - Authentication with withAuth wrapper
 * - Request validation with Zod
 * - Pagination support
 * - Filtering support
 * - Standard error handling
 * - Consistent response format
 * 
 * This file serves as a template for creating new API routes.
 * Copy and modify for specific entities.
 */

// Example schema for validation
const createExampleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

const updateExampleSchema = createExampleSchema.partial();

/**
 * GET /api/admin/example
 * 
 * List examples with pagination and filtering
 */
export async function GET(request: NextRequest) {
  return withAuth(async (userId) => {
    try {
      const { searchParams } = new URL(request.url);

      // Parse pagination
      const { page, pageSize } = parsePagination(searchParams);
      const { from, to } = getPaginationRange(page, pageSize);

      // Parse filters
      const filters = parseFilters(searchParams, ['status', 'search']);

      // TODO: Replace with actual service call
      // Example:
      // const result = await exampleService.list({
      //   userId,
      //   pagination: { from, to },
      //   filters,
      // });
      //
      // if (!result.success) {
      //   return errorResponse(
      //     result.error.code,
      //     result.error.message,
      //     500,
      //     result.error.details
      //   );
      // }

      // Mock response for template
      const mockData = {
        items: [],
        total: 0,
        page,
        pageSize,
      };

      return successResponse(mockData);
    } catch (error) {
      console.error('GET /api/admin/example error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch examples', 500);
    }
  });
}

/**
 * POST /api/admin/example
 * 
 * Create a new example
 */
export async function POST(request: NextRequest) {
  return withAuth(async (userId) => {
    try {
      const body = await request.json();

      // Validate request body
      const validation = validateBody(body, createExampleSchema);
      if (!validation.success) {
        return errorResponse(
          validation.error.code,
          validation.error.message,
          400,
          validation.error.details
        );
      }

      // TODO: Replace with actual service call
      // Example:
      // const result = await exampleService.create({
      //   ...validation.data,
      //   userId,
      // });
      //
      // if (!result.success) {
      //   return errorResponse(
      //     result.error.code,
      //     result.error.message,
      //     500,
      //     result.error.details
      //   );
      // }

      // Mock response for template
      const mockData = {
        id: 'example-id',
        ...validation.data,
        createdAt: new Date().toISOString(),
      };

      return successResponse(mockData, 201);
    } catch (error) {
      console.error('POST /api/admin/example error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to create example', 500);
    }
  });
}

/**
 * PUT /api/admin/example/[id]
 * 
 * Update an existing example
 * 
 * Note: For dynamic routes, create this in app/api/admin/example/[id]/route.ts
 */
export async function PUT(request: NextRequest) {
  return withAuth(async (userId) => {
    try {
      // Extract ID from URL
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];

      if (!id) {
        return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Example ID is required', 400);
      }

      const body = await request.json();

      // Validate request body
      const validation = validateBody(body, updateExampleSchema);
      if (!validation.success) {
        return errorResponse(
          validation.error.code,
          validation.error.message,
          400,
          validation.error.details
        );
      }

      // TODO: Replace with actual service call
      // Example:
      // const result = await exampleService.update(id, {
      //   ...validation.data,
      //   userId,
      // });
      //
      // if (!result.success) {
      //   if (result.error.code === 'NOT_FOUND') {
      //     return errorResponse(result.error.code, result.error.message, 404);
      //   }
      //   return errorResponse(
      //     result.error.code,
      //     result.error.message,
      //     500,
      //     result.error.details
      //   );
      // }

      // Mock response for template
      const mockData = {
        id,
        ...validation.data,
        updatedAt: new Date().toISOString(),
      };

      return successResponse(mockData);
    } catch (error) {
      console.error('PUT /api/admin/example error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to update example', 500);
    }
  });
}

/**
 * DELETE /api/admin/example/[id]
 * 
 * Delete an example
 * 
 * Note: For dynamic routes, create this in app/api/admin/example/[id]/route.ts
 */
export async function DELETE(request: NextRequest) {
  return withAuth(async (userId) => {
    try {
      // Extract ID from URL
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];

      if (!id) {
        return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Example ID is required', 400);
      }

      // TODO: Replace with actual service call
      // Example:
      // const result = await exampleService.delete(id, userId);
      //
      // if (!result.success) {
      //   if (result.error.code === 'NOT_FOUND') {
      //     return errorResponse(result.error.code, result.error.message, 404);
      //   }
      //   return errorResponse(
      //     result.error.code,
      //     result.error.message,
      //     500,
      //     result.error.details
      //   );
      // }

      return successResponse({ message: 'Example deleted successfully' });
    } catch (error) {
      console.error('DELETE /api/admin/example error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to delete example', 500);
    }
  });
}
