import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as emailService from '@/services/emailService';
import { createEmailTemplateSchema } from '@/schemas/emailSchemas';
import { withAuth } from '@/lib/apiHelpers';

/**
 * GET /api/admin/emails/templates
 * Lists all email templates
 * Requirements: 17.10
 */
export async function GET(request: Request) {
  return withAuth(async (userId) => {
    try {
      // Call service
      const result = await emailService.listTemplates();

      // Return response
      if (result.success) {
        return NextResponse.json(result, { status: 200 });
      } else {
        return NextResponse.json(result, { status: 500 });
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/admin/emails/templates
 * Creates a new email template
 * Requirements: 17.1, 17.2
 */
export async function POST(request: Request) {
  return withAuth(async (userId) => {
    try {
      // Parse and validate
      const body = await request.json();
      const validation = createEmailTemplateSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'VALIDATION_ERROR', 
              message: 'Invalid request', 
              details: validation.error.issues 
            } 
          },
          { status: 400 }
        );
      }

      // Call service
      const result = await emailService.createTemplate(validation.data);

      // Return response
      if (result.success) {
        return NextResponse.json(result, { status: 201 });
      } else {
        const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 : 500;
        return NextResponse.json(result, { status: statusCode });
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        { status: 500 }
      );
    }
  });
}
