import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabaseServer';
import * as emailService from '@/services/emailService';
import { z } from 'zod';

/**
 * Maps error codes to HTTP status codes
 */
function getStatusCode(errorCode: string): number {
  const statusMap: Record<string, number> = {
    'VALIDATION_ERROR': 400,
    'INVALID_INPUT': 400,
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'NOT_FOUND': 404,
    'CONFLICT': 409,
    'DATABASE_ERROR': 500,
    'INTERNAL_ERROR': 500,
    'UNKNOWN_ERROR': 500,
    'EXTERNAL_SERVICE_ERROR': 502,
    'EMAIL_SERVICE_ERROR': 503,
  };
  return statusMap[errorCode] || 500;
}

/**
 * Query parameter schema for email history filtering
 */
const querySchema = z.object({
  recipient: z.string().email().optional(),
  status: z.enum(['queued', 'sent', 'delivered', 'failed', 'bounced']).optional(),
  template_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(50),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

/**
 * GET /api/admin/emails/history
 * Returns email history with delivery status
 * Requirements: 4.6, 4.7
 */
export async function GET(request: Request) {
  try {
    // 1. AUTHENTICATE
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. VALIDATE query parameters
    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      recipient: searchParams.get('recipient'),
      status: searchParams.get('status'),
      template_id: searchParams.get('template_id'),
      limit: searchParams.get('limit'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { recipient, status, template_id, limit, date_from, date_to } = validation.data;

    // 3. DELEGATE to service
    const filters: any = {};
    if (recipient) filters.recipient_email = recipient;
    if (status) filters.delivery_status = status;
    if (template_id) filters.template_id = template_id;
    if (limit) filters.limit = limit;

    const result = await emailService.getEmailLogs(filters);

    if (!result.success) {
      return NextResponse.json(result, { 
        status: getStatusCode(result.error.code) 
      });
    }

    // 4. Apply date filtering if needed (service doesn't support it yet)
    let filteredLogs = result.data;

    if (date_from) {
      const fromDate = new Date(date_from);
      filteredLogs = filteredLogs.filter(log => 
        log.created_at && new Date(log.created_at) >= fromDate
      );
    }

    if (date_to) {
      const toDate = new Date(date_to);
      toDate.setHours(23, 59, 59, 999); // End of day
      filteredLogs = filteredLogs.filter(log => 
        log.created_at && new Date(log.created_at) <= toDate
      );
    }

    // 5. RESPOND
    return NextResponse.json({
      success: true,
      data: filteredLogs,
    }, { status: 200 });
  } catch (error) {
    console.error('API Error:', {
      path: request.url,
      method: request.method,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
