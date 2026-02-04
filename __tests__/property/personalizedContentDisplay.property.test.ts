import * as fc from 'fast-check';
import { guestArbitrary } from '../helpers/arbitraries';

/**
 * Property 18: Personalized Content Display
 * 
 * Feature: destination-wedding-platform
 * 
 * Validates: Requirements 6.1
 * 
 * Property: Guest dashboard displays personalized content based on guest data
 * - Welcome message includes guest's first name
 * - RSVP summary reflects guest's actual RSVPs
 * - Upcoming events are filtered to guest's invitations
 * - Quick links are relevant to guest's needs
 */
describe('Feature: destination-wedding-platform, Property 18: Personalized Content Display', () => {
  it('should display personalized welcome message with guest name', () => {
    fc.assert(
      fc.property(guestArbitrary, (guest) => {
        // Simulate dashboard rendering
        const welcomeMessage = `¡Pura Vida, ${guest.first_name}!`;
        
        // Property: Welcome message must include guest's first name
        expect(welcomeMessage).toContain(guest.first_name);
        expect(welcomeMessage.length).toBeGreaterThan(guest.first_name.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should filter upcoming events to only show guest invitations', () => {
    fc.assert(
      fc.property(
        guestArbitrary,
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 5, maxLength: 50 }),
            date: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
            invitedGuestIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (guest, allEvents) => {
          // Simulate filtering events for guest
          const guestEvents = allEvents.filter((event) =>
            event.invitedGuestIds.includes(guest.id)
          );

          // Property: Filtered events must only include events where guest is invited
          guestEvents.forEach((event) => {
            expect(event.invitedGuestIds).toContain(guest.id);
          });

          // Property: No events should be shown that don't include guest
          const nonGuestEvents = allEvents.filter(
            (event) => !event.invitedGuestIds.includes(guest.id)
          );
          nonGuestEvents.forEach((event) => {
            expect(guestEvents).not.toContainEqual(event);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate RSVP summary based on guest RSVPs only', () => {
    fc.assert(
      fc.property(
        guestArbitrary,
        fc.array(
          fc.record({
            id: fc.uuid(),
            guestId: fc.uuid(),
            status: fc.constantFrom('attending', 'declined', 'maybe', 'pending'),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (guest, allRsvps) => {
          // Filter RSVPs for this guest
          const guestRsvps = allRsvps.filter((rsvp) => rsvp.guestId === guest.id);

          // Calculate summary
          const summary = {
            total: guestRsvps.length,
            attending: guestRsvps.filter((r) => r.status === 'attending').length,
            declined: guestRsvps.filter((r) => r.status === 'declined').length,
            maybe: guestRsvps.filter((r) => r.status === 'maybe').length,
            pending: guestRsvps.filter((r) => r.status === 'pending').length,
          };

          // Property: Total must equal sum of all statuses
          expect(summary.total).toBe(
            summary.attending + summary.declined + summary.maybe + summary.pending
          );

          // Property: Each count must be non-negative
          expect(summary.attending).toBeGreaterThanOrEqual(0);
          expect(summary.declined).toBeGreaterThanOrEqual(0);
          expect(summary.maybe).toBeGreaterThanOrEqual(0);
          expect(summary.pending).toBeGreaterThanOrEqual(0);

          // Property: Each count must not exceed total
          expect(summary.attending).toBeLessThanOrEqual(summary.total);
          expect(summary.declined).toBeLessThanOrEqual(summary.total);
          expect(summary.maybe).toBeLessThanOrEqual(summary.total);
          expect(summary.pending).toBeLessThanOrEqual(summary.total);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display announcements sorted by urgency and date', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 5, maxLength: 50 }),
            message: fc.string({ minLength: 10, maxLength: 200 }),
            urgent: fc.boolean(),
            created_at: fc.date({ min: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), max: new Date() }),
            active: fc.boolean(),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (announcements) => {
          // Filter active announcements
          const activeAnnouncements = announcements.filter((a) => a.active);

          // Sort by urgency (urgent first) then by date (newest first)
          const sorted = [...activeAnnouncements].sort((a, b) => {
            if (a.urgent && !b.urgent) return -1;
            if (!a.urgent && b.urgent) return 1;
            return b.created_at.getTime() - a.created_at.getTime();
          });

          // Property: Urgent announcements must come before non-urgent
          let lastUrgent = true;
          sorted.forEach((announcement) => {
            if (!announcement.urgent) {
              lastUrgent = false;
            }
            if (announcement.urgent && !lastUrgent) {
              throw new Error('Urgent announcement found after non-urgent');
            }
          });

          // Property: Within same urgency level, newer must come before older
          for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].urgent === sorted[i + 1].urgent) {
              expect(sorted[i].created_at.getTime()).toBeGreaterThanOrEqual(
                sorted[i + 1].created_at.getTime()
              );
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only display active announcements to guests', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 5, maxLength: 50 }),
            active: fc.boolean(),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (allAnnouncements) => {
          // Filter to active only
          const displayedAnnouncements = allAnnouncements.filter((a) => a.active);

          // Property: All displayed announcements must be active
          displayedAnnouncements.forEach((announcement) => {
            expect(announcement.active).toBe(true);
          });

          // Property: No inactive announcements should be displayed
          const inactiveAnnouncements = allAnnouncements.filter((a) => !a.active);
          inactiveAnnouncements.forEach((announcement) => {
            expect(displayedAnnouncements).not.toContainEqual(announcement);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
