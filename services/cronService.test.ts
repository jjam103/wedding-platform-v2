// Mock Supabase before importing the service
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import {
  executeCronJob,
  getJobLogs,
  getJobStats,
  isJobRunning,
} from './cronService';

// Get the mocked supabase client
const { supabase } = require('@/lib/supabase');
const mockFrom = supabase.from as jest.Mock;

describe('cronService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeCronJob', () => {
    it('should return success when job function completes successfully', async () => {
      const mockJobFunction = jest.fn().mockResolvedValue({
        itemsProcessed: 10,
        itemsFailed: 0,
      });

      // Mock successful job log creation
      const mockJobLog = {
        id: 'job-log-123',
        job_type: 'rsvp_deadline_reminders',
        status: 'running',
        started_at: '2024-01-01T10:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockJobLog, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom
        .mockReturnValueOnce({ insert: mockInsert }) // For startJobLog
        .mockReturnValueOnce({ update: mockUpdate }); // For completeJobLog

      const result = await executeCronJob('rsvp_deadline_reminders', mockJobFunction);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.jobType).toBe('rsvp_deadline_reminders');
        expect(result.data.status).toBe('completed');
        expect(result.data.itemsProcessed).toBe(10);
        expect(result.data.itemsFailed).toBe(0);
      }
      expect(mockJobFunction).toHaveBeenCalled();
    });

    it('should return success with completed status when job has failures', async () => {
      const mockJobFunction = jest.fn().mockResolvedValue({
        itemsProcessed: 8,
        itemsFailed: 2,
      });

      const mockJobLog = {
        id: 'job-log-123',
        job_type: 'scheduled_email_processing',
        status: 'running',
        started_at: '2024-01-01T10:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockJobLog, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom
        .mockReturnValueOnce({ insert: mockInsert })
        .mockReturnValueOnce({ update: mockUpdate });

      const result = await executeCronJob('scheduled_email_processing', mockJobFunction);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('completed');
        expect(result.data.itemsProcessed).toBe(8);
        expect(result.data.itemsFailed).toBe(2);
      }
    });

    it('should return DATABASE_ERROR when job log creation fails', async () => {
      const mockJobFunction = jest.fn();

      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      mockFrom.mockReturnValue({ insert: mockInsert });

      const result = await executeCronJob('temp_file_cleanup', mockJobFunction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
      expect(mockJobFunction).not.toHaveBeenCalled();
    });

    it('should return CRON_JOB_ERROR when job function throws error', async () => {
      const mockJobFunction = jest.fn().mockRejectedValue(new Error('Job failed'));

      const mockJobLog = {
        id: 'job-log-123',
        job_type: 'expired_session_cleanup',
        status: 'running',
        started_at: '2024-01-01T10:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockJobLog, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom
        .mockReturnValueOnce({ insert: mockInsert })
        .mockReturnValueOnce({ update: mockUpdate });

      const result = await executeCronJob('expired_session_cleanup', mockJobFunction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CRON_JOB_ERROR');
        expect(result.error.message).toContain('Job failed');
      }
    });

    it('should update job log with failure when job function fails', async () => {
      const mockJobFunction = jest.fn().mockRejectedValue(new Error('Job failed'));

      const mockJobLog = {
        id: 'job-log-123',
        job_type: 'expired_session_cleanup',
        status: 'running',
        started_at: '2024-01-01T10:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockJobLog, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom
        .mockReturnValueOnce({ insert: mockInsert })
        .mockReturnValueOnce({ update: mockUpdate });

      await executeCronJob('expired_session_cleanup', mockJobFunction);

      // Verify update was called with failure status
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'failed',
        completed_at: expect.any(String),
        duration_ms: expect.any(Number),
        items_processed: 0,
        items_failed: 0,
        error_message: 'Job failed',
      });
    });
  });

  describe('getJobLogs', () => {
    it('should return success with job logs when no filters provided', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          job_type: 'rsvp_deadline_reminders',
          status: 'completed',
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T10:05:00Z',
          duration_ms: 300000,
          items_processed: 10,
          items_failed: 0,
        },
        {
          id: 'log-2',
          job_type: 'temp_file_cleanup',
          status: 'completed',
          started_at: '2024-01-01T11:00:00Z',
          completed_at: '2024-01-01T11:02:00Z',
          duration_ms: 120000,
          items_processed: 5,
          items_failed: 0,
        },
      ];

      const mockLimit = jest.fn().mockResolvedValue({ data: mockLogs, error: null });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getJobLogs();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockLogs);
      }
    });

    it.skip('should return success with filtered job logs when job type provided', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          job_type: 'rsvp_deadline_reminders',
          status: 'completed',
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T10:05:00Z',
          duration_ms: 300000,
          items_processed: 10,
          items_failed: 0,
        },
      ];

      // Mock the query chain: from -> select -> order -> limit -> eq
      // The final query object is awaited directly with destructuring
      const mockQuery = {
        then: jest.fn().mockResolvedValue({ data: mockLogs, error: null }),
        eq: jest.fn().mockReturnThis(),
      };
      
      const mockLimit = jest.fn().mockReturnValue(mockQuery);
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getJobLogs('rsvp_deadline_reminders', 50);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockLogs);
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
      });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getJobLogs();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return success with empty array when no data returned', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getJobLogs();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('getJobStats', () => {
    it('should return success with job statistics when logs exist', async () => {
      const mockLogs = [
        { status: 'completed', duration_ms: 1000, items_processed: 5, items_failed: 0 },
        { status: 'completed', duration_ms: 2000, items_processed: 3, items_failed: 1 },
        { status: 'failed', duration_ms: 500, items_processed: 0, items_failed: 2 },
      ];

      const mockSelect = jest.fn().mockResolvedValue({ data: mockLogs, error: null });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getJobStats();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalExecutions).toBe(3);
        expect(result.data.successfulExecutions).toBe(2);
        expect(result.data.failedExecutions).toBe(1);
        expect(result.data.averageDurationMs).toBeCloseTo(1166.67, 2); // (1000+2000+500)/3
        expect(result.data.totalItemsProcessed).toBe(8);
        expect(result.data.totalItemsFailed).toBe(3);
      }
    });

    it('should return success with zero stats when no logs exist', async () => {
      const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getJobStats();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalExecutions).toBe(0);
        expect(result.data.successfulExecutions).toBe(0);
        expect(result.data.failedExecutions).toBe(0);
        expect(result.data.averageDurationMs).toBe(0);
        expect(result.data.totalItemsProcessed).toBe(0);
        expect(result.data.totalItemsFailed).toBe(0);
      }
    });

    it('should apply job type filter when provided', async () => {
      const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      await getJobStats('rsvp_deadline_reminders');

      expect(mockEq).toHaveBeenCalledWith('job_type', 'rsvp_deadline_reminders');
    });

    it('should apply since filter when provided', async () => {
      const mockGte = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = jest.fn().mockReturnValue({ gte: mockGte });
      mockFrom.mockReturnValue({ select: mockSelect });

      await getJobStats(undefined, '2024-01-01T00:00:00Z');

      expect(mockGte).toHaveBeenCalledWith('started_at', '2024-01-01T00:00:00Z');
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getJobStats();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('isJobRunning', () => {
    it('should return success with true when job is running', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: [{ id: 'job-1', status: 'running' }],
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await isJobRunning('rsvp_deadline_reminders');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should return success with false when job is not running', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq2 = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await isJobRunning('scheduled_email_processing');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
      });
      const mockEq2 = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await isJobRunning('temp_file_cleanup');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return success with false when no data returned', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq2 = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await isJobRunning('temp_file_cleanup');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });
});