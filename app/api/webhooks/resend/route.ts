import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/services/webhookService';

/**
 * POST /api/webhooks/resend
 * 
 * Handles webhook callbacks from Resend email service.
 * Updates email delivery status based on webhook events.
 * 
 * Webhook events:
 * - email.sent: Email was accepted by the recipient's mail server
 * - email.delivered: Email was successfully delivered
 * - email.delivery_delayed: Email delivery was delayed
 * - email.bounced: Email bounced (hard or soft bounce)
 * - email.complained: Recipient marked email as spam
 * - email.opened: Recipient opened the email
 * - email.clicked: Recipient clicked a link in the email
 */
export async function POST(request: Request) {
  try {
    // 1. Verify webhook signature
    const signature = request.headers.get('svix-signature');
    const timestamp = request.headers.get('svix-timestamp');
    const webhookId = request.headers.get('svix-id');

    if (!signature || !timestamp || !webhookId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_HEADERS',
            message: 'Missing required webhook headers',
          },
        },
        { status: 400 }
      );
    }

    const body = await request.text();
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'Webhook secret not configured',
          },
        },
        { status: 500 }
      );
    }

    // Verify signature
    const signedContent = `${webhookId}.${timestamp}.${body}`;
    const isValid = verifyWebhookSignature(signedContent, signature, webhookSecret);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Webhook signature verification failed',
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse webhook payload
    const payload = JSON.parse(body);
    const { type, data } = payload;

    if (!type || !data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'Invalid webhook payload',
          },
        },
        { status: 400 }
      );
    }

    // 3. Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Process webhook event
    const emailId = data.email_id;
    if (!emailId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_EMAIL_ID',
            message: 'Email ID not found in webhook payload',
          },
        },
        { status: 400 }
      );
    }

    // Map Resend event types to our delivery status
    let deliveryStatus: string;
    let errorMessage: string | null = null;

    switch (type) {
      case 'email.sent':
        deliveryStatus = 'sent';
        break;
      case 'email.delivered':
        deliveryStatus = 'delivered';
        break;
      case 'email.delivery_delayed':
        deliveryStatus = 'sent'; // Keep as sent, just delayed
        errorMessage = data.reason || 'Delivery delayed';
        break;
      case 'email.bounced':
        deliveryStatus = 'bounced';
        errorMessage = data.reason || 'Email bounced';
        break;
      case 'email.complained':
        deliveryStatus = 'failed';
        errorMessage = 'Recipient marked as spam';
        break;
      case 'email.opened':
      case 'email.clicked':
        // These are engagement events, don't update delivery status
        // Could be used for analytics in the future
        return NextResponse.json({ success: true, message: 'Event recorded' });
      default:
        console.warn(`Unknown webhook event type: ${type}`);
        return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    // 5. Update email log in database
    const updateData: any = {
      delivery_status: deliveryStatus,
    };

    if (deliveryStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error: updateError } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', emailId);

    if (updateError) {
      console.error('Failed to update email log:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update email delivery status',
            details: updateError,
          },
        },
        { status: 500 }
      );
    }

    // 6. Log webhook event
    await supabase.from('webhook_delivery_logs').insert({
      webhook_id: null, // Resend webhook, not a user-configured webhook
      event: type,
      payload: payload,
      url: request.url,
      status: 'delivered',
      attempts: 1,
      last_attempt_at: new Date().toISOString(),
      response_status: 200,
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'WEBHOOK_ERROR',
          message: error instanceof Error ? error.message : 'Webhook processing failed',
        },
      },
      { status: 500 }
    );
  }
}
