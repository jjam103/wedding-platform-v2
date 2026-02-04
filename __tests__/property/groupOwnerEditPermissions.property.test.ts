import * as fc from 'fast-check';
import { PUT } from '@/app/api/guest/family/[id]/route';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

/**
 * Property-Based Tests for Group Owner Edit Permissions
 * 
 * Feature: destination-wedding-platform
 * Property 19: Group Owner Edit Permissions
 * Validates: Requirements 6.4, 6.5, 6.6, 6.7
 * Task: 16.4
 */

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs');
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
jest.mock('@/services/emailService', () => ({
  emailService: {
    send: jest.fn().mockResolvedValue({ success: true }),
  },
}));

const mockSupabase = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  update: jest.fn().mockReturnThis(),
};

describe('Feature: destination-wedding-platform, Property 19: Group Owner Edit Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should allow adults to edit any family member in their group', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // currentGuestId
        fc.uuid(), // targetGuestId
        fc.uuid(), // groupId
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 50 }), // firstName
        fc.string({ minLength: 1, maxLength: 50 }), // lastName
        fc.string({ minLength: 0, maxLength: 500 }), // dietaryRestrictions
        async (currentGuestId, targetGuestId, groupId, email, firstName, lastName, dietaryRestrictions) => {
          // Arrange
          mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { email: 'current@example.com' } } },
            error: null,
          });

          const currentGuest = {
            id: currentGuestId,
            group_id: groupId,
            age_type: 'adult',
            email: 'current@example.com',
          };

          const targetGuest = {
            id: targetGuestId,
            group_id: groupId,
            age_type: 'child',
            first_name: 'Original',
            last_name: 'Name',
          };

          const updatedGuest = {
            ...targetGuest,
            first_name: firstName,
            last_name: lastName,
            email,
            dietary_restrictions: dietaryRestrictions || null,
          };

          mockSupabase.single
            .mockResolvedValueOnce({ data: currentGuest, error: null })
            .mockResolvedValueOnce({ data: targetGuest, error: null })
            .mockResolvedValueOnce({ data: updatedGuest, error: null });

          const request = new Request(`http://localhost:3000/api/guest/family/${targetGuestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName,
              email,
              dietary_restrictions: dietaryRestrictions,
            }),
          });

          // Act
          const response = await PUT(request, { params: { id: targetGuestId } });
          const data = await response.json();

          // Assert
          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.data.first_name).toBe(firstName);
          expect(data.data.last_name).toBe(lastName);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should prevent adults from editing family members in other groups', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // currentGuestId
        fc.uuid(), // targetGuestId
        fc.uuid(), // currentGroupId
        fc.uuid(), // targetGroupId
        fc.string({ minLength: 1, maxLength: 50 }), // firstName
        async (currentGuestId, targetGuestId, currentGroupId, targetGroupId, firstName) => {
          // Ensure groups are different
          fc.pre(currentGroupId !== targetGroupId);

          // Arrange
          mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { email: 'current@example.com' } } },
            error: null,
          });

          const currentGuest = {
            id: currentGuestId,
            group_id: currentGroupId,
            age_type: 'adult',
            email: 'current@example.com',
          };

          const targetGuest = {
            id: targetGuestId,
            group_id: targetGroupId,
            age_type: 'child',
            first_name: 'Original',
            last_name: 'Name',
          };

          mockSupabase.single
            .mockResolvedValueOnce({ data: currentGuest, error: null })
            .mockResolvedValueOnce({ data: targetGuest, error: null });

          const request = new Request(`http://localhost:3000/api/guest/family/${targetGuestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name: firstName }),
          });

          // Act
          const response = await PUT(request, { params: { id: targetGuestId } });
          const data = await response.json();

          // Assert
          expect(response.status).toBe(403);
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('FORBIDDEN');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should allow children to edit only themselves', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // guestId
        fc.uuid(), // groupId
        fc.string({ minLength: 1, maxLength: 50 }), // firstName
        fc.string({ minLength: 1, maxLength: 50 }), // lastName
        async (guestId, groupId, firstName, lastName) => {
          // Arrange
          mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { email: 'child@example.com' } } },
            error: null,
          });

          const childGuest = {
            id: guestId,
            group_id: groupId,
            age_type: 'child',
            email: 'child@example.com',
            first_name: 'Original',
            last_name: 'Name',
          };

          const updatedGuest = {
            ...childGuest,
            first_name: firstName,
            last_name: lastName,
          };

          mockSupabase.single
            .mockResolvedValueOnce({ data: childGuest, error: null })
            .mockResolvedValueOnce({ data: childGuest, error: null })
            .mockResolvedValueOnce({ data: updatedGuest, error: null });

          const request = new Request(`http://localhost:3000/api/guest/family/${guestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName,
            }),
          });

          // Act
          const response = await PUT(request, { params: { id: guestId } });
          const data = await response.json();

          // Assert
          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.data.first_name).toBe(firstName);
          expect(data.data.last_name).toBe(lastName);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should prevent children from editing other family members', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // currentGuestId
        fc.uuid(), // targetGuestId
        fc.uuid(), // groupId
        fc.string({ minLength: 1, maxLength: 50 }), // firstName
        async (currentGuestId, targetGuestId, groupId, firstName) => {
          // Ensure guests are different
          fc.pre(currentGuestId !== targetGuestId);

          // Arrange
          mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { email: 'child@example.com' } } },
            error: null,
          });

          const currentGuest = {
            id: currentGuestId,
            group_id: groupId,
            age_type: 'child',
            email: 'child@example.com',
          };

          const targetGuest = {
            id: targetGuestId,
            group_id: groupId,
            age_type: 'adult',
            first_name: 'Original',
            last_name: 'Name',
          };

          mockSupabase.single
            .mockResolvedValueOnce({ data: currentGuest, error: null })
            .mockResolvedValueOnce({ data: targetGuest, error: null });

          const request = new Request(`http://localhost:3000/api/guest/family/${targetGuestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name: firstName }),
          });

          // Act
          const response = await PUT(request, { params: { id: targetGuestId } });
          const data = await response.json();

          // Assert
          expect(response.status).toBe(403);
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('FORBIDDEN');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should allow adults to update contact information for all family members', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // currentGuestId
        fc.uuid(), // targetGuestId
        fc.uuid(), // groupId
        fc.emailAddress(),
        fc.string({ minLength: 10, maxLength: 20 }), // phone
        async (currentGuestId, targetGuestId, groupId, email, phone) => {
          // Arrange
          mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { email: 'adult@example.com' } } },
            error: null,
          });

          const currentGuest = {
            id: currentGuestId,
            group_id: groupId,
            age_type: 'adult',
            email: 'adult@example.com',
          };

          const targetGuest = {
            id: targetGuestId,
            group_id: groupId,
            age_type: 'child',
            first_name: 'Child',
            last_name: 'Name',
            email: 'old@example.com',
            phone: '1234567890',
          };

          const updatedGuest = {
            ...targetGuest,
            email,
            phone,
          };

          mockSupabase.single
            .mockResolvedValueOnce({ data: currentGuest, error: null })
            .mockResolvedValueOnce({ data: targetGuest, error: null })
            .mockResolvedValueOnce({ data: updatedGuest, error: null });

          const request = new Request(`http://localhost:3000/api/guest/family/${targetGuestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, phone }),
          });

          // Act
          const response = await PUT(request, { params: { id: targetGuestId } });
          const data = await response.json();

          // Assert
          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.data.email).toBe(email);
          expect(data.data.phone).toBe(phone);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should allow adults to update dietary restrictions for all family members', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // currentGuestId
        fc.uuid(), // targetGuestId
        fc.uuid(), // groupId
        fc.string({ minLength: 0, maxLength: 500 }), // dietaryRestrictions
        async (currentGuestId, targetGuestId, groupId, dietaryRestrictions) => {
          // Arrange
          mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { email: 'adult@example.com' } } },
            error: null,
          });

          const currentGuest = {
            id: currentGuestId,
            group_id: groupId,
            age_type: 'adult',
            email: 'adult@example.com',
          };

          const targetGuest = {
            id: targetGuestId,
            group_id: groupId,
            age_type: 'child',
            first_name: 'Child',
            last_name: 'Name',
            dietary_restrictions: 'Old restrictions',
          };

          const updatedGuest = {
            ...targetGuest,
            dietary_restrictions: dietaryRestrictions || null,
          };

          mockSupabase.single
            .mockResolvedValueOnce({ data: currentGuest, error: null })
            .mockResolvedValueOnce({ data: targetGuest, error: null })
            .mockResolvedValueOnce({ data: updatedGuest, error: null });

          const request = new Request(`http://localhost:3000/api/guest/family/${targetGuestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dietary_restrictions: dietaryRestrictions }),
          });

          // Act
          const response = await PUT(request, { params: { id: targetGuestId } });
          const data = await response.json();

          // Assert
          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.data.dietary_restrictions).toBe(dietaryRestrictions || null);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should sanitize all input fields before saving', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // currentGuestId
        fc.uuid(), // targetGuestId
        fc.uuid(), // groupId
        fc.oneof(
          fc.constant('<script>alert("xss")</script>John'),
          fc.constant('John<img src=x onerror=alert(1)>'),
          fc.constant('John"; DROP TABLE guests; --')
        ),
        async (currentGuestId, targetGuestId, groupId, maliciousInput) => {
          // Arrange
          mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { email: 'adult@example.com' } } },
            error: null,
          });

          const currentGuest = {
            id: currentGuestId,
            group_id: groupId,
            age_type: 'adult',
            email: 'adult@example.com',
          };

          const targetGuest = {
            id: targetGuestId,
            group_id: groupId,
            age_type: 'child',
            first_name: 'Original',
            last_name: 'Name',
          };

          const updatedGuest = {
            ...targetGuest,
            first_name: 'John', // Sanitized version
          };

          mockSupabase.single
            .mockResolvedValueOnce({ data: currentGuest, error: null })
            .mockResolvedValueOnce({ data: targetGuest, error: null })
            .mockResolvedValueOnce({ data: updatedGuest, error: null });

          const request = new Request(`http://localhost:3000/api/guest/family/${targetGuestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name: maliciousInput }),
          });

          // Act
          const response = await PUT(request, { params: { id: targetGuestId } });
          const data = await response.json();

          // Assert
          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          // Verify sanitization occurred
          const updateCall = mockSupabase.update.mock.calls[0];
          if (updateCall && updateCall[0]?.first_name) {
            expect(updateCall[0].first_name).not.toContain('<script>');
            expect(updateCall[0].first_name).not.toContain('DROP TABLE');
            expect(updateCall[0].first_name).not.toContain('onerror=');
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should validate email format before saving', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // currentGuestId
        fc.uuid(), // targetGuestId
        fc.uuid(), // groupId
        fc.oneof(
          fc.constant('not-an-email'),
          fc.constant('missing@domain'),
          fc.constant('@nodomain.com'),
          fc.constant('spaces in@email.com')
        ),
        async (currentGuestId, targetGuestId, groupId, invalidEmail) => {
          // Arrange
          mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { email: 'adult@example.com' } } },
            error: null,
          });

          const currentGuest = {
            id: currentGuestId,
            group_id: groupId,
            age_type: 'adult',
            email: 'adult@example.com',
          };

          const targetGuest = {
            id: targetGuestId,
            group_id: groupId,
            age_type: 'child',
            first_name: 'Child',
            last_name: 'Name',
          };

          mockSupabase.single
            .mockResolvedValueOnce({ data: currentGuest, error: null })
            .mockResolvedValueOnce({ data: targetGuest, error: null });

          const request = new Request(`http://localhost:3000/api/guest/family/${targetGuestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: invalidEmail }),
          });

          // Act
          const response = await PUT(request, { params: { id: targetGuestId } });
          const data = await response.json();

          // Assert
          expect(response.status).toBe(400);
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('VALIDATION_ERROR');
        }
      ),
      { numRuns: 20 }
    );
  });
});
