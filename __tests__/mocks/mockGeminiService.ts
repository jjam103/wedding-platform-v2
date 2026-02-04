/**
 * Mock Google Gemini AI Service for E2E Testing
 * 
 * This mock service simulates Google Gemini AI operations without making real API calls.
 * It provides realistic responses for testing AI content extraction functionality.
 */

import type { Result } from '@/types';

interface GenerateContentResponse {
  response: {
    text: () => string;
  };
}

interface ExtractedActivity {
  name: string;
  description?: string;
  activityType: string;
  startTime: string;
  endTime?: string;
  capacity?: number;
  costPerPerson?: number;
  adultsOnly?: boolean;
  plusOneAllowed?: boolean;
}

interface ExtractedAccommodation {
  name: string;
  description?: string;
  address?: string;
}

interface ExtractedVendor {
  name: string;
  category: string;
  contactName?: string;
  email?: string;
  phone?: string;
  pricingModel: string;
  baseCost: number;
  notes?: string;
}

// Track AI requests for debugging
const aiRequests: Array<{
  prompt: string;
  timestamp: number;
  response: string;
}> = [];

// Simulate AI failures for testing
let shouldFailNextRequest = false;
let failureReason = 'Simulated AI failure';

/**
 * Mock Gemini model
 */
class MockGeminiModel {
  async generateContent(prompt: string): Promise<GenerateContentResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check for simulated failure
    if (shouldFailNextRequest) {
      shouldFailNextRequest = false;
      console.log('🧪 [MOCK GEMINI] Request failed (simulated):', failureReason);
      throw new Error(failureReason);
    }

    // Determine content type from prompt
    let response: string;
    if (prompt.includes('Content Type: activity')) {
      response = this.generateActivityResponse();
    } else if (prompt.includes('Content Type: accommodation')) {
      response = this.generateAccommodationResponse();
    } else if (prompt.includes('Content Type: vendor')) {
      response = this.generateVendorResponse();
    } else {
      response = '{"error": "Unknown content type"}';
    }

    // Track request
    aiRequests.push({
      prompt: prompt.substring(0, 200) + '...',
      timestamp: Date.now(),
      response,
    });

    console.log('🧪 [MOCK GEMINI] Content generated:', {
      contentType: this.extractContentType(prompt),
      responseLength: response.length,
    });

    return {
      response: {
        text: () => response,
      },
    };
  }

  private extractContentType(prompt: string): string {
    if (prompt.includes('Content Type: activity')) return 'activity';
    if (prompt.includes('Content Type: accommodation')) return 'accommodation';
    if (prompt.includes('Content Type: vendor')) return 'vendor';
    return 'unknown';
  }

  private generateActivityResponse(): string {
    const activity: ExtractedActivity = {
      name: 'Mock Activity',
      description: 'This is a mock activity extracted by the AI service for testing purposes.',
      activityType: 'activity',
      startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
      capacity: 50,
      costPerPerson: 75.0,
      adultsOnly: false,
      plusOneAllowed: true,
    };

    return JSON.stringify(activity, null, 2);
  }

  private generateAccommodationResponse(): string {
    const accommodation: ExtractedAccommodation = {
      name: 'Mock Hotel',
      description: 'This is a mock accommodation extracted by the AI service for testing purposes.',
      address: '123 Test Street, Test City, TC 12345',
    };

    return JSON.stringify(accommodation, null, 2);
  }

  private generateVendorResponse(): string {
    const vendor: ExtractedVendor = {
      name: 'Mock Vendor',
      category: 'catering',
      contactName: 'John Doe',
      email: 'john@mockvendor.com',
      phone: '+15551234567',
      pricingModel: 'per_guest',
      baseCost: 50.0,
      notes: 'This is a mock vendor extracted by the AI service for testing purposes.',
    };

    return JSON.stringify(vendor, null, 2);
  }
}

/**
 * Mock GoogleGenerativeAI class
 */
export class MockGoogleGenerativeAI {
  constructor(apiKey: string) {
    console.log('🧪 [MOCK GEMINI] Client created with API key:', apiKey.substring(0, 10) + '...');
  }

  getGenerativeModel(config: { model: string }): MockGeminiModel {
    console.log('🧪 [MOCK GEMINI] Model initialized:', config.model);
    return new MockGeminiModel();
  }
}

/**
 * Get all AI requests (for test verification)
 */
export function getAIRequests() {
  return [...aiRequests];
}

/**
 * Get AI request count
 */
export function getAIRequestCount(): number {
  return aiRequests.length;
}

/**
 * Clear AI requests (for test cleanup)
 */
export function clearAIRequests(): void {
  aiRequests.length = 0;
  console.log('🧪 [MOCK GEMINI] AI requests cleared');
}

/**
 * Simulate AI failure for next request
 */
export function simulateAIFailure(reason: string = 'Simulated AI failure'): void {
  shouldFailNextRequest = true;
  failureReason = reason;
  console.log('🧪 [MOCK GEMINI] Next request will fail:', reason);
}

/**
 * Reset mock state
 */
export function resetMockGemini(): void {
  aiRequests.length = 0;
  shouldFailNextRequest = false;
  failureReason = 'Simulated AI failure';
  console.log('🧪 [MOCK GEMINI] Mock reset');
}

/**
 * Verify AI request was made
 */
export function verifyAIRequest(criteria: {
  contentType?: string;
  containsText?: string;
}): boolean {
  return aiRequests.some((req) => {
    if (criteria.contentType && !req.prompt.includes(`Content Type: ${criteria.contentType}`)) {
      return false;
    }

    if (criteria.containsText && !req.prompt.includes(criteria.containsText)) {
      return false;
    }

    return true;
  });
}

/**
 * Get last AI request
 */
export function getLastAIRequest() {
  return aiRequests[aiRequests.length - 1];
}

/**
 * Set custom response for next request
 */
let customNextResponse: string | null = null;

export function setCustomResponse(response: string): void {
  customNextResponse = response;
  console.log('🧪 [MOCK GEMINI] Custom response set for next request');
}
