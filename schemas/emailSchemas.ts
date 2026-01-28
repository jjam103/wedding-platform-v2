import { z } from 'zod';

/**
 * Schema for creating an email template.
 * Requirements: 12.1, 12.2
 */
export const createEmailTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(200),
  body_html: z.string().min(1),
  body_text: z.string().min(1),
  variables: z.array(z.string()).default([]),
});

/**
 * Schema for updating an email template.
 */
export const updateEmailTemplateSchema = createEmailTemplateSchema.partial();

/**
 * Schema for sending a single email.
 * Requirements: 12.3
 */
export const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  text: z.string().optional(),
  template_id: z.string().uuid().optional(),
  variables: z.record(z.string(), z.string()).optional(),
});

/**
 * Schema for sending bulk emails.
 * Requirements: 12.3
 */
export const sendBulkEmailSchema = z.object({
  recipients: z.array(z.string().email()).min(1).max(100),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  text: z.string().optional(),
  template_id: z.string().uuid().optional(),
  variables: z.record(z.string(), z.string()).optional(),
});

/**
 * Schema for scheduling an email.
 * Requirements: 12.5
 */
export const scheduleEmailSchema = sendEmailSchema.extend({
  scheduled_at: z.string().datetime(),
});

/**
 * Schema for webhook delivery status update.
 * Requirements: 12.7
 */
export const emailWebhookSchema = z.object({
  email_id: z.string(),
  event: z.enum(['delivered', 'bounced', 'failed', 'opened', 'clicked']),
  timestamp: z.string().datetime(),
  error_message: z.string().optional(),
});

/**
 * Type exports derived from schemas.
 */
export type CreateEmailTemplateDTO = z.infer<typeof createEmailTemplateSchema>;
export type UpdateEmailTemplateDTO = z.infer<typeof updateEmailTemplateSchema>;
export type SendEmailDTO = z.infer<typeof sendEmailSchema>;
export type SendBulkEmailDTO = z.infer<typeof sendBulkEmailSchema>;
export type ScheduleEmailDTO = z.infer<typeof scheduleEmailSchema>;
export type EmailWebhookDTO = z.infer<typeof emailWebhookSchema>;

/**
 * Email template entity.
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Email log entity.
 * Requirements: 12.6, 12.7
 */
export interface EmailLog {
  id: string;
  template_id?: string;
  recipient_email: string;
  subject: string;
  delivery_status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  created_at: string;
}
