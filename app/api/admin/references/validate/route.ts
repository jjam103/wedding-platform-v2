import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import * as sectionsService from '@/services/sectionsService';

/**
 * Reference Validation API Route
 * 
 * POST /api/admin/references/validate
 * 
 * Validates references for:
 * - Existence in database (broken reference detection)
 * - Circular reference detection
 * 
 * Requirements: 21.8, 21.9
 */

const validateRequestSchema = z.object({
  pageId: z.string().uuid().optional(),
  pageType: z.string().optional(),
  references: z.array(
    z.object({
      type: z.enum(['event', 'activity', 'content_page', 'accommodation']),
      id: z.string().uuid(),
      name: z.string(),
      description: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const body = await request.json();
    const validation = validateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { pageId, pageType, references } = validation.data;

    // 3. Check for circular references if pageId and pageType provided
    let hasCircularReference = false;
    if (pageId && pageType) {
      const circularResult = await sectionsService.detectCircularReferences(
        pageId,
        references
      );

      if (!circularResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: circularResult.error.message,
              details: circularResult.error.details,
            },
          },
          { status: 500 }
        );
      }

      hasCircularReference = circularResult.data;
    }

    // 4. Validate reference existence (broken reference detection)
    const validationResult = await sectionsService.validateReferences(references);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.error.message,
            details: validationResult.error.details,
          },
        },
        { status: 500 }
      );
    }

    // 5. Return validation result
    return NextResponse.json(
      {
        success: true,
        data: {
          valid: validationResult.data.valid && !hasCircularReference,
          hasCircularReference,
          brokenReferences: validationResult.data.brokenReferences,
          circularReferences: validationResult.data.circularReferences,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reference validation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
