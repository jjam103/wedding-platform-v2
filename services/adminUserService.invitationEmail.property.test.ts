/**
 * Property-Based Test: Invitation Email Sending
 * 
 * Feature: destination-wedding-platform
 * Property 9: Invitation Email Sending
 * 
 * Validates: Requirements 3.2
 * 
 * Property: When an admin user is created, an invitation email MUST be sent
 * to the provided email address with account setup instructions.
 */

import * as fc from 'fast-check';
import { adminUserService } from './adminUserService';
import * as emailService from './emailService';
import { createClient } from '@/lib/supabaseServer';

// Mock dependencies
jest.mock('@/lib/supabaseServer');
jest.mock('./emailService');

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

describe('Feature: destination-wedding-platform, Property 9: Invitation Email Sending', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should send invitation email when admin user is created', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          role: fc.constantFrom('admin' as const, 'owner' as const),
        }),
        fc.uuid(),
        async (adminData, invitedBy) => {
          // Arrange: Mock database to return no existing user
          mockSupabase.single.mockResolvedValueOnce({
            data: null,
            error: null,
          });

          // Mock successful admin user creation
          const createdAdmin = {
            id: fc.sample(fc.uuid(), 1)[0],
            email: adminData.email,
            role: adminData.role,
            status: 'active',
            invited_by: invitedBy,
            invited_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockSupabase.single.mockResolvedValueOnce({
            data: createdAdmin,
            error: null,
          });

          // Mock email service
          const mockSendEmail = jest.fn().mockResolvedValue({
            success: true,
            data: { id: 'email-123' },
          });
          (emailService as any).sendEmail = mockSendEmail;

          // Act: Create admin user
          const result = await adminUserService.create(adminData, invitedBy);

          // Assert: Email should be sent
          expect(result.success).toBe(true);
          
          // Verify email was sent with correct parameters
          expect(mockSendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
              to: adminData.email,
              subject: expect.stringContaining('invited'),
              html: expect.stringContaining('set up your account'),
            })
          );

          // Verify email contains role information
          const emailCall = mockSendEmail.mock.calls[0][0];
          expect(emailCall.html).toContain(
            adminData.role === 'owner' ? 'Owner' : 'Admin'
          );

          // Verify email contains setup link
          expect(emailCall.html).toContain('/auth/admin/setup');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include correct role in invitation email', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.constantFrom('admin' as const, 'owner' as const),
        fc.uuid(),
        async (email, role, invitedBy) => {
          // Arrange
          mockSupabase.single
            .mockResolvedValueOnce({ data: null, error: null })
            .mockResolvedValueOnce({
              data: {
                id: fc.sample(fc.uuid(), 1)[0],
                email,
                role,
                status: 'active',
                invited_by: invitedBy,
                invited_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });

          const mockSendEmail = jest.fn().mockResolvedValue({
            success: true,
            data: { id: 'email-123' },
          });
          (emailService as any).sendEmail = mockSendEmail;

          // Act
          await adminUserService.create({ email, role }, invitedBy);

          // Assert: Email should contain correct role
          const emailCall = mockSendEmail.mock.calls[0][0];
          const expectedRoleText = role === 'owner' ? 'Owner' : 'Admin';
          expect(emailCall.html).toContain(expectedRoleText);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not fail admin creation if email sending fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          role: fc.constantFrom('admin' as const, 'owner' as const),
        }),
        fc.uuid(),
        async (adminData, invitedBy) => {
          // Arrange: Mock successful database operations
          mockSupabase.single
            .mockResolvedValueOnce({ data: null, error: null })
            .mockResolvedValueOnce({
              data: {
                id: fc.sample(fc.uuid(), 1)[0],
                email: adminData.email,
                role: adminData.role,
                status: 'active',
                invited_by: invitedBy,
                invited_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });

          // Mock email service failure
          const mockSendEmail = jest.fn().mockResolvedValue({
            success: false,
            error: {
              code: 'EMAIL_SERVICE_ERROR',
              message: 'Failed to send email',
            },
          });
          (emailService as any).sendEmail = mockSendEmail;

          // Act: Create admin user
          const result = await adminUserService.create(adminData, invitedBy);

          // Assert: Admin creation should still succeed
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data?.email).toBe(adminData.email);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should send invitation email with expiry information', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.constantFrom('admin' as const, 'owner' as const),
        fc.uuid(),
        async (email, role, invitedBy) => {
          // Arrange
          mockSupabase.single
            .mockResolvedValueOnce({ data: null, error: null })
            .mockResolvedValueOnce({
              data: {
                id: fc.sample(fc.uuid(), 1)[0],
                email,
                role,
                status: 'active',
                invited_by: invitedBy,
                invited_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });

          const mockSendEmail = jest.fn().mockResolvedValue({
            success: true,
            data: { id: 'email-123' },
          });
          (emailService as any).sendEmail = mockSendEmail;

          // Act
          await adminUserService.create({ email, role }, invitedBy);

          // Assert: Email should mention expiry
          const emailCall = mockSendEmail.mock.calls[0][0];
          expect(emailCall.html).toMatch(/expires in \d+ days/i);
        }
      ),
      { numRuns: 100 }
    );
  });
});
