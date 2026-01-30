import * as fc from 'fast-check';
import { auditLogService } from './auditLogService';
import type { SupabaseClient } from '@supabase/supabase-js';

// Feature: destination-wedding-platform, Property 22: Audit Log Creation

// Mock Supabase client factory
function createMockSupabaseClient() {
  const mockSelect = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockSingle = jest.fn();
  const mockFrom = jest.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    eq: mockEq,
    single: mockSingle,
  });

  return {
    from: mockFrom,
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      eq: mockEq,
      single: mockSingle,
    },
  } as unknown as SupabaseClient & { _mocks: any };
}

// Arbitraries for property-based testing
const entityTypeArbitrary = fc.constantFrom(
  'guest',
  'event',
  'activity',
  'vendor',
  'accommodation',
  'photo',
  'email',
  'rsvp',
  'room_assignment',
  'location'
);

const operationTypeArbitrary = fc.constantFrom('create', 'update', 'delete');

const entityDataArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.option(fc.emailAddress()),
  created_at: fc.date().map((d) => d.toISOString()),
});

const auditLogInputArbitrary = fc.record({
  user_id: fc.option(fc.uuid()),
  user_email: fc.option(fc.emailAddress()),
  entity_type: entityTypeArbitrary,
  entity_id: fc.uuid(),
  operation_type: operationTypeArbitrary,
  old_data: fc.option(entityDataArbitrary),
  new_data: fc.option(entityDataArbitrary),
  ip_address: fc.option(fc.ipV4()),
  user_agent: fc.option(fc.string({ minLength: 10, maxLength: 200 })),
});

