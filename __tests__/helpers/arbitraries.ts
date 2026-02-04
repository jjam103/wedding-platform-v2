/**
 * Property-Based Test Arbitraries
 * 
 * Fast-check arbitraries for generating random valid test data.
 * Used for property-based integration tests to validate entity creation.
 * 
 * Requirements: 2.5 - Property-based integration tests
 */

import * as fc from 'fast-check';
import type { Guest } from '@/schemas/guestSchemas';
import type { Event } from '@/schemas/eventSchemas';
import type { Activity } from '@/schemas/activitySchemas';
import type { Vendor } from '@/schemas/vendorSchemas';
import type { Accommodation } from '@/schemas/accommodationSchemas';
import type { Location } from '@/schemas/locationSchemas';

/**
 * Generate a valid UUID v4
 */
export const uuidArbitrary = fc.uuid();

/**
 * Generate a valid ISO 8601 datetime string
 */
export const isoDateTimeArbitrary = fc
  .date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') })
  .map((date) => date.toISOString());

/**
 * Generate a valid email address
 * Uses a more restrictive pattern to ensure Zod validation passes
 */
export const emailArbitrary = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9][a-z0-9_-]{0,20}$/),
    fc.constantFrom('example.com', 'test.com', 'email.com', 'domain.com')
  )
  .map(([local, domain]) => `${local}@${domain}`);

/**
 * Generate a valid phone number
 */
export const phoneArbitrary = fc
  .tuple(fc.integer({ min: 100, max: 999 }), fc.integer({ min: 100, max: 999 }), fc.integer({ min: 1000, max: 9999 }))
  .map(([area, prefix, line]) => `${area}-${prefix}-${line}`);

/**
 * Generate a valid guest name (1-50 characters, no special chars)
 */
