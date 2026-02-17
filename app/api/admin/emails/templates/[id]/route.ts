import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabaseServer';
import * as emailService from '@/services/emailService';
import { updateEmailTemplateSchema } from '@/schemas/emailSchemas';

/**
 * PUT /api/admin/emails/templates/[id]
 * Updates an email template
 * Requirements: 17.4
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { id } = await params;
    
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse and validate
    const body = await request.json();
    const validation = updateEmailTemplateSchema.safeParse(body);
    
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
    const result = await emailService.updateTemplate(id, validation.data);

    // 4. Return response
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 
                       : result.error.code === 'NOT_FOUND' ? 404 
                       : 500;
      return NextResponse.json(result, { status: statusCode });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/emails/templates/[id]
 * Deletes an email template
 * Requirements: 17.7, 17.8
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { id } = await params;
    
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Check if template is in use (prevent deletion)
    // This would require checking email_history table for references
    const { data: emailsUsingTemplate, error: checkError } = await supabase
      .from('email_logs')
      .select('id')
      .eq('template_id', id)
      .limit(1);

    if (checkError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: checkError.message } },
        { status: 500 }
      );
    }

    if (emailsUsingTemplate && emailsUsingTemplate.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'TEMPLATE_IN_USE', 
            message: 'Cannot delete template that has been used to send emails' 
          } 
        },
        { status: 409 }
      );
    }

    // 3. Call service
    const result = await emailService.deleteTemplate(id);

    // 4. Return response
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(result, { status: statusCode });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
