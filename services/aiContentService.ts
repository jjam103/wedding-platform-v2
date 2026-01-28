import { GoogleGenerativeAI } from '@google/generative-ai';
import { sanitizeInput, sanitizeRichText } from "../utils/sanitization";
import { z } from 'zod';
import type { Result } from '../types';
import { createActivitySchema, type CreateActivityDTO } from '../schemas/activitySchemas';
import { createAccommodationSchema, type CreateAccommodationDTO } from '../schemas/accommodationSchemas';
import { createVendorSchema, type CreateVendorDTO } from '../schemas/vendorSchemas';

/**
 * Supported content types for AI extraction.
 */
export type ContentType = 'activity' | 'accommodation' | 'vendor';

/**
 * URL validation schema.
 */
const urlSchema = z.string().url('Invalid URL format').refine(
  (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  },
  { message: 'URL must use HTTP or HTTPS protocol' }
);

/**
 * AI extraction request schema.
 */
const extractionRequestSchema = z.object({
  url: urlSchema,
  contentType: z.enum(['activity', 'accommodation', 'vendor']),
  additionalContext: z.string().max(500).optional(),
});

export type ExtractionRequestDTO = z.infer<typeof extractionRequestSchema>;

/**
 * Extracted content with preview data.
 */
export interface ExtractedContent<T> {
  contentType: ContentType;
  sourceUrl: string;
  extractedData: T;
  rawResponse: string;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

/**
 * Sanitizes extracted text content to prevent XSS and injection attacks.
 * 
 * @param input - Raw text input from AI extraction
 * @returns Sanitized text safe for storage
 */
export function sanitizeExtractedText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return sanitizeInput(input);
}

/**
 * Sanitizes extracted rich text content allowing safe HTML.
 * 
 * @param html - Raw HTML input from AI extraction
 * @returns Sanitized HTML safe for storage
 */
export function sanitizeExtractedRichText(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return sanitizeRichText(html);
}

/**
 * Fetches content from a URL with timeout and size limits.
 * 
 * @param url - URL to fetch content from
 * @returns Result containing the fetched HTML content
 */
async function fetchUrlContent(url: string): Promise<Result<string>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WeddingPlatform/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        },
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      return {
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'URL must return HTML content',
        },
      };
    }

    // Limit content size to 1MB
    const text = await response.text();
    if (text.length > 1024 * 1024) {
      return {
        success: false,
        error: {
          code: 'CONTENT_TOO_LARGE',
          message: 'Content exceeds 1MB limit',
        },
      };
    }

    return { success: true, data: text };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timed out after 30 seconds',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch URL',
      },
    };
  }
}

/**
 * Generates a prompt for the AI model based on content type.
 * 
 * @param contentType - Type of content to extract
 * @param htmlContent - HTML content from the URL
 * @param additionalContext - Optional additional context
 * @returns Formatted prompt for the AI model
 */
function generateExtractionPrompt(
  contentType: ContentType,
  htmlContent: string,
  additionalContext?: string
): string {
  const basePrompt = `Extract structured data from the following HTML content for a destination wedding management system.

Content Type: ${contentType}

${additionalContext ? `Additional Context: ${additionalContext}\n\n` : ''}`;

  const schemas = {
    activity: `
Extract the following fields in JSON format:
{
  "name": "Activity name (required, max 100 chars)",
  "description": "Detailed description (optional, max 2000 chars)",
  "activityType": "Type of activity (required)",
  "startTime": "ISO 8601 datetime (required)",
  "endTime": "ISO 8601 datetime (optional)",
  "capacity": "Maximum participants (optional, positive integer)",
  "costPerPerson": "Cost per person in USD (optional, non-negative number)",
  "adultsOnly": "Boolean indicating if adults only (optional)",
  "plusOneAllowed": "Boolean indicating if plus ones allowed (optional)"
}`,
    accommodation: `
Extract the following fields in JSON format:
{
  "name": "Accommodation name (required, max 200 chars)",
  "description": "Detailed description (optional, max 5000 chars)",
  "address": "Physical address (optional, max 500 chars)"
}`,
    vendor: `
Extract the following fields in JSON format:
{
  "name": "Vendor name (required, max 100 chars)",
  "category": "One of: photography, flowers, catering, music, transportation, decoration, other (required)",
  "contactName": "Contact person name (optional, max 100 chars)",
  "email": "Contact email (optional, valid email format)",
  "phone": "Contact phone (optional, max 20 chars)",
  "pricingModel": "One of: flat_rate, per_guest, tiered (required)",
  "baseCost": "Base cost in USD (required, non-negative number)",
  "notes": "Additional notes (optional, max 2000 chars)"
}`,
  };

  return `${basePrompt}${schemas[contentType]}

HTML Content:
${htmlContent.substring(0, 10000)} ${htmlContent.length > 10000 ? '...(truncated)' : ''}

Return ONLY valid JSON matching the schema above. Do not include any explanatory text.`;
}

/**
 * Parses and validates AI response against the appropriate schema.
 * 
 * @param contentType - Type of content extracted
 * @param aiResponse - Raw AI response text
 * @returns Result containing validated and sanitized data
 */