export const nameArbitrary = fc
  .stringMatching(/^[A-Za-z][A-Za-z\s'-]{0,48}[A-Za-z]$/)
  .filter((s) => s.length >= 1 && s.length <= 50);

/**
 * Generate a valid description (up to 2000 characters)
 */
export const descriptionArbitrary = fc
  .string({ minLength: 0, maxLength: 2000 })
  .map((s) => s.trim() || null);

/**
 * Generate a valid short description (up to 500 characters)
 */
export const shortDescriptionArbitrary = fc
  .string({ minLength: 0, maxLength: 500 })
  .map((s) => s.trim() || null);

/**
 * Generate a valid address (up to 500 characters)
 */
export const addressArbitrary = fc
  .string({ minLength: 10, maxLength: 500 })
  .map((s) => s.trim());

/**
 * Generate a valid notes field (up to 1000 characters)
 */
export const notesArbitrary = fc
  .string({ minLength: 0, maxLength: 1000 })
  .map((s) => s.trim() || null);

/**
 * Arbitrary for valid Guest entity
 * 
 * Generates guests with valid data that passes Zod validation.
 * All required fields are populated with realistic values.
 */
export const validGuestArbitrary = fc.record({
  id: uuidArbitrary,
  groupId: uuidArbitrary,
  firstName: nameArbitrary,
  lastName: nameArbitrary,
  email: fc.option(emailArbitrary, { nil: null }),
  phone: fc.option(phoneArbitrary, { nil: null }),
  ageType: fc.constantFrom('adult', 'child', 'senior'),
  guestType: fc.constantFrom('wedding_party', 'wedding_guest', 'prewedding_only', 'postwedding_only'),
  dietaryRestrictions: fc.option(shortDescriptionArbitrary, { nil: null }),
  plusOneName: fc.option(nameArbitrary, { nil: null }),
  plusOneAttending: fc.boolean(),
  arrivalDate: fc.option(isoDateTimeArbitrary, { nil: null }),
  departureDate: fc.option(isoDateTimeArbitrary, { nil: null }),
  airportCode: fc.option(fc.constantFrom('SJO', 'LIR', 'Other'), { nil: null }),
  flightNumber: fc.option(
    fc.string({ minLength: 2, maxLength: 10 }).map((s) => s.toUpperCase()),
    { nil: null }
  ),
  invitationSent: fc.boolean(),
  invitationSentDate: fc.option(isoDateTimeArbitrary, { nil: null }),
  rsvpDeadline: fc.option(isoDateTimeArbitrary, { nil: null }),
  notes: notesArbitrary,
  createdAt: isoDateTimeArbitrary,
  updatedAt: isoDateTimeArbitrary,
}) as fc.Arbitrary<Guest>;

/**
 * Arbitrary for valid Event entity
 * 
 * Generates events with valid data that passes Zod validation.
 * Ensures endDate is after startDate when both are present.
 */
export const validEventArbitrary = fc
  .record({
    id: uuidArbitrary,
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: descriptionArbitrary,
    eventType: fc.constantFrom('ceremony', 'reception', 'pre_wedding', 'post_wedding'),
    locationId: fc.option(uuidArbitrary, { nil: null }),
    startDate: isoDateTimeArbitrary,
    rsvpRequired: fc.boolean(),
    rsvpDeadline: fc.option(isoDateTimeArbitrary, { nil: null }),
    visibility: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
    status: fc.constantFrom('draft', 'published'),
    createdAt: isoDateTimeArbitrary,
    updatedAt: isoDateTimeArbitrary,
  })
  .chain((event) =>
    fc.constant(event).chain((e) =>
      fc.record({
        id: fc.constant(e.id),
        name: fc.constant(e.name),
        description: fc.constant(e.description),
        eventType: fc.constant(e.eventType),
        locationId: fc.constant(e.locationId),
        startDate: fc.constant(e.startDate),
        rsvpRequired: fc.constant(e.rsvpRequired),
        rsvpDeadline: fc.constant(e.rsvpDeadline),
        visibility: fc.constant(e.visibility),
        status: fc.constant(e.status),
        createdAt: fc.constant(e.createdAt),
        updatedAt: fc.constant(e.updatedAt),
        endDate: fc.option(
          fc
            .date({ min: new Date(e.startDate), max: new Date('2026-12-31') })
            .map((date) => date.toISOString()),
          { nil: null }
        ),
      })
    )
  ) as fc.Arbitrary<Event>;

/**
 * Arbitrary for valid Activity entity
 * 
 * Generates activities with valid data that passes Zod validation.
 * Ensures endTime is after startTime when both are present.
 * Ensures hostSubsidy <= costPerPerson when both are present.
 */
export const validActivityArbitrary = fc
  .record({
    id: uuidArbitrary,
    eventId: fc.option(uuidArbitrary, { nil: null }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: descriptionArbitrary,
    activityType: fc.constantFrom('ceremony', 'reception', 'meal', 'transport', 'activity'),
    locationId: fc.option(uuidArbitrary, { nil: null }),
    startTime: isoDateTimeArbitrary,
    capacity: fc.option(fc.integer({ min: 1, max: 500 }), { nil: null }),
    costPerPerson: fc.option(fc.float({ min: 0, max: 10000, noNaN: true }), { nil: null }),
    adultsOnly: fc.boolean(),
    plusOneAllowed: fc.boolean(),
    visibility: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
    status: fc.constantFrom('draft', 'published'),
    displayOrder: fc.integer({ min: 0, max: 1000 }),
    createdAt: isoDateTimeArbitrary,
    updatedAt: isoDateTimeArbitrary,
  })
  .chain((activity) =>
    fc.constant(activity).chain((a) =>
      fc.record({
        id: fc.constant(a.id),
        eventId: fc.constant(a.eventId),
        name: fc.constant(a.name),
        description: fc.constant(a.description),
        activityType: fc.constant(a.activityType),
        locationId: fc.constant(a.locationId),
        startTime: fc.constant(a.startTime),
        capacity: fc.constant(a.capacity),
        costPerPerson: fc.constant(a.costPerPerson),
        adultsOnly: fc.constant(a.adultsOnly),
        plusOneAllowed: fc.constant(a.plusOneAllowed),
        visibility: fc.constant(a.visibility),
        status: fc.constant(a.status),
        displayOrder: fc.constant(a.displayOrder),
        createdAt: fc.constant(a.createdAt),
        updatedAt: fc.constant(a.updatedAt),
        endTime: fc.option(
          fc
            .date({ min: new Date(a.startTime), max: new Date('2026-12-31') })
            .map((date) => date.toISOString()),
          { nil: null }
        ),
        hostSubsidy: fc.option(
          a.costPerPerson !== null
            ? fc.float({ min: 0, max: a.costPerPerson, noNaN: true })
            : fc.float({ min: 0, max: 1000, noNaN: true }),
          { nil: null }
        ),
      })
    )
  ) as fc.Arbitrary<Activity>;

/**
 * Arbitrary for valid Vendor entity
 * 
 * Generates vendors with valid data that passes Zod validation.
 * Ensures amountPaid <= baseCost and name is not whitespace-only.
 */
export const validVendorArbitrary = fc
  .record({
    id: uuidArbitrary,
    name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    category: fc.constantFrom('photography', 'flowers', 'catering', 'music', 'transportation', 'decoration', 'other'),
    contactName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    email: fc.option(emailArbitrary, { nil: null }),
    phone: fc.option(phoneArbitrary, { nil: null }),
    pricingModel: fc.constantFrom('flat_rate', 'per_guest', 'tiered'),
    baseCost: fc.float({ min: 0, max: 100000, noNaN: true }),
    paymentStatus: fc.constantFrom('unpaid', 'partial', 'paid'),
    notes: descriptionArbitrary,
    createdAt: isoDateTimeArbitrary,
    updatedAt: isoDateTimeArbitrary,
  })
  .chain((vendor) =>
    fc.constant(vendor).chain((v) =>
      fc.record({
        id: fc.constant(v.id),
        name: fc.constant(v.name),
        category: fc.constant(v.category),
        contactName: fc.constant(v.contactName),
        email: fc.constant(v.email),
        phone: fc.constant(v.phone),
        pricingModel: fc.constant(v.pricingModel),
        baseCost: fc.constant(v.baseCost),
        paymentStatus: fc.constant(v.paymentStatus),
        notes: fc.constant(v.notes),
        createdAt: fc.constant(v.createdAt),
        updatedAt: fc.constant(v.updatedAt),
        amountPaid: fc.float({ min: 0, max: v.baseCost, noNaN: true }),
      })
    )
  ) as fc.Arbitrary<Vendor>;

/**
 * Arbitrary for valid Accommodation entity
 * 
 * Generates accommodations with valid data that passes Zod validation.
 */
export const validAccommodationArbitrary = fc.record({
  id: uuidArbitrary,
  name: fc.string({ minLength: 1, maxLength: 200 }),
  locationId: fc.option(uuidArbitrary, { nil: null }),
  description: fc.option(fc.string({ minLength: 0, maxLength: 5000 }), { nil: null }),
  address: fc.option(addressArbitrary, { nil: null }),
  status: fc.constantFrom('draft', 'published'),
  createdAt: isoDateTimeArbitrary,
  updatedAt: isoDateTimeArbitrary,
}) as fc.Arbitrary<Accommodation>;

/**
 * Arbitrary for valid Location entity
 * 
 * Generates locations with valid data that passes Zod validation.
 * Coordinates are within valid lat/lng ranges.
 */
export const validLocationArbitrary = fc.record({
  id: uuidArbitrary,
  name: fc.string({ minLength: 1, maxLength: 200 }),
  parentLocationId: fc.option(uuidArbitrary, { nil: null }),
  address: fc.option(addressArbitrary, { nil: null }),
  coordinates: fc.option(
    fc.record({
      lat: fc.float({ min: -90, max: 90, noNaN: true }),
      lng: fc.float({ min: -180, max: 180, noNaN: true }),
    }),
    { nil: null }
  ),
  description: descriptionArbitrary,
  createdAt: isoDateTimeArbitrary,
}) as fc.Arbitrary<Location>;

/**
 * Arbitrary for creating a valid guest (DTO format)
 * 
 * Generates data suitable for createGuestSchema validation.
 * Omits id, createdAt, updatedAt as these are generated by the database.
 */
export const createGuestDTOArbitrary = fc.record({
  groupId: uuidArbitrary,
  firstName: nameArbitrary,
  lastName: nameArbitrary,
  email: fc.option(emailArbitrary, { nil: null }),
  phone: fc.option(phoneArbitrary, { nil: null }),
  ageType: fc.constantFrom('adult', 'child', 'senior'),
  guestType: fc.constantFrom('wedding_party', 'wedding_guest', 'prewedding_only', 'postwedding_only'),
  dietaryRestrictions: fc.option(shortDescriptionArbitrary, { nil: null }),
  plusOneName: fc.option(nameArbitrary, { nil: null }),
  plusOneAttending: fc.boolean(),
  arrivalDate: fc.option(isoDateTimeArbitrary, { nil: null }),
  departureDate: fc.option(isoDateTimeArbitrary, { nil: null }),
  airportCode: fc.option(fc.constantFrom('SJO', 'LIR', 'Other'), { nil: null }),
  flightNumber: fc.option(
    fc.string({ minLength: 2, maxLength: 10 }).map((s) => s.toUpperCase()),
    { nil: null }
  ),
  invitationSent: fc.boolean(),
  invitationSentDate: fc.option(isoDateTimeArbitrary, { nil: null }),
  rsvpDeadline: fc.option(isoDateTimeArbitrary, { nil: null }),
  notes: notesArbitrary,
});

/**
 * Arbitrary for creating a valid event (DTO format)
 * 
 * Generates data suitable for createEventSchema validation.
 * Ensures endDate is after startDate when both are present.
 */
export const createEventDTOArbitrary = fc
  .record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: descriptionArbitrary,
    eventType: fc.constantFrom('ceremony', 'reception', 'pre_wedding', 'post_wedding'),
    locationId: fc.option(uuidArbitrary, { nil: null }),
    startDate: isoDateTimeArbitrary,
    rsvpRequired: fc.boolean(),
    rsvpDeadline: fc.option(isoDateTimeArbitrary, { nil: null }),
    visibility: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
    status: fc.constantFrom('draft', 'published'),
  })
  .chain((event) =>
    fc.constant(event).chain((e) =>
      fc.record({
        name: fc.constant(e.name),
        description: fc.constant(e.description),
        eventType: fc.constant(e.eventType),
        locationId: fc.constant(e.locationId),
        startDate: fc.constant(e.startDate),
        rsvpRequired: fc.constant(e.rsvpRequired),
        rsvpDeadline: fc.constant(e.rsvpDeadline),
        visibility: fc.constant(e.visibility),
        status: fc.constant(e.status),
        endDate: fc.option(
          fc
            .date({ min: new Date(e.startDate), max: new Date('2026-12-31') })
            .map((date) => date.toISOString()),
          { nil: null }
        ),
      })
    )
  );

/**
 * Arbitrary for creating a valid activity (DTO format)
 * 
 * Generates data suitable for createActivitySchema validation.
 * Ensures endTime is after startTime and hostSubsidy <= costPerPerson.
 */
export const createActivityDTOArbitrary = fc
  .record({
    eventId: fc.option(uuidArbitrary, { nil: null }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: descriptionArbitrary,
    activityType: fc.constantFrom('ceremony', 'reception', 'meal', 'transport', 'activity'),
    locationId: fc.option(uuidArbitrary, { nil: null }),
    startTime: isoDateTimeArbitrary,
    capacity: fc.option(fc.integer({ min: 1, max: 500 }), { nil: null }),
    costPerPerson: fc.option(fc.float({ min: 0, max: 10000, noNaN: true }), { nil: null }),
    adultsOnly: fc.boolean(),
    plusOneAllowed: fc.boolean(),
    visibility: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
    status: fc.constantFrom('draft', 'published'),
    displayOrder: fc.integer({ min: 0, max: 1000 }),
  })
  .chain((activity) =>
    fc.constant(activity).chain((a) =>
      fc.record({
        eventId: fc.constant(a.eventId),
        name: fc.constant(a.name),
        description: fc.constant(a.description),
        activityType: fc.constant(a.activityType),
        locationId: fc.constant(a.locationId),
        startTime: fc.constant(a.startTime),
        capacity: fc.constant(a.capacity),
        costPerPerson: fc.constant(a.costPerPerson),
        adultsOnly: fc.constant(a.adultsOnly),
        plusOneAllowed: fc.constant(a.plusOneAllowed),
        visibility: fc.constant(a.visibility),
        status: fc.constant(a.status),
        displayOrder: fc.constant(a.displayOrder),
        endTime: fc.option(
          fc
            .date({ min: new Date(a.startTime), max: new Date('2026-12-31') })
            .map((date) => date.toISOString()),
          { nil: null }
        ),
        hostSubsidy: fc.option(
          a.costPerPerson !== null
            ? fc.float({ min: 0, max: a.costPerPerson, noNaN: true })
            : fc.float({ min: 0, max: 1000, noNaN: true }),
          { nil: null }
        ),
      })
    )
  );

/**
 * Arbitrary for creating a valid vendor (DTO format)
 * 
 * Generates data suitable for createVendorSchema validation.
 * Ensures amountPaid <= baseCost and name is not whitespace-only.
 */
export const createVendorDTOArbitrary = fc
  .record({
    name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    category: fc.constantFrom('photography', 'flowers', 'catering', 'music', 'transportation', 'decoration', 'other'),
    contactName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    email: fc.option(emailArbitrary, { nil: null }),
    phone: fc.option(phoneArbitrary, { nil: null }),
    pricingModel: fc.constantFrom('flat_rate', 'per_guest', 'tiered'),
    baseCost: fc.float({ min: 0, max: 100000, noNaN: true }),
    paymentStatus: fc.constantFrom('unpaid', 'partial', 'paid'),
    notes: descriptionArbitrary,
  })
  .chain((vendor) =>
    fc.constant(vendor).chain((v) =>
      fc.record({
        name: fc.constant(v.name),
        category: fc.constant(v.category),
        contactName: fc.constant(v.contactName),
        email: fc.constant(v.email),
        phone: fc.constant(v.phone),
        pricingModel: fc.constant(v.pricingModel),
        baseCost: fc.constant(v.baseCost),
        paymentStatus: fc.constant(v.paymentStatus),
        notes: fc.constant(v.notes),
        amountPaid: fc.float({ min: 0, max: v.baseCost, noNaN: true }),
      })
    )
  );

/**
 * Arbitrary for creating a valid accommodation (DTO format)
 * 
 * Generates data suitable for createAccommodationSchema validation.
 */
export const createAccommodationDTOArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 200 }),
  locationId: fc.option(uuidArbitrary, { nil: null }),
  description: fc.option(fc.string({ minLength: 0, maxLength: 5000 }), { nil: null }),
  address: fc.option(addressArbitrary, { nil: null }),
  status: fc.constantFrom('draft', 'published'),
});