describe('Feature: destination-wedding-platform, Property 22: Audit Log Creation', () => {
  describe('Property: For any data modification operation, audit log should be created', () => {
    it('should create audit log entry for any valid modification operation', async () => {
      await fc.assert(
        fc.asyncProperty(auditLogInputArbitrary, async (input) => {
          const mockSupabase = createMockSupabaseClient();

          // Mock successful insert
          const mockAuditLog = {
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: input.user_id || null,
            user_email: input.user_email || null,
            entity_type: input.entity_type,
            entity_id: input.entity_id,
            operation_type: input.operation_type,
            old_data: input.old_data || null,
            new_data: input.new_data || null,
            ip_address: input.ip_address || null,
            user_agent: input.user_agent || null,
            created_at: new Date().toISOString(),
          };

          mockSupabase._mocks.single.mockResolvedValue({
            data: mockAuditLog,
            error: null,
          } as any);

          const result = await auditLogService.create(mockSupabase, input);

          // Property: Audit log creation should succeed for valid inputs
          expect(result.success).toBe(true);

          if (result.success) {
            // Property: Created audit log should contain all required fields
            expect(result.data.entity_type).toBe(input.entity_type);
            expect(result.data.entity_id).toBe(input.entity_id);
            expect(result.data.operation_type).toBe(input.operation_type);

            // Property: Audit log should have a timestamp
            expect(result.data.created_at).toBeDefined();
            expect(typeof result.data.created_at).toBe('string');

            // Property: Audit log should have a unique ID
            expect(result.data.id).toBeDefined();
            expect(typeof result.data.id).toBe('string');
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Audit logs should capture operation type correctly', () => {
    it('should correctly record create, update, and delete operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          entityTypeArbitrary,
          fc.uuid(),
          operationTypeArbitrary,
          entityDataArbitrary,
          async (entityType, entityId, operationType, entityData) => {
            const mockSupabase = createMockSupabaseClient();

            const mockAuditLog = {
              id: fc.sample(fc.uuid(), 1)[0],
              user_id: null,
              user_email: null,
              entity_type: entityType,
              entity_id: entityId,
              operation_type: operationType,
              old_data: operationType === 'create' ? null : entityData,
              new_data: operationType === 'delete' ? null : entityData,
              ip_address: null,
              user_agent: null,
              created_at: new Date().toISOString(),
            };

            mockSupabase._mocks.single.mockResolvedValue({
              data: mockAuditLog,
              error: null,
            } as any);

            let result;
            if (operationType === 'create') {
              result = await auditLogService.logCreate(
                mockSupabase,
                entityType,
                entityId,
                entityData
              );
            } else if (operationType === 'update') {
              result = await auditLogService.logUpdate(
                mockSupabase,
                entityType,
                entityId,
                entityData,
                entityData
              );
            } else {
              result = await auditLogService.logDelete(
                mockSupabase,
                entityType,
                entityId,
                entityData
              );
            }

            // Property: Operation type should match the helper function used
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.operation_type).toBe(operationType);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Audit logs should preserve entity information', () => {
    it('should maintain entity type and ID integrity across all operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          entityTypeArbitrary,
          fc.uuid(),
          operationTypeArbitrary,
          async (entityType, entityId, operationType) => {
            const mockSupabase = createMockSupabaseClient();

            const mockAuditLog = {
              id: fc.sample(fc.uuid(), 1)[0],
              user_id: null,
              user_email: null,
              entity_type: entityType,
              entity_id: entityId,
              operation_type: operationType,
              old_data: null,
              new_data: null,
              ip_address: null,
              user_agent: null,
              created_at: new Date().toISOString(),
            };

            mockSupabase._mocks.single.mockResolvedValue({
              data: mockAuditLog,
              error: null,
            } as any);

            const result = await auditLogService.create(mockSupabase, {
              entity_type: entityType,
              entity_id: entityId,
              operation_type: operationType,
            } as any);

            // Property: Entity information should be preserved exactly
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.entity_type).toBe(entityType);
              expect(result.data.entity_id).toBe(entityId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Audit logs should capture user information when provided', () => {
    it('should record user ID and email when available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          entityTypeArbitrary,
          fc.uuid(),
          operationTypeArbitrary,
          async (userId, userEmail, entityType, entityId, operationType) => {
            const mockSupabase = createMockSupabaseClient();

            const mockAuditLog = {
              id: fc.sample(fc.uuid(), 1)[0],
              user_id: userId,
              user_email: userEmail,
              entity_type: entityType,
              entity_id: entityId,
              operation_type: operationType,
              old_data: null,
              new_data: null,
              ip_address: null,
              user_agent: null,
              created_at: new Date().toISOString(),
            };

            mockSupabase._mocks.single.mockResolvedValue({
              data: mockAuditLog,
              error: null,
            } as any);

            const result = await auditLogService.create(mockSupabase, {
              user_id: userId,
              user_email: userEmail,
              entity_type: entityType,
              entity_id: entityId,
              operation_type: operationType,
            } as any);

            // Property: User information should be captured when provided
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.user_id).toBe(userId);
              expect(result.data.user_email).toBe(userEmail);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Audit logs should capture data changes for updates', () => {
    it('should record both old and new data for update operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          entityTypeArbitrary,
          fc.uuid(),
          entityDataArbitrary,
          entityDataArbitrary,
          async (entityType, entityId, oldData, newData) => {
            const mockSupabase = createMockSupabaseClient();

            const mockAuditLog = {
              id: fc.sample(fc.uuid(), 1)[0],
              user_id: null,
              user_email: null,
              entity_type: entityType,
              entity_id: entityId,
              operation_type: 'update' as const,
              old_data: oldData,
              new_data: newData,
              ip_address: null,
              user_agent: null,
              created_at: new Date().toISOString(),
            };

            mockSupabase._mocks.single.mockResolvedValue({
              data: mockAuditLog,
              error: null,
            } as any);

            const result = await auditLogService.logUpdate(
              mockSupabase,
              entityType,
              entityId,
              oldData,
              newData
            );

            // Property: Update operations should capture both old and new data
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.old_data).toEqual(oldData);
              expect(result.data.new_data).toEqual(newData);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
