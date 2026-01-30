// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn(),
  },
}));

// Mock cronService
jest.mock('./cronService', () => ({
  executeCronJob: jest.fn().mockImplementation(async (jobType, fn) => {
    try {
      const result = await fn();
      return {
        success: true,
        data: {
          jobType,
          status: 'completed',
          itemsProcessed: result.itemsProcessed,
          itemsFailed: result.itemsFailed,
          durationMs: 100,
          errors: [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }),
}));

// Mock Supabase client creation - service creates its own client
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn();
  const mockSupabaseClient = {
    from: mockFrom,
  };
  
  return {
    createClient: jest.fn(() => mockSupabaseClient),
    // Export mockFrom so we can access it in tests
    __mockFrom: mockFrom,
  };
});

// Import service AFTER mocking dependencies
import {
  cleanupTempFiles,
  cleanupExpiredSessions,
  cleanupOldAuditLogs,
  cleanupOldCronLogs,
  cleanupOldEmailLogs,
  cleanupOldWebhookLogs,
  runAllCleanupTasks,
} from './cleanupService';

// Get the mocked from function
const { __mockFrom: mockFrom } = require('@supabase/supabase-js');

describe('cleanupService', () => {
  const fs = require('fs').promises;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    
    // Reset Supabase mocks to default successful state
    const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
    const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
    mockFrom.mockReturnValue({ delete: mockDelete });
  });

  describe('cleanupTempFiles', () => {
    it('should return success with cleanup stats when files deleted', async () => {
      const mockFiles = ['old-file.tmp', 'recent-file.tmp'];
      const oldFileStats = { mtimeMs: Date.now() - 25 * 60 * 60 * 1000, size: 1024 }; // 25 hours old
      const recentFileStats = { mtimeMs: Date.now() - 1 * 60 * 60 * 1000, size: 512 }; // 1 hour old

      fs.access.mockResolvedValue(undefined);
      fs.readdir.mockResolvedValue(mockFiles);
      fs.stat
        .mockResolvedValueOnce(oldFileStats)
        .mockResolvedValueOnce(recentFileStats);
      fs.unlink.mockResolvedValue(undefined);

      const result = await cleanupTempFiles(24); // 24 hours

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filesDeleted).toBe(1);
        expect(result.data.bytesFreed).toBe(1024);
      }
      expect(fs.unlink).toHaveBeenCalledTimes(1);
    });

    it('should return success with zero stats when no files to delete', async () => {
      fs.access.mockResolvedValue(undefined);
      fs.readdir.mockResolvedValue([]);

      const result = await cleanupTempFiles(24);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filesDeleted).toBe(0);
        expect(result.data.bytesFreed).toBe(0);
      }
    });

    it('should return success with zero stats when temp directory does not exist', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const result = await cleanupTempFiles(24);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filesDeleted).toBe(0);
        expect(result.data.bytesFreed).toBe(0);
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      fs.access.mockResolvedValue(undefined);
      fs.readdir.mockRejectedValue(new Error('Unexpected error'));

      const result = await cleanupTempFiles(24);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should return success with zero sessions deleted (handled by Supabase Auth)', async () => {
      const result = await cleanupExpiredSessions();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionsDeleted).toBe(0);
      }
    });
  });

  describe('cleanupOldAuditLogs', () => {
    it('should return success with logs deleted count when logs cleaned up', async () => {
      const mockData = [{ id: 'log-1' }, { id: 'log-2' }];
      
      // Set up the complete mock chain for this specific test
      const mockSelect = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await cleanupOldAuditLogs(90);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logsDeleted).toBe(2);
      }
      expect(mockFrom).toHaveBeenCalledWith('audit_logs');
    });

    it('should return DATABASE_ERROR when delete operation fails', async () => {
      // Set up the mock chain to return an error
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
      });
      const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await cleanupOldAuditLogs(90);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return success with zero count when no data returned', async () => {
      // Set up the mock chain to return null data but no error
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await cleanupOldAuditLogs(90);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logsDeleted).toBe(0);
      }
    });
  });

  describe('cleanupOldCronLogs', () => {
    it('should return success with logs deleted count when logs cleaned up', async () => {
      const mockData = [{ id: 'log-1' }, { id: 'log-2' }, { id: 'log-3' }];
      
      // Set up the mock chain for this specific test
      const mockSelect = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await cleanupOldCronLogs(30);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logsDeleted).toBe(3);
      }
      expect(mockFrom).toHaveBeenCalledWith('cron_job_logs');
    });

    it('should return DATABASE_ERROR when delete operation fails', async () => {
      // Set up the mock chain for this specific test
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
      });
      const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await cleanupOldCronLogs(30);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('cleanupOldEmailLogs', () => {
    it('should return success with logs deleted count when logs cleaned up', async () => {
      const mockData = [{ id: 'log-1' }];
      
      // Set up the mock chain for this specific test
      const mockSelect = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await cleanupOldEmailLogs(180);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logsDeleted).toBe(1);
      }
      expect(mockFrom).toHaveBeenCalledWith('email_logs');
    });

    it('should return DATABASE_ERROR when delete operation fails', async () => {
      // Set up the mock chain for this specific test
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
      });
      const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await cleanupOldEmailLogs(180);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('cleanupOldWebhookLogs', () => {
    it('should return success with logs deleted count when logs cleaned up', async () => {
      const mockData = [{ id: 'log-1' }, { id: 'log-2' }];
      
      // Set up the mock chain for this specific test
      const mockSelect = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await cleanupOldWebhookLogs(30);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logsDeleted).toBe(2);
      }
      expect(mockFrom).toHaveBeenCalledWith('webhook_delivery_logs');
    });

    it('should return DATABASE_ERROR when delete operation fails', async () => {
      // Set up the mock chain for this specific test
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
      });
      const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await cleanupOldWebhookLogs(30);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('runAllCleanupTasks', () => {
    it('should return success when all cleanup tasks complete successfully', async () => {
      // Mock fs operations for temp file cleanup
      fs.access.mockResolvedValue(undefined);
      fs.readdir.mockResolvedValue([]);
      
      // Mock database operations for log cleanup - return empty arrays for successful cleanup
      const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await runAllCleanupTasks();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.itemsProcessed).toBeGreaterThanOrEqual(0);
        expect(result.data.itemsFailed).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle individual cleanup task failures gracefully', async () => {
      // Mock some cleanup functions to fail
      fs.access.mockRejectedValue(new Error('File system error'));
      
      // Mock database operations to fail for some operations
      const mockSelect = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error', code: 'CONNECTION_ERROR' } 
      });
      const mockLt = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ lt: mockLt });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await runAllCleanupTasks();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.itemsFailed).toBeGreaterThan(0);
      }
    });
  });
});