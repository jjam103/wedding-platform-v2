/**
 * Tests for Property-Based Test Arbitraries
 * 
 * Validates that arbitraries generate valid data that passes schema validation.
 */

import * as fc from 'fast-check';
import {
  validGuestArbitrary,
  validEventArbitrary,
  validActivityArbitrary,
  validVendorArbitrary,
  validAccommodationArbitrary,
  validLocationArbitrary,
  createGuestDTOArbitrary,
  createEventDTOArbitrary,
  createActivityDTOArbitrary,
  createVendorDTOArbitrary,
  createAccommodationDTOArbitrary,
  createLocationDTOArbitrary,
} from './arbitraries';
import { createGuestSchema } from '@/schemas/guestSchemas';
import { createEventSchema } from '@/schemas/eventSchemas';
import { createActivitySchema } from '@/schemas/activitySchemas';
import { createVendorSchema } from '@/schemas/vendorSchemas';
import { createAccommodationSchema } from '@/schemas/accommodationSchemas';
import { createLocationSchema } from '@/schemas/locationSchemas';

describe('Test Data Arbitraries', () => {
  describe('Entity Arbitraries', () => {
    it('should generate valid Guest entities', () => {
      fc.assert(
        fc.property(validGuestArbitrary, (guest) => {
          expect(guest).toHaveProperty('id');
          expect(guest).toHaveProperty('groupId');
          expect(guest).toHaveProperty('firstName');
          expect(guest).toHaveProperty('lastName');
          expect(guest).toHaveProperty('ageType');
          expect(guest).toHaveProperty('guestType');
          expect(['adult', 'child', 'senior']).toContain(guest.ageType);
        }),
        { numRuns: 10 }
      );
    });

    it('should generate valid Event entities', () => {
      fc.assert(
        fc.property(validEventArbitrary, (event) => {
          expect(event).toHaveProperty('id');
          expect(event).toHaveProperty('name');
          expect(event).toHaveProperty('eventType');
          expect(event).toHaveProperty('startDate');
          expect(['ceremony', 'reception', 'pre_wedding', 'post_wedding']).toContain(event.eventType);
          
          // Validate endDate is after startDate if both present
          if (event.endDate) {
            expect(new Date(event.endDate).getTime()).toBeGreaterThanOrEqual(
              new Date(event.startDate).getTime()
            );
          }
        }),
        { numRuns: 10 }
      );
    });

    it('should generate valid Activity entities', () => {
      fc.assert(
        fc.property(validActivityArbitrary, (activity) => {
          expect(activity).toHaveProperty('id');
          expect(activity).toHaveProperty('name');
          expect(activity).toHaveProperty('activityType');
          expect(activity).toHaveProperty('startTime');
          
          // Validate endTime is after startTime if both present
          if (activity.endTime) {
            expect(new Date(activity.endTime).getTime()).toBeGreaterThanOrEqual(
              new Date(activity.startTime).getTime()
            );
          }
          
          // Validate hostSubsidy <= costPerPerson if both present
          if (activity.hostSubsidy !== null && activity.costPerPerson !== null) {
            expect(activity.hostSubsidy).toBeLessThanOrEqual(activity.costPerPerson);
          }
        }),
        { numRuns: 10 }
      );
    });

    it('should generate valid Vendor entities', () => {
      fc.assert(
        fc.property(validVendorArbitrary, (vendor) => {
          expect(vendor).toHaveProperty('id');
          expect(vendor).toHaveProperty('name');
          expect(vendor).toHaveProperty('category');
          expect(vendor).toHaveProperty('pricingModel');
          expect(vendor).toHaveProperty('baseCost');
          expect(vendor).toHaveProperty('amountPaid');
          
          // Validate amountPaid <= baseCost
          expect(vendor.amountPaid).toBeLessThanOrEqual(vendor.baseCost);
        }),
        { numRuns: 10 }
      );
    });

    it('should generate valid Accommodation entities', () => {
      fc.assert(
        fc.property(validAccommodationArbitrary, (accommodation) => {
          expect(accommodation).toHaveProperty('id');
          expect(accommodation).toHaveProperty('name');
          expect(accommodation).toHaveProperty('status');
          expect(['draft', 'published']).toContain(accommodation.status);
        }),
        { numRuns: 10 }
      );
    });

    it('should generate valid Location entities', () => {
      fc.assert(
        fc.property(validLocationArbitrary, (location) => {
          expect(location).toHaveProperty('id');
          expect(location).toHaveProperty('name');
          
          // Validate coordinates if present
          if (location.coordinates) {
            expect(location.coordinates.lat).toBeGreaterThanOrEqual(-90);
            expect(location.coordinates.lat).toBeLessThanOrEqual(90);
            expect(location.coordinates.lng).toBeGreaterThanOrEqual(-180);
            expect(location.coordinates.lng).toBeLessThanOrEqual(180);
          }
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('DTO Arbitraries', () => {
    it('should generate data that passes createGuestSchema validation', () => {
      fc.assert(
        fc.property(createGuestDTOArbitrary, (guestDTO) => {
          const result = createGuestSchema.safeParse(guestDTO);
          if (!result.success) {
            console.error('Validation errors:', result.error.issues);
          }
          expect(result.success).toBe(true);
        }),
        { numRuns: 10 }
      );
    });

    it('should generate data that passes createEventSchema validation', () => {
      fc.assert(
        fc.property(createEventDTOArbitrary, (eventDTO) => {
          const result = createEventSchema.safeParse(eventDTO);
          if (!result.success) {
            console.error('Validation errors:', result.error.issues);
          }
          expect(result.success).toBe(true);
        }),
        { numRuns: 10 }
      );
    });

    it('should generate data that passes createActivitySchema validation', () => {
      fc.assert(
        fc.property(createActivityDTOArbitrary, (activityDTO) => {
          const result = createActivitySchema.safeParse(activityDTO);
          if (!result.success) {
            console.error('Validation errors:', result.error.issues);
          }
          expect(result.success).toBe(true);
        }),
        { numRuns: 10 }
      );
    });

    it('should generate data that passes createVendorSchema validation', () => {
      fc.assert(
        fc.property(createVendorDTOArbitrary, (vendorDTO) => {
          const result = createVendorSchema.safeParse(vendorDTO);
          if (!result.success) {
            console.error('Validation errors:', result.error.issues);
          }
          expect(result.success).toBe(true);
        }),
        { numRuns: 10 }
      );
    });

    it('should generate data that passes createAccommodationSchema validation', () => {
      fc.assert(
        fc.property(createAccommodationDTOArbitrary, (accommodationDTO) => {
          const result = createAccommodationSchema.safeParse(accommodationDTO);
          if (!result.success) {
            console.error('Validation errors:', result.error.issues);
          }
          expect(result.success).toBe(true);
        }),
        { numRuns: 10 }
      );
    });

    it('should generate data that passes createLocationSchema validation', () => {
      fc.assert(
        fc.property(createLocationDTOArbitrary, (locationDTO) => {
          const result = createLocationSchema.safeParse(locationDTO);
          if (!result.success) {
            console.error('Validation errors:', result.error.issues);
          }
          expect(result.success).toBe(true);
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Constraint Validation', () => {
    it('should ensure Event endDate is always after or equal to startDate', () => {
      fc.assert(
        fc.property(validEventArbitrary, (event) => {
          if (event.endDate) {
            const startTime = new Date(event.startDate).getTime();
            const endTime = new Date(event.endDate).getTime();
            expect(endTime).toBeGreaterThanOrEqual(startTime);
          }
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('should ensure Activity endTime is always after or equal to startTime', () => {
      fc.assert(
        fc.property(validActivityArbitrary, (activity) => {
          if (activity.endTime) {
            const startTime = new Date(activity.startTime).getTime();
            const endTime = new Date(activity.endTime).getTime();
            expect(endTime).toBeGreaterThanOrEqual(startTime);
          }
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('should ensure Activity hostSubsidy is always <= costPerPerson', () => {
      fc.assert(
        fc.property(validActivityArbitrary, (activity) => {
          if (activity.hostSubsidy !== null && activity.costPerPerson !== null) {
            expect(activity.hostSubsidy).toBeLessThanOrEqual(activity.costPerPerson);
          }
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('should ensure Vendor amountPaid is always <= baseCost', () => {
      fc.assert(
        fc.property(validVendorArbitrary, (vendor) => {
          expect(vendor.amountPaid).toBeLessThanOrEqual(vendor.baseCost);
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('should ensure Location coordinates are within valid ranges', () => {
      fc.assert(
        fc.property(validLocationArbitrary, (location) => {
          if (location.coordinates) {
            expect(location.coordinates.lat).toBeGreaterThanOrEqual(-90);
            expect(location.coordinates.lat).toBeLessThanOrEqual(90);
            expect(location.coordinates.lng).toBeGreaterThanOrEqual(-180);
            expect(location.coordinates.lng).toBeLessThanOrEqual(180);
          }
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });
});
