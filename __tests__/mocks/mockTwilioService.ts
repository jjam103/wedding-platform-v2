/**
 * Mock Twilio SMS Service for E2E Testing
 * 
 * This mock service simulates Twilio SMS operations without sending real SMS messages.
 * It provides realistic responses for testing SMS functionality.
 */

import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';

interface SMSMessage {
  to: string;
  from: string;
  body: string;
  sid: string;
  timestamp: number;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
}

// Track sent SMS messages for debugging and verification
const sentMessages: SMSMessage[] = [];

// Simulate SMS delivery failures for testing
let shouldFailNextSMS = false;
let failureReason = 'Simulated SMS failure';

/**
 * Mock Twilio client
 */
export class MockTwilioClient {
  messages = {
    /**
     * Mock create SMS message method
     */
    create: async (params: {
      to: string;
      from: string;
      body: string;
    }): Promise<{ sid: string; status: string }> => {
      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Check for simulated failure
        if (shouldFailNextSMS) {
          shouldFailNextSMS = false;
          console.log('🧪 [MOCK TWILIO] SMS failed (simulated):', {
            to: params.to,
            reason: failureReason,
          });

          throw new Error(failureReason);
        }

        // Generate mock message SID
        const sid = `SM${Date.now()}${Math.random().toString(36).substring(7)}`;

        // Track sent message
        const message: SMSMessage = {
          to: params.to,
          from: params.from,
          body: params.body,
          sid,
          timestamp: Date.now(),
          status: 'sent',
        };
        sentMessages.push(message);

        console.log('🧪 [MOCK TWILIO] SMS sent:', {
          sid,
          to: params.to,
          from: params.from,
          bodyLength: params.body.length,
        });

        return {
          sid,
          status: 'sent',
        };
      } catch (error) {
        throw error;
      }
    },
  };
}

/**
 * Mock Twilio factory function
 */
export function mockTwilio(accountSid: string, authToken: string): MockTwilioClient {
  console.log('🧪 [MOCK TWILIO] Client created with:', {
    accountSid: accountSid.substring(0, 10) + '...',
    authToken: '***',
  });
  return new MockTwilioClient();
}

/**
 * Get all sent SMS messages (for test verification)
 */
export function getSentMessages(): SMSMessage[] {
  return [...sentMessages];
}

/**
 * Get sent messages by recipient
 */
export function getSentMessagesByRecipient(recipient: string): SMSMessage[] {
  return sentMessages.filter((msg) => msg.to === recipient);
}

/**
 * Get sent messages containing text
 */
export function getSentMessagesContaining(text: string): SMSMessage[] {
  return sentMessages.filter((msg) => msg.body.includes(text));
}

/**
 * Clear sent messages (for test cleanup)
 */
export function clearSentMessages(): void {
  sentMessages.length = 0;
  console.log('🧪 [MOCK TWILIO] Sent messages cleared');
}

/**
 * Simulate SMS delivery failure for next send
 */
export function simulateSMSFailure(reason: string = 'Simulated SMS failure'): void {
  shouldFailNextSMS = true;
  failureReason = reason;
  console.log('🧪 [MOCK TWILIO] Next SMS will fail:', reason);
}

/**
 * Simulate SMS delivery (update status to delivered)
 */
export function simulateSMSDelivery(sid: string): boolean {
  const message = sentMessages.find((m) => m.sid === sid);
  if (message) {
    message.status = 'delivered';
    console.log('🧪 [MOCK TWILIO] SMS delivered:', sid);
    return true;
  }
  return false;
}

/**
 * Reset mock state
 */
export function resetMockTwilio(): void {
  sentMessages.length = 0;
  shouldFailNextSMS = false;
  failureReason = 'Simulated SMS failure';
  console.log('🧪 [MOCK TWILIO] Mock reset');
}

/**
 * Get message count
 */
export function getMessageCount(): number {
  return sentMessages.length;
}

/**
 * Verify SMS was sent
 */
export function verifySMSSent(criteria: {
  to?: string;
  containsText?: string;
}): boolean {
  return sentMessages.some((msg) => {
    if (criteria.to && msg.to !== criteria.to) {
      return false;
    }

    if (criteria.containsText && !msg.body.includes(criteria.containsText)) {
      return false;
    }

    return true;
  });
}

/**
 * Get last sent message
 */
export function getLastSentMessage(): SMSMessage | undefined {
  return sentMessages[sentMessages.length - 1];
}
