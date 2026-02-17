import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabaseServer';
import * as emailService from '@/services/emailService';
import { scheduleEmailSchema } from '@/schemas/emailSchemas';

/**
 * POST /api/admin/emails/schedule
 * Schedules an email for future delivery
 * Requirements: 4.5
 */
export async function POST(request: Request) {
  try {
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
    
    // For bulk scheduling, we need to handle multiple recipients
    if (body.recipients && Array.isArray(body.recipients)) {
      // Schedule email for each recipient
      const results = [];
      for (const recipient of body.recipients) {
        const emailData = {
          to: recipient,
          subject: body.subject,
          html: body.html,
          text: body.text,
          template_id: body.template_id,
          variables: body.variables,
          scheduled_at: body.scheduled_at,
        };

        const validation = scheduleEmailSchema.safeParse(emailData);
        
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

        const result = await emailService.scheduleEmail(validation.data);
        results.push(result);
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      return NextResponse.json({
        success: true,
        data: {
          scheduled: successCount,
          failed: failCount,
          total: results.length,
        },
      }, { status: 200 });
    } else {
      // Single recipient
      const validation = scheduleEmailSchema.safeParse(body);
      
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
      const result = await emailService.scheduleEmail(validation.data);

      // 4. Return response
      if (result.success) {
        return NextResponse.json(result, { status: 200 });
      } else {
        const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 
                         : result.error.code === 'NOT_FOUND' ? 404 
                         : 500;
        return NextResponse.json(result, { status: statusCode });
      }
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