function parseAndValidateResponse<T>(
  contentType: ContentType,
  aiResponse: string
): Result<{ data: T; warnings: string[] }> {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = aiResponse.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);
    const warnings: string[] = [];

    // Sanitize all string fields
    const sanitized = sanitizeExtractedData(parsed, warnings);

    // Validate against appropriate schema
    let validation;
    switch (contentType) {
      case 'activity':
        validation = createActivitySchema.safeParse(sanitized);
        break;
      case 'accommodation':
        validation = createAccommodationSchema.safeParse(sanitized);
        break;
      case 'vendor':
        validation = createVendorSchema.safeParse(sanitized);
        break;
      default:
        return {
          success: false,
          error: {
            code: 'INVALID_CONTENT_TYPE',
            message: `Unsupported content type: ${contentType}`,
          },
        };
    }

    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Extracted data failed schema validation',
          details: validation.error.issues,
        },
      };
    }

    return {
      success: true,
      data: {
        data: validation.data as T,
        warnings,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to parse AI response',
      },
    };
  }
}

/**
 * Recursively sanitizes all string fields in extracted data.
 * 
 * @param data - Raw extracted data object
 * @param warnings - Array to collect sanitization warnings
 * @returns Sanitized data object
 */
function sanitizeExtractedData(data: any, warnings: string[]): any {
  if (typeof data === 'string') {
    const sanitized = sanitizeExtractedText(data);
    if (sanitized !== data) {
      warnings.push('Some content was sanitized to remove potentially dangerous patterns');
    }
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeExtractedData(item, warnings));
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeExtractedData(value, warnings);
    }
    return sanitized;
  }

  return data;
}

/**
 * Determines confidence level based on validation and content quality.
 * 
 * @param data - Validated data
 * @param warnings - Validation warnings
 * @returns Confidence level
 */
function determineConfidence(data: any, warnings: string[]): 'high' | 'medium' | 'low' {
  if (warnings.length > 2) {
    return 'low';
  }

  // Check for required fields completeness
  const hasRequiredFields = data.name && data.name.length > 0;
  const hasOptionalFields = Object.keys(data).length > 3;

  if (hasRequiredFields && hasOptionalFields && warnings.length === 0) {
    return 'high';
  }

  if (hasRequiredFields) {
    return 'medium';
  }

  return 'low';
}

/**
 * Extracts structured content from a URL using Google Gemini AI.
 * 
 * @param request - Extraction request with URL and content type
 * @returns Result containing extracted and validated content with preview
 * 
 * @example
 * const result = await extractContentFromUrl({
 *   url: 'https://example.com/venue',
 *   contentType: 'accommodation',
 * });
 * 
 * if (result.success) {
 *   console.log('Extracted:', result.data.extractedData);
 *   console.log('Confidence:', result.data.confidence);
 * }
 */
export async function extractContentFromUrl<T = CreateActivityDTO | CreateAccommodationDTO | CreateVendorDTO>(
  request: ExtractionRequestDTO
): Promise<Result<ExtractedContent<T>>> {
  try {
    // 1. Validate request
    const validation = extractionRequestSchema.safeParse(request);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid extraction request',
          details: validation.error.issues,
        },
      };
    }

    const { url, contentType, additionalContext } = validation.data;

    // 2. Fetch URL content
    const fetchResult = await fetchUrlContent(url);
    if (!fetchResult.success) {
      return fetchResult as Result<ExtractedContent<T>>;
    }

    // 3. Initialize Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'GEMINI_API_KEY environment variable is not set',
        },
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // 4. Generate prompt and extract content
    const prompt = generateExtractionPrompt(contentType, fetchResult.data, additionalContext);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // 5. Parse and validate response
    const parseResult = parseAndValidateResponse<T>(contentType, aiResponse);
    if (!parseResult.success) {
      return parseResult as Result<ExtractedContent<T>>;
    }

    const { data: extractedData, warnings } = parseResult.data;

    // 6. Determine confidence level
    const confidence = determineConfidence(extractedData, warnings);

    return {
      success: true,
      data: {
        contentType,
        sourceUrl: url,
        extractedData,
        rawResponse: aiResponse,
        confidence,
        warnings,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: error instanceof Error ? error.message : 'AI extraction failed',
        details: error,
      },
    };
  }
}

/**
 * Validates extracted content against the appropriate schema without importing.
 * Useful for preview before import.
 * 
 * @param contentType - Type of content
 * @param data - Data to validate
 * @returns Result indicating if data is valid
 */
export function validateExtractedContent(
  contentType: ContentType,
  data: unknown
): Result<void> {
  try {
    let validation;
    switch (contentType) {
      case 'activity':
        validation = createActivitySchema.safeParse(data);
        break;
      case 'accommodation':
        validation = createAccommodationSchema.safeParse(data);
        break;
      case 'vendor':
        validation = createVendorSchema.safeParse(data);
        break;
      default:
        return {
          success: false,
          error: {
            code: 'INVALID_CONTENT_TYPE',
            message: `Unsupported content type: ${contentType}`,
          },
        };
    }

    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Content validation failed',
          details: validation.error.issues,
        },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Validation failed',
      },
    };
  }
}
