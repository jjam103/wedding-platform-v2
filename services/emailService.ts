import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { sanitizeInput, sanitizeRichText } from "../utils/sanitization";
import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';
import {
  createEmailTemplateSchema,
  updateEmailTemplateSchema,
  sendEmailSchema,
  sendBulkEmailSchema,
  scheduleEmailSchema,
  type CreateEmailTemplateDTO,
  type UpdateEmailTemplateDTO,
  type SendEmailDTO,
  type SendBulkEmailDTO,
  type ScheduleEmailDTO,
  type EmailTemplate,
  type EmailLog,
} from '@/schemas/emailSchemas';
import { sendSMSFallback } from './smsService';

// Factory function to get Resend client (allows for dependency injection in tests)
let resendClientInstance: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClientInstance) {
    resendClientInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClientInstance;
}

// Allow tests to inject a mock client
export function setResendClient(client: Resend): void {
  resendClientInstance = client;
}

// Reset to default client (for test cleanup)
export function resetResendClient(): void {
  resendClientInstance = null;
}

// Initialize Supabase client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Sanitizes HTML content for email templates.
 * Allows safe HTML tags for email formatting.
 */
function sanitizeEmailHTML(html: string): string {
  return sanitizeRichText(html);
}

/**
 * Validates that all variables in the template are defined.
 * Requirements: 13.8
 */
function validateTemplateVariables(
  template: string,
  allowedVariables: string[]
): Result<void> {
  // Match variable patterns like {{variable_name}}
  // Variable names must be alphanumeric with underscores
  const variablePattern = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const matches = template.matchAll(variablePattern);
  const undefinedVars: string[] = [];

  for (const match of matches) {
    const varName = match[1];
    if (!allowedVariables.includes(varName)) {
      undefinedVars.push(varName);
    }
  }

  if (undefinedVars.length > 0) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Template contains undefined variables',
        details: { undefinedVariables: undefinedVars },
      },
    };
  }

  return { success: true, data: undefined };
}

/**
 * Substitutes variables in a template string.
 * Requirements: 12.2
 */
function substituteVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }
  return result;
}

/**
 * Creates a new email template.
 * Requirements: 12.1, 12.2
 */
export async function createTemplate(
  data: CreateEmailTemplateDTO
): Promise<Result<EmailTemplate>> {
  try {
    // 1. Validate
    const validation = createEmailTemplateSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: validation.error.issues,
        },
      };
    }

    // 2. Sanitize HTML content
    const sanitized = {
      ...validation.data,
      body_html: sanitizeEmailHTML(validation.data.body_html),
    };

    // 3. Validate template variables
    const htmlValidation = validateTemplateVariables(
      sanitized.body_html,
      sanitized.variables
    );
    if (!htmlValidation.success) {
      return htmlValidation as Result<EmailTemplate>;
    }

    const textValidation = validateTemplateVariables(
      sanitized.body_text,
      sanitized.variables
    );
    if (!textValidation.success) {
      return textValidation as Result<EmailTemplate>;
    }

    // 4. Insert into database
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert(sanitized)
      .select()
      .single();

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

    return { success: true, data: template };
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
 * Gets an email template by ID.
 */
export async function getTemplate(id: string): Promise<Result<EmailTemplate>> {
  try {
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Template not found',
          details: error,
        },
      };
    }

    return { success: true, data: template };
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
 * Updates an email template.
 */
export async function updateTemplate(
  id: string,
  data: UpdateEmailTemplateDTO
): Promise<Result<EmailTemplate>> {
  try {
    // 1. Validate
    const validation = updateEmailTemplateSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: validation.error.issues,
        },
      };
    }

    // 2. Sanitize HTML if provided
    const sanitized = {
      ...validation.data,
      ...(validation.data.body_html && {
        body_html: sanitizeEmailHTML(validation.data.body_html),
      }),
    };

    // 3. Get existing template to check variables
    const existingResult = await getTemplate(id);
    if (!existingResult.success) {
      return existingResult;
    }

    const variables = sanitized.variables || existingResult.data.variables;

    // 4. Validate template variables if HTML or text is being updated
    if (sanitized.body_html) {
      const htmlValidation = validateTemplateVariables(
        sanitized.body_html,
        variables
      );
      if (!htmlValidation.success) {
        return htmlValidation as Result<EmailTemplate>;
      }
    }

    if (sanitized.body_text) {
      const textValidation = validateTemplateVariables(
        sanitized.body_text,
        variables
      );
      if (!textValidation.success) {
        return textValidation as Result<EmailTemplate>;
      }
    }

    // 5. Update in database
    const { data: template, error } = await supabase
      .from('email_templates')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

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

    return { success: true, data: template };
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
 * Deletes an email template.
 */