/**
 * Arbitrary for creating a valid location (DTO format)
 * 
 * Generates data suitable for createLocationSchema validation.
 */
export const createLocationDTOArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 200 }),
  parentLocationId: fc.option(uuidArbitrary, { nil: null }),
  address: fc.option(addressArbitrary, { nil: null }),
  coordinates: fc.option(
    fc.record({
      lat: fc.float({ min: -90, max: 90, noNaN: true }),
      lng: fc.float({ min: -180, max: 180, noNaN: true }),
    }),
    { nil: null }
  ),
  description: descriptionArbitrary,
});

/**
 * Arbitrary for malicious input (XSS payloads)
 * 
 * Used for security testing to ensure input sanitization works correctly.
 */
export const xssPayloadArbitrary = fc.constantFrom(
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<svg onload=alert(1)>',
  '<iframe src="javascript:alert(1)">',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
  '<body onload=alert(1)>',
  '<input onfocus=alert(1) autofocus>'
);

/**
 * Arbitrary for SQL injection payloads
 * 
 * Used for security testing to ensure SQL injection prevention works correctly.
 */
export const sqlInjectionPayloadArbitrary = fc.constantFrom(
  "'; DROP TABLE guests; --",
  "1' OR '1'='1",
  "admin'--",
  "' UNION SELECT * FROM users--",
  "1; DELETE FROM guests WHERE '1'='1"
);

/**
 * Arbitrary for invalid email addresses
 * 
 * Used for validation testing.
 */
export const invalidEmailArbitrary = fc.constantFrom(
  'not-an-email',
  '@example.com',
  'user@',
  'user @example.com',
  'user@example',
  ''
);

/**
 * Arbitrary for invalid UUIDs
 * 
 * Used for validation testing.
 */
export const invalidUuidArbitrary = fc.constantFrom(
  'not-a-uuid',
  '12345',
  'abc-def-ghi',
  '',
  '00000000-0000-0000-0000-000000000000' // technically valid but often rejected
);

/**
 * Arbitrary for boundary values
 * 
 * Used for edge case testing.
 */
export const boundaryValueArbitrary = fc.record({
  emptyString: fc.constant(''),
  maxLengthString: fc.constant('a'.repeat(5000)),
  zero: fc.constant(0),
  negativeOne: fc.constant(-1),
  maxInt: fc.constant(Number.MAX_SAFE_INTEGER),
  minInt: fc.constant(Number.MIN_SAFE_INTEGER),
  nullValue: fc.constant(null),
  undefinedValue: fc.constant(undefined),
});
