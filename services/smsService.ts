import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';

// Lazy initialize Twilio client to avoid errors when env vars are missing
let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    // Return null if credentials are not configured (e.g., in test environment)
    if (!accountSid || !authToken || accountSid === 'test' || authToken === 'test') {
      return null;
    }
    
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

// Initialize Supabase client for logging
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * SMS log entity for tracking SMS delivery.
 * Requirements: 12.10
 */
export interface SMSLog {
  id: string;
  recipient_phone: string;
  message: string;
  delivery_status: 'queued' | 'sent' | 'delivered' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  created_at: string;
}

/**
 * Sends an SMS message using Twilio.
 * Requirements: 12.9, 12.10
 * 
 * @param to - Recipient phone number in E.164 format (e.g., +15551234567)
 * @param message - SMS message content (max 160 characters for single SMS)
 * @returns Result containing the SMS ID or error details
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<Result<{ id: string }>> {
  try {
    // Check if Twilio is configured
    const client = getTwilioClient();
    if (!client) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
          message: 'SMS service not configured',
        },
      };
    }

    // 1. Validate phone number format (basic check)
    if (!to.startsWith('+')) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Phone number must be in E.164 format (e.g., +15551234567)',
        },
      };
    }

    // 2. Validate message length
    if (message.length === 0) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Message cannot be empty',
        },
      };
    }

    // Truncate message if too long (SMS limit is 160 chars for single message)
    const truncatedMessage = message.length > 160 
      ? message.substring(0, 157) + '...' 
      : message;

    // 3. Send SMS via Twilio
    const twilioMessage = await client.messages.create({
      body: truncatedMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    // 4. Log successful SMS
    await supabase.from('sms_logs').insert({
      recipient_phone: to,
      message: truncatedMessage,
      delivery_status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return { success: true, data: { id: twilioMessage.sid } };
  } catch (error: any) {
    // Log failed SMS
    await supabase.from('sms_logs').insert({
      recipient_phone: to,
      message,
      delivery_status: 'failed',
      error_message: error.message,
    });

    return {
      success: false,
      error: {
        code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        message: error.message || 'Failed to send SMS',
        details: error,
      },
    };
  }
}

/**
 * Sends an SMS with email fallback logic.
 * This is called when email delivery fails.
 * Requirements: 12.9, 12.10
 * 
 * @param phone - Recipient phone number
 * @param subject - Email subject (used to create SMS message)
 * @param body - Email body (truncated for SMS)
 * @returns Result containing the SMS ID or error details
 */
export async function sendSMSFallback(
  phone: string,
  subject: string,
  body: string
): Promise<Result<{ id: string }>> {
  try {
    // Create a concise SMS message from email content
    // Format: "[Subject] Body (truncated)"
    const smsMessage = `[${subject}] ${body}`;
    
    return await sendSMS(phone, smsMessage);
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Updates SMS delivery status from Twilio webhook.
 * Requirements: 12.10
 * 
 * @param smsId - Twilio message SID
 * @param status - Delivery status from Twilio
 * @param errorMessage - Optional error message
 */
export async function updateSMSDeliveryStatus(
  smsId: string,
  status: 'delivered' | 'failed',
  errorMessage?: string
): Promise<Result<void>> {
  try {
    const updateData: any = {
      delivery_status: status,
    };

    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('sms_logs')
      .update(updateData)
      .eq('id', smsId);

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Gets SMS delivery analytics.
 * Requirements: 12.10
 */
export async function getSMSAnalytics(): Promise<
  Result<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
  }>
> {
  try {
    const { data: logs, error } = await supabase
      .from('sms_logs')
      .select('delivery_status');

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message,
          details: error,
        },
      };
    }

    const analytics = {
      total: logs.length,
      sent: logs.filter((l) => l.delivery_status === 'sent').length,
      delivered: logs.filter((l) => l.delivery_status === 'delivered').length,
      failed: logs.filter((l) => l.delivery_status === 'failed').length,
    };

    return { success: true, data: analytics };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Gets SMS logs with optional filtering.
 * Requirements: 12.10
 */
export async function getSMSLogs(filters?: {
  recipient_phone?: string;
  delivery_status?: string;
  limit?: number;
}): Promise<Result<SMSLog[]>> {
  try {
    let query = supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.recipient_phone) {
      query = query.eq('recipient_phone', filters.recipient_phone);
    }

    if (filters?.delivery_status) {
      query = query.eq('delivery_status', filters.delivery_status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data: logs, error } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data: logs || [] };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
