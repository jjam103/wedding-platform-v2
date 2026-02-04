import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as emailService from '@/services/emailService';
import { z } from 'zod';

const previewSchema = z.object({
  template_id: z.string().uuid().optional(),
  subject: z.string().optional(),
  html: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
});

/**
 * POST /api/admin/emails/preview
 * Previews an email with variable substitution
 * Requirements: 4.4
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse and validate
    const body = await request.json();
    const validation = previewSchema.safeParse(body);
    
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

    let subject = validation.data.subject || '';
    let html = validation.data.html || '';
    const variables = validation.data.variables || {};

    // 3. If template_id provided, load template
    if (validation.data.template_id) {
      const templateResult = await emailService.getTemplate(validation.data.template_id);
      
      if (!templateResult.success) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
          { status: 404 }
        );
      }

      subject = templateResult.data.subject;
      html = templateResult.data.body_html;
    }

    // 4. Substitute variables
    let previewSubject = subject;
    let previewHtml = html;

    Object.entries(variables).forEach(([key, value]) => {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      previewSubject = previewSubject.replace(pattern, value);
      previewHtml = previewHtml.replace(pattern, value);
    });

    // 5. Return preview
    return NextResponse.json({
      success: true,
      data: {
        subject: previewSubject,
        html: previewHtml,
      },
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
