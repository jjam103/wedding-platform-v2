import * as fc from 'fast-check';
import { validateExtractedContent, type ContentType } from './aiContentService';

/**
 * Feature: destination-wedding-platform, Property 26: AI Content Schema Validation
 * 
 * For any content extracted by the AI import system from a URL, the extracted data
 * should pass Zod schema validation for the target entity type (activity, accommodation, vendor)
 * before being imported.
 * 
 * Validates: Requirements 21.3
 */

// Arbitraries for generating valid content data

// Helper to generate realistic text strings (never whitespace-only)
const realisticString = (minLength: number, maxLength: number) =>
  fc.lorem({ maxCount: 20 }).map(s => {
    const trimmed = s.trim().substring(0, maxLength);
    // Ensure we have at least minLength non-whitespace characters
    if (trimmed.length >= minLength && trimmed.trim().length > 0) {
      return trimmed;
    }
    // Fallback: generate a string with actual content
    return 'Sample Text '.repeat(Math.ceil(minLength / 12)).substring(0, Math.max(minLength, 10));
  });

const validActivityArbitrary = fc.record({
  name: realisticString(2, 100),
  description: fc.option(fc.lorem({ maxCount: 200 }).map(s => s.substring(0, 2000)), { nil: null }),
  activityType: realisticString(2, 50),
  startTime: fc.date({ min: new Date('2025-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
  endTime: fc.option(
    fc.date({ min: new Date('2025-01-02'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
    { nil: null }
  ),
  capacity: fc.option(fc.integer({ min: 1, max: 500 }), { nil: null }),
  costPerPerson: fc.option(fc.float({ min: 0, max: 10000, noNaN: true }), { nil: null }),
  hostSubsidy: fc.option(fc.float({ min: 0, max: 5000, noNaN: true }), { nil: null }),
  adultsOnly: fc.option(fc.boolean(), { nil: undefined }),
  plusOneAllowed: fc.option(fc.boolean(), { nil: undefined }),
  visibility: fc.option(fc.array(fc.string()), { nil: undefined }),
  status: fc.option(fc.constantFrom('draft' as const, 'published' as const), { nil: undefined }),
  displayOrder: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
}).filter(data => {
  // Ensure endTime is after startTime if both are present
  if (data.endTime && data.startTime) {
    return new Date(data.startTime) <= new Date(data.endTime);
  }
  return true;
});

const validAccommodationArbitrary = fc.record({
  name: realisticString(2, 200),
  description: fc.option(fc.lorem({ maxCount: 500 }).map(s => s.substring(0, 5000)), { nil: null }),
  address: fc.option(fc.lorem({ maxCount: 50 }).map(s => s.substring(0, 500)), { nil: null }),
  status: fc.option(fc.constantFrom('draft' as const, 'published' as const), { nil: undefined }),
});

const validVendorArbitrary = fc.record({
  name: realisticString(2, 100),
  category: fc.constantFrom(
    'photography' as const,
    'flowers' as const,
    'catering' as const,
    'music' as const,
    'transportation' as const,
    'decoration' as const,
    'other' as const
  ),
  contactName: fc.option(fc.lorem({ maxCount: 10 }).map(s => s.substring(0, 100)), { nil: null }),
  email: fc.option(
    fc.tuple(
      fc.stringMatching(/^[a-z0-9]+$/),
      fc.stringMatching(/^[a-z0-9]+$/),
      fc.constantFrom('com', 'org', 'net', 'edu')
    ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`),
    { nil: null }
  ),
  phone: fc.option(fc.stringMatching(/^\+?[0-9]{10,19}$/), { nil: null }),
  pricingModel: fc.constantFrom('flat_rate' as const, 'per_guest' as const, 'tiered' as const),
  baseCost: fc.float({ min: 0, max: 100000, noNaN: true }),
  paymentStatus: fc.option(fc.constantFrom('unpaid' as const, 'partial' as const, 'paid' as const), { nil: undefined }),
  amountPaid: fc.option(fc.float({ min: 0, max: 100000, noNaN: true }), { nil: undefined }),
  notes: fc.option(fc.lorem({ maxCount: 200 }).map(s => s.substring(0, 2000)), { nil: null }),
});

// Arbitraries for generating invalid content data

const invalidActivityArbitrary = fc.oneof(
  // Missing required name
  fc.record({
    activityType: fc.string(),
    startTime: fc.date().map(d => d.toISOString()),
  }),
  // Empty name
  fc.record({
    name: fc.constant(''),
    activityType: fc.string(),
    startTime: fc.date().map(d => d.toISOString()),
  }),
  // Missing required activityType
  fc.record({
    name: fc.string({ minLength: 1 }),
    startTime: fc.date().map(d => d.toISOString()),
  }),
  // Missing required startTime
  fc.record({
    name: fc.string({ minLength: 1 }),
    activityType: fc.string(),
  }),
  // Invalid startTime format
  fc.record({
    name: fc.string({ minLength: 1 }),
    activityType: fc.string(),
    startTime: fc.constant('not-a-date'),
  }),
  // Negative capacity
  fc.record({
    name: fc.string({ minLength: 1 }),
    activityType: fc.string(),
    startTime: fc.date().map(d => d.toISOString()),
    capacity: fc.integer({ max: -1 }),
  }),
  // Negative cost
  fc.record({
    name: fc.string({ minLength: 1 }),
    activityType: fc.string(),
    startTime: fc.date().map(d => d.toISOString()),
    costPerPerson: fc.constant(-100),
  })
);

const invalidAccommodationArbitrary = fc.oneof(
  // Missing required name
  fc.record({
    description: fc.string(),
  }),
  // Empty name
  fc.record({
    name: fc.constant(''),
  }),
  // Name too long
  fc.record({
    name: fc.string({ minLength: 201, maxLength: 300 }),
  }),
  // Description too long
  fc.record({
    name: fc.string({ minLength: 1 }),
    description: fc.string({ minLength: 5001, maxLength: 6000 }),
  })
);

const invalidVendorArbitrary = fc.oneof(
  // Missing required name
  fc.record({
    category: fc.constant('photography' as const),
    pricingModel: fc.constant('flat_rate' as const),
    baseCost: fc.constant(1000),
  }),
  // Empty name
  fc.record({
    name: fc.constant(''),
    category: fc.constant('photography' as const),
    pricingModel: fc.constant('flat_rate' as const),
    baseCost: fc.constant(1000),
  }),
  // Invalid category
  fc.record({
    name: fc.string({ minLength: 1 }),
    category: fc.constant('invalid-category' as any),
    pricingModel: fc.constant('flat_rate' as const),
    baseCost: fc.constant(1000),
  }),
  // Missing required pricingModel
  fc.record({
    name: fc.string({ minLength: 1 }),
    category: fc.constant('photography' as const),
    baseCost: fc.constant(1000),
  }),
  // Negative baseCost
  fc.record({
    name: fc.string({ minLength: 1 }),
    category: fc.constant('photography' as const),
    pricingModel: fc.constant('flat_rate' as const),
    baseCost: fc.constant(-1000),
  }),
  // Invalid email format
  fc.record({
    name: fc.string({ minLength: 1 }),
    category: fc.constant('photography' as const),
    pricingModel: fc.constant('flat_rate' as const),
    baseCost: fc.constant(1000),
    email: fc.constant('not-an-email'),
  })
);

describe('Feature: destination-wedding-platform, Property 26: AI Content Schema Validation', () => {
  describe('Valid content should pass schema validation', () => {
    it('should validate valid activity data', () => {
      fc.assert(
        fc.property(validActivityArbitrary, (activityData) => {
          const result = validateExtractedContent('activity', activityData);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate valid accommodation data', () => {
      fc.assert(
        fc.property(validAccommodationArbitrary, (accommodationData) => {
          const result = validateExtractedContent('accommodation', accommodationData);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate valid vendor data', () => {
      fc.assert(
        fc.property(validVendorArbitrary, (vendorData) => {
          const result = validateExtractedContent('vendor', vendorData);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Invalid content should fail schema validation', () => {
    it('should reject invalid activity data', () => {
      fc.assert(
        fc.property(invalidActivityArbitrary, (activityData) => {
          const result = validateExtractedContent('activity', activityData);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid accommodation data', () => {
      fc.assert(
        fc.property(invalidAccommodationArbitrary, (accommodationData) => {
          const result = validateExtractedContent('accommodation', accommodationData);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid vendor data', () => {
      fc.assert(
        fc.property(invalidVendorArbitrary, (vendorData) => {
          const result = validateExtractedContent('vendor', vendorData);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.code).toBe('VALIDATION_ERROR');
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Content type validation', () => {
    it('should reject unsupported content types', () => {
      fc.assert(
        fc.property(validActivityArbitrary, (activityData) => {
          const result = validateExtractedContent('unsupported' as ContentType, activityData);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.code).toBe('INVALID_CONTENT_TYPE');
          }
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle null and undefined values appropriately', () => {
      const result1 = validateExtractedContent('activity', null);
      expect(result1.success).toBe(false);

      const result2 = validateExtractedContent('activity', undefined);
      expect(result2.success).toBe(false);
    });

    it('should handle empty objects', () => {
      const result = validateExtractedContent('activity', {});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should handle arrays instead of objects', () => {
      const result = validateExtractedContent('activity', []);
      expect(result.success).toBe(false);
    });

    it('should handle primitive values', () => {
      const result1 = validateExtractedContent('activity', 'string');
      expect(result1.success).toBe(false);

      const result2 = validateExtractedContent('activity', 123);
      expect(result2.success).toBe(false);

      const result3 = validateExtractedContent('activity', true);
      expect(result3.success).toBe(false);
    });
  });
});
