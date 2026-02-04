/**
 * Mock Resend Email Service for E2E Testing
 * 
 * This mock service simulates Resend email operations without sending real emails.
 * It provides realistic responses for testing email functionality.
 */

import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';

interface EmailData {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SentEmail extends EmailData {
  id: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'failed';
}

// Track sent emails for debugging and verification
const sentEmails: SentEmail[] = [];

// Simulate email delivery failures for testing
let shouldFailNextEmail = false;
let failureReason = 'Simulated email failure';

/**
 * Mock Resend client
 */
export class MockResend {
  emails = {
    /**
     * Mock send email method
     */
    send: async (emailData: EmailData): Promise<{ data: { id: string } | null; error: any }> => {
      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Check for simulated failure
        if (shouldFailNextEmail) {
          shouldFailNextEmail = false;
          console.log('🧪 [MOCK RESEND] Email failed (simulated):', {
            to: emailData.to,
            subject: emailData.subject,
            reason: failureReason,
          });

          return {
            data: null,
            error: {
              message: failureReason,
              name: 'EmailError',
            },
          };
        }

        // Generate mock email ID
        const emailId = `mock_email_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Track sent email
        const sentEmail: SentEmail = {
          ...emailData,
          id: emailId,
          timestamp: Date.now(),
          status: 'sent',
        };
        sentEmails.push(sentEmail);

        console.log('🧪 [MOCK RESEND] Email sent:', {
          id: emailId,
          to: emailData.to,
          subject: emailData.subject,
          from: emailData.from,
        });

        return {
          data: { id: emailId },
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: {
            message: error instanceof Error ? error.message : 'Mock email send failed',
            name: 'EmailError',
          },
        };
      }
    },
  };
}

/**
 * Get all sent emails (for test verification)
 */
export function getSentEmails(): SentEmail[] {
  return [...sentEmails];
}

/**
 * Get sent emails by recipient
 */
export function getSentEmailsByRecipient(recipient: string): SentEmail[] {
  return sentEmails.filter((email) => {
    if (Array.isArray(email.to)) {
      return email.to.includes(recipient);
    }
    return email.to === recipient;
  });
}

/**
 * Get sent emails by subject
 */
export function getSentEmailsBySubject(subject: string): SentEmail[] {
  return sentEmails.filter((email) => email.subject.includes(subject));
}

/**
 * Clear sent emails (for test cleanup)
 */
export function clearSentEmails(): void {
  sentEmails.length = 0;
  console.log('🧪 [MOCK RESEND] Sent emails cleared');
}

/**
 * Simulate email delivery failure for next send
 */
export function simulateEmailFailure(reason: string = 'Simulated email failure'): void {
  shouldFailNextEmail = true;
  failureReason = reason;
  console.log('🧪 [MOCK RESEND] Next email will fail:', reason);
}

/**
 * Simulate email delivery (update status to delivered)
 */
export function simulateEmailDelivery(emailId: string): boolean {
  const email = sentEmails.find((e) => e.id === emailId);
  if (email) {
    email.status = 'delivered';
    console.log('🧪 [MOCK RESEND] Email delivered:', emailId);
    return true;
  }
  return false;
}

/**
 * Reset mock state
 */
export function resetMockResend(): void {
  sentEmails.length = 0;
  shouldFailNextEmail = false;
  failureReason = 'Simulated email failure';
  console.log('🧪 [MOCK RESEND] Mock reset');
}

/**
 * Get email count
 */
export function getEmailCount(): number {
  return sentEmails.length;
}

/**
 * Verify email was sent
 */
export function verifyEmailSent(criteria: {
  to?: string;
  subject?: string;
  containsText?: string;
}): boolean {
  return sentEmails.some((email) => {
    if (criteria.to) {
      const toMatch = Array.isArray(email.to)
        ? email.to.includes(criteria.to)
        : email.to === criteria.to;
      if (!toMatch) return false;
    }

    if (criteria.subject && !email.subject.includes(criteria.subject)) {
      return false;
    }

    if (criteria.containsText) {
      const textMatch =
        email.html.includes(criteria.containsText) ||
        (email.text && email.text.includes(criteria.containsText));
      if (!textMatch) return false;
    }

    return true;
  });
}
