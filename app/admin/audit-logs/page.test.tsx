import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuditLogsPage from './page';
import type { AuditLog } from '@/services/auditLogService';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
  usePathname: jest.fn(() => '/admin/audit-logs'),
}));

// Mock fetch
global.fetch = jest.fn();

const mockLogs: AuditLog[] = [
  {
    id: 'log-1',
    user_id: 'user-1',
    user_email: 'admin@example.com',
    entity_type: 'guest',
    entity_id: 'guest-1',
    operation_type: 'create',
    old_data: null,
    new_data: { first_name: 'John', last_name: 'Doe' },
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    created_at: '2025-01-27T10:00:00.000Z',
  },
  {
    id: 'log-2',
    user_id: 'user-1',
    user_email: 'admin@example.com',
    entity_type: 'event',
    entity_id: 'event-1',
    operation_type: 'update',
    old_data: { title: 'Old Title' },
    new_data: { title: 'New Title' },
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    created_at: '2025-01-27T11:00:00.000Z',
  },
  {
    id: 'log-3',
    user_id: 'user-2',
    user_email: 'owner@example.com',
    entity_type: 'vendor',
    entity_id: 'vendor-1',
    operation_type: 'delete',
    old_data: { name: 'Vendor Name' },
    new_data: null,
    ip_address: '192.168.1.2',
    user_agent: 'Mozilla/5.0',
    created_at: '2025-01-27T12:00:00.000Z',
  },
];

const mockSuccessResponse = {
  success: true,
  data: {
    logs: mockLogs,
    total: 3,
    page: 1,
    page_size: 50,
    total_pages: 1,
  },
};

describe('AuditLogsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse,
    });
  });

  describe('Log Display', () => {
    it('should render audit logs page with title', async () => {
      render(<AuditLogsPage />);

      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
      expect(
        screen.getByText('View and search system audit logs for accountability')
      ).toBeInTheDocument();
    });

    it('should display audit logs after loading', async () => {
      render(<AuditLogsPage />);

      await waitFor(
        () => {
          expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText('owner@example.com')).toBeInTheDocument();
    });

    it('should display action badges', async () => {
      render(<AuditLogsPage />);

      await waitFor(
        () => {
          expect(screen.getByText('CREATE')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText('UPDATE')).toBeInTheDocument();
      expect(screen.getByText('DELETE')).toBeInTheDocument();
    });

    it('should highlight critical actions', async () => {
      render(<AuditLogsPage />);

      await waitFor(
        () => {
          expect(screen.getByText('⚠️ Critical Action')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Filtering', () => {
    it('should have filter controls', () => {
      render(<AuditLogsPage />);

      expect(screen.getByLabelText('Search')).toBeInTheDocument();
      expect(screen.getByLabelText('Action Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Entity Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Date Range')).toBeInTheDocument();
    });

    it('should call API with filters when action type changes', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const actionSelect = screen.getByLabelText('Action Type');
      fireEvent.change(actionSelect, { target: { value: 'create' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('operation_type=create')
        );
      });
    });

    it('should clear filters when clear button clicked', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Clear Filters')).toBeInTheDocument();
      });

      const actionSelect = screen.getByLabelText('Action Type');
      fireEvent.change(actionSelect, { target: { value: 'create' } });

      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);

      expect(actionSelect).toHaveValue('');
    });
  });

  describe('Search', () => {
    it('should filter logs client-side when searching', async () => {
      render(<AuditLogsPage />);

      await waitFor(
        () => {
          expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const searchInput = screen.getByPlaceholderText('Search descriptions...');
      fireEvent.change(searchInput, { target: { value: 'guest' } });

      // Should still show guest-related log
      await waitFor(() => {
        expect(screen.getByText('guest')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination when multiple pages exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            logs: mockLogs,
            total: 150,
            page: 1,
            page_size: 50,
            total_pages: 3,
          },
        }),
      });

      render(<AuditLogsPage />);

      await waitFor(
        () => {
          expect(screen.getByText(/Showing page 1 of 3/)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should disable Previous button on first page', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            logs: mockLogs,
            total: 150,
            page: 1,
            page_size: 50,
            total_pages: 3,
          },
        }),
      });

      render(<AuditLogsPage />);

      await waitFor(
        () => {
          const prevButton = screen.getByText('Previous');
          expect(prevButton).toBeDisabled();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('CSV Export', () => {
    it('should have export button', () => {
      render(<AuditLogsPage />);

      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('should call export API when export button clicked', async () => {
      const mockBlob = new Blob(['csv content'], { type: 'text/csv' });
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => mockBlob,
        });

      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/audit-logs/export')
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database connection failed',
          },
        }),
      });

      render(<AuditLogsPage />);

      await waitFor(
        () => {
          expect(screen.getByText('Database connection failed')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should display empty message when no logs found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            logs: [],
            total: 0,
            page: 1,
            page_size: 50,
            total_pages: 0,
          },
        }),
      });

      render(<AuditLogsPage />);

      await waitFor(
        () => {
          expect(screen.getByText('No audit logs found')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });
});