export async function deleteTemplate(id: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

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
 * Lists all email templates.
 */
export async function listTemplates(): Promise<Result<EmailTemplate[]>> {
  try {
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

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

    return { success: true, data: templates || [] };
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
 * Sends a single email using Resend.
 * Requirements: 12.3, 12.4
 */
export async function sendEmail(data: SendEmailDTO): Promise<Result<{ id: string }>> {
  try {
    // 1. Validate
    const validation = sendEmailSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: validation.error.issues,
        },
      };
    }

    let html = validation.data.html;
    let text = validation.data.text;
    let subject = validation.data.subject;

    // 2. If template_id provided, load template and substitute variables
    if (validation.data.template_id) {
      const templateResult = await getTemplate(validation.data.template_id);
      if (!templateResult.success) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Template not found',
          },
        };
      }

      const template = templateResult.data;
      const variables = validation.data.variables || {};

      html = substituteVariables(template.body_html, variables);
      text = substituteVariables(template.body_text, variables);
      subject = substituteVariables(template.subject, variables);
    }

    // 3. Send email via Resend
    const resend = getResendClient();
    const { data: emailData, error: resendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: validation.data.to,
      subject,
      html,
      text,
    });

    if (resendError) {
      // Log failed email
      await supabase.from('email_logs').insert({
        template_id: validation.data.template_id,
        recipient_email: validation.data.to,
        subject,
        delivery_status: 'failed',
        error_message: resendError.message,
      });

      return {
        success: false,
        error: {
          code: ERROR_CODES.EMAIL_SERVICE_ERROR,
          message: resendError.message,
          details: resendError,
        },
      };
    }

    // 4. Log successful email
    await supabase.from('email_logs').insert({
      template_id: validation.data.template_id,
      recipient_email: validation.data.to,
      subject,
      delivery_status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return { success: true, data: { id: emailData!.id } };
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
 * Sends bulk emails to multiple recipients.
 * Requirements: 12.3
 */
export async function sendBulkEmail(
  data: SendBulkEmailDTO
): Promise<Result<{ sent: number; failed: number }>> {
  try {
    // 1. Validate
    const validation = sendBulkEmailSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: validation.error.issues,
        },
      };
    }

    let html = validation.data.html;
    let text = validation.data.text;
    let subject = validation.data.subject;

    // 2. If template_id provided, load template
    if (validation.data.template_id) {
      const templateResult = await getTemplate(validation.data.template_id);
      if (!templateResult.success) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Template not found',
          },
        };
      }

      const template = templateResult.data;
      const variables = validation.data.variables || {};

      html = substituteVariables(template.body_html, variables);
      text = substituteVariables(template.body_text, variables);
      subject = substituteVariables(template.subject, variables);
    }

    // 3. Send emails to all recipients
    let sent = 0;
    let failed = 0;

    for (const recipient of validation.data.recipients) {
      const result = await sendEmail({
        to: recipient,
        subject,
        html,
        text,
        template_id: validation.data.template_id,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { success: true, data: { sent, failed } };
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
 * Schedules an email for future delivery.
 * Requirements: 12.5
 */
export async function scheduleEmail(
  data: ScheduleEmailDTO
): Promise<Result<{ id: string }>> {
  try {
    // 1. Validate
    const validation = scheduleEmailSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: validation.error.issues,
        },
      };
    }

    // 2. Check that scheduled time is in the future
    const scheduledDate = new Date(validation.data.scheduled_at);
    if (scheduledDate <= new Date()) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Scheduled time must be in the future',
        },
      };
    }

    // 3. Store scheduled email in database
    const { data: scheduledEmail, error } = await supabase
      .from('scheduled_emails')
      .insert({
        recipient_email: validation.data.to,
        subject: validation.data.subject,
        html: validation.data.html,
        text: validation.data.text,
        template_id: validation.data.template_id,
        scheduled_at: validation.data.scheduled_at,
        status: 'pending',
      })
      .select()
      .single();

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

    return { success: true, data: { id: scheduledEmail.id } };
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
 * Updates email delivery status from webhook.
 * Requirements: 12.7
 */
export async function updateDeliveryStatus(
  emailId: string,
  status: 'delivered' | 'bounced' | 'failed',
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
      .from('email_logs')
      .update(updateData)
      .eq('id', emailId);

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
 * Gets email delivery analytics.
 * Requirements: 12.4
 */
export async function getEmailAnalytics(): Promise<
  Result<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
  }>
> {
  try {
    const { data: logs, error } = await supabase
      .from('email_logs')
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
      bounced: logs.filter((l) => l.delivery_status === 'bounced').length,
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
 * Gets email logs with optional filtering.
 * Requirements: 12.6
 */
export async function getEmailLogs(filters?: {
  template_id?: string;
  recipient_email?: string;
  delivery_status?: string;
  limit?: number;
}): Promise<Result<EmailLog[]>> {
  try {
    let query = supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.template_id) {
      query = query.eq('template_id', filters.template_id);
    }

    if (filters?.recipient_email) {
      query = query.eq('recipient_email', filters.recipient_email);
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

/**
 * Sends an email with automatic SMS fallback on failure.
 * Requirements: 12.9, 12.10
 * 
 * @param data - Email data including recipient email
 * @param fallbackPhone - Optional phone number for SMS fallback
 * @returns Result containing the delivery method and ID
 */
export async function sendEmailWithSMSFallback(
  data: SendEmailDTO,
  fallbackPhone?: string
): Promise<Result<{ id: string; method: 'email' | 'sms' }>> {
  try {
    // 1. Attempt to send email
    const emailResult = await sendEmail(data);

    if (emailResult.success) {
      return {
        success: true,
        data: {
          id: emailResult.data.id,
          method: 'email',
        },
      };
    }

    // 2. If email fails and phone number provided, try SMS fallback
    if (fallbackPhone) {
      // Strip HTML tags from email body for SMS
      const textBody = data.text || data.html.replace(/<[^>]*>/g, '');
      
      const smsResult = await sendSMSFallback(
        fallbackPhone,
        data.subject,
        textBody
      );

      if (smsResult.success) {
        return {
          success: true,
          data: {
            id: smsResult.data.id,
            method: 'sms',
          },
        };
      }

      // Both email and SMS failed
      return {
        success: false,
        error: {
          code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
          message: 'Both email and SMS delivery failed',
          details: {
            emailError: emailResult.error,
            smsError: smsResult.error,
          },
        },
      };
    }

    // Email failed and no phone number for fallback
    return emailResult;
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
