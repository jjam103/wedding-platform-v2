import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as emailService from '@/services/emailService';
import { createEmailTemplateSchema } from '@/schemas/emailSchemas';

/**
 * GET /api/admin/emails/templates
 * Lists all email templates
 * Requirements: 17.10
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Call service
    const result = await emailService.listTemplates();

    // 3. Return response
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
}

/**
 * POST /api/admin/emails/templates
 * Creates a new email template
 * Requirements: 17.1, 17.2
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse and validate
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

    // 3. Call service
    const result = await emailService.createTemplate(validation.data);

    // 4. Return response
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
}
