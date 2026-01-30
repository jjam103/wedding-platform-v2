import { auditLogService } from './auditLogService';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
function createMockSupabaseClient() {
  const mockSelect = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockGte = jest.fn().mockReturnThis();
  const mockLte = jest.fn().mockReturnThis();
  const mockOrder = jest.fn().mockReturnThis();
  const mockRange = jest.fn().mockReturnThis();
  const mockSingle = jest.fn();
  const mockFrom = jest.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    range: mockRange,
    single: mockSingle,
  });

  return {
    from: mockFrom,
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      order: mockOrder,
      range: mockRange,
      single: mockSingle,
    },
  } as unknown as SupabaseClient & { _mocks: any };
}

describe('auditLogService', () => {
  describe('create', () => {
    it('should create audit log with valid data', async () => {
      const mockSupabase = createMockSupabaseClient();
      const mockAuditLog = {
        id: 'log-123',
        user_id: 'user-456',
        user_email: 'admin@example.com',
        entity_type: 'guest',
        entity_id: 'guest-789',
        operation_type: 'create',
        old_data: null,
        new_data: { first_name: 'John', last_name: 'Doe' },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date().toISOString(),
      };

      mockSupabase._mocks.single.mockResolvedValue({
        data: mockAuditLog,
        error: null,
      } as any);

      const result = await auditLogService.create(mockSupabase, {
        user_id: 'user-456',
        user_email: 'admin@example.com',
        entity_type: 'guest',
        entity_id: 'guest-789',
        operation_type: 'create',
        new_data: { first_name: 'John', last_name: 'Doe' },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('log-123');
        expect(result.data.entity_type).toBe('guest');
        expect(result.data.operation_type).toBe('create');
      }
    });

    it('should return VALIDATION_ERROR when required fields are missing', async () => {
      const mockSupabase = createMockSupabaseClient();

      const result = await auditLogService.create(mockSupabase, {
        entity_type: '',
        entity_id: 'guest-789',
        operation_type: 'create',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('required fields');
      }
    });

    it('should return VALIDATION_ERROR for invalid operation_type', async () => {
      const mockSupabase = createMockSupabaseClient();

      const result = await auditLogService.create(mockSupabase, {
        entity_type: 'guest',
        entity_id: 'guest-789',
        operation_type: 'invalid' as any,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Invalid operation_type');
      }
    });

    it('should return DATABASE_ERROR when insert fails', async () => {
      const mockSupabase = createMockSupabaseClient();

      mockSupabase._mocks.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      } as any);

      const result = await auditLogService.create(mockSupabase, {
        entity_type: 'guest',
        entity_id: 'guest-789',
        operation_type: 'create',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('list', () => {
    it('should retrieve paginated audit logs', async () => {
      const mockSupabase = createMockSupabaseClient();
      const mockLogs = [
        {
          id: 'log-1',
          entity_type: 'guest',
          operation_type: 'create',
          created_at: new Date().toISOString(),
        },
        {
          id: 'log-2',
          entity_type: 'event',
          operation_type: 'update',
          created_at: new Date().toISOString(),
        },
      ];

      // Mock the chain to return data and count
      mockSupabase._mocks.range.mockResolvedValue({
        data: mockLogs,
        error: null,
        count: 2,
      } as any);

      const result = await auditLogService.list(mockSupabase, {
        page: 1,
        page_size: 50,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs).toHaveLength(2);
        expect(result.data.total).toBe(2);
        expect(result.data.page).toBe(1);
        expect(result.data.page_size).toBe(50);
      }
    });

    it('should apply filters correctly', async () => {
      const mockSupabase = createMockSupabaseClient();

      mockSupabase._mocks.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      } as any);

      await auditLogService.list(mockSupabase, {
        entity_type: 'guest',
        operation_type: 'update',
        user_id: 'user-123',
      });

      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('entity_type', 'guest');
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('operation_type', 'update');
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      const mockSupabase = createMockSupabaseClient();

      mockSupabase._mocks.range.mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
        count: null,
      } as any);

      const result = await auditLogService.list(mockSupabase);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('get', () => {
    it('should retrieve single audit log by ID', async () => {
      const mockSupabase = createMockSupabaseClient();
      const mockLog = {
        id: 'log-123',
        entity_type: 'guest',
        operation_type: 'update',
        created_at: new Date().toISOString(),
      };

      mockSupabase._mocks.single.mockResolvedValue({
        data: mockLog,
        error: null,
      } as any);

      const result = await auditLogService.get(mockSupabase, 'log-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('log-123');
      }
    });

    it('should return NOT_FOUND when audit log does not exist', async () => {
      const mockSupabase = createMockSupabaseClient();

      mockSupabase._mocks.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      } as any);

      const result = await auditLogService.get(mockSupabase, 'nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('helper functions', () => {
    it('logCreate should create audit log for create operation', async () => {
      const mockSupabase = createMockSupabaseClient();

      mockSupabase._mocks.single.mockResolvedValue({
        data: {
          id: 'log-123',
          operation_type: 'create',
          entity_type: 'guest',
          entity_id: 'guest-456',
        },
        error: null,
      } as any);

      const result = await auditLogService.logCreate(
        mockSupabase,
        'guest',
        'guest-456',
        { first_name: 'John' },
        'user-123',
        'user@example.com'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operation_type).toBe('create');
      }
    });

    it('logUpdate should create audit log for update operation', async () => {
      const mockSupabase = createMockSupabaseClient();

      mockSupabase._mocks.single.mockResolvedValue({
        data: {
          id: 'log-123',
          operation_type: 'update',
          entity_type: 'guest',
          entity_id: 'guest-456',
        },
        error: null,
      } as any);

      const result = await auditLogService.logUpdate(
        mockSupabase,
        'guest',
        'guest-456',
        { first_name: 'John' },
        { first_name: 'Jane' },
        'user-123',
        'user@example.com'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operation_type).toBe('update');
      }
    });

    it('logDelete should create audit log for delete operation', async () => {
      const mockSupabase = createMockSupabaseClient();

      mockSupabase._mocks.single.mockResolvedValue({
        data: {
          id: 'log-123',
          operation_type: 'delete',
          entity_type: 'guest',
          entity_id: 'guest-456',
        },
        error: null,
      } as any);

      const result = await auditLogService.logDelete(
        mockSupabase,
        'guest',
        'guest-456',
        { first_name: 'John' },
        'user-123',
        'user@example.com'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operation_type).toBe('delete');
      }
    });
  });
});
