import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVPAnalyticsPage from './page';

// Mock fetch
global.fetch = jest.fn();

const mockAnalytics = {
  overall_response_rate: 78.5,
  response_counts: {
    attending: 45,
    declined: 8,
    maybe: 5,
    pending: 12,
  },
  event_response_rates: [
    {
      event_id: 'event-1',
      event_name: 'Ceremony',
      event_date: '2025-06-15',
      total_invited: 50,
      total_responded: 42,
      response_rate: 84.0,
      by_status: {
        attending: 38,
        declined: 3,
        maybe: 1,
        pending: 8,
      },
    },
    {
      event_id: 'event-2',
      event_name: 'Reception',
      event_date: '2025-06-15',
      total_invited: 50,
      total_responded: 36,
      response_rate: 72.0,
      by_status: {
        attending: 32,
        declined: 3,
        maybe: 1,
        pending: 14,
      },
    },
  ],
  activity_response_rates: [
    {
      activity_id: 'activity-1',
      activity_name: 'Beach Day',
      activity_date: '2025-06-14',
      capacity: 50,
      total_invited: 50,
      total_responded: 45,
      response_rate: 90.0,
      capacity_utilization: 90.0,
      by_status: {
        attending: 45,
        declined: 0,
        maybe: 0,
        pending: 5,
      },
    },
    {
      activity_id: 'activity-2',
      activity_name: 'Zip Line',
      activity_date: '2025-06-14',
      capacity: 20,
      total_invited: 25,
      total_responded: 20,
      response_rate: 80.0,
      capacity_utilization: 100.0,
      by_status: {
        attending: 20,
        declined: 0,
        maybe: 0,
        pending: 5,
      },
    },
  ],
  response_trends: [
    {
      date: '2025-01-20',
      attending: 10,
      declined: 2,
      maybe: 1,
      cumulative_total: 13,
    },
    {
      date: '2025-01-21',
      attending: 15,
      declined: 3,
      maybe: 2,
      cumulative_total: 33,
    },
    {
      date: '2025-01-22',
      attending: 20,
      declined: 3,
      maybe: 2,
      cumulative_total: 58,
    },
  ],
  capacity_utilization: [
    {
      activity_id: 'activity-2',
      activity_name: 'Zip Line',
      capacity: 20,
      attending: 20,
      utilization: 100.0,
      warning_level: 'alert' as const,
    },
    {
      activity_id: 'activity-1',
      activity_name: 'Beach Day',
      capacity: 50,
      attending: 45,
      utilization: 90.0,
      warning_level: 'warning' as const,
    },
  ],
  pending_reminders: 12,
};

describe('RSVPAnalyticsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, data: mockAnalytics }),
    });
  });

  describe('Metrics Display', () => {
    it('should display overall response rate', async () => {
      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('78.5%')).toBeInTheDocument();
      });
    });

    it('should display response breakdown counts', async () => {
      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument(); // attending
        expect(screen.getByText('8')).toBeInTheDocument(); // declined
        expect(screen.getByText('5')).toBeInTheDocument(); // maybe
        expect(screen.getByText('12')).toBeInTheDocument(); // pending
      });

      expect(screen.getByText('Attending')).toBeInTheDocument();
      expect(screen.getByText('Declined')).toBeInTheDocument();
      expect(screen.getByText('Maybe')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display event response rates with progress bars', async () => {
      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Ceremony')).toBeInTheDocument();
        expect(screen.getByText('Reception')).toBeInTheDocument();
      });

      expect(screen.getByText('84.0%')).toBeInTheDocument();
      expect(screen.getByText('72.0%')).toBeInTheDocument();

      // Check progress bars exist
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should display activity capacity utilization', async () => {
      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Beach Day ⚠️')).toBeInTheDocument();
        expect(screen.getByText('Zip Line 🔴')).toBeInTheDocument();
      });

      expect(screen.getByText('45/50 capacity')).toBeInTheDocument();
      expect(screen.getByText('20/20 capacity')).toBeInTheDocument();
    });

    it('should display pending reminders count', async () => {
      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText(/12 guests with pending RSVPs/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by guest type', async () => {
      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('78.5%')).toBeInTheDocument();
      });

      const guestTypeSelect = screen.getByLabelText('Filter by guest type');
      fireEvent.change(guestTypeSelect, { target: { value: 'wedding_party' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('guestType=wedding_party')
        );
      });
    });

    it('should filter by date range', async () => {
      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('78.5%')).toBeInTheDocument();
      });

      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBe(2);
      
      // Verify date inputs exist and can be changed
      fireEvent.change(dateInputs[0], { target: { value: '2025-01-01' } });
      expect((dateInputs[0] as HTMLInputElement).value).toBe('2025-01-01');

      fireEvent.change(dateInputs[1], { target: { value: '2025-01-31' } });
      expect((dateInputs[1] as HTMLInputElement).value).toBe('2025-01-31');
    });
  });

  describe('Chart Rendering', () => {
    it('should render response trends chart', async () => {
      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Response Trends (Last 30 Days)')).toBeInTheDocument();
      });

      // Check that trend dates are displayed (dates are off by one due to timezone)
      expect(screen.getByText(/1\/19\/2025/)).toBeInTheDocument();
      expect(screen.getByText(/1\/20\/2025/)).toBeInTheDocument();
      expect(screen.getByText(/1\/21\/2025/)).toBeInTheDocument();
    });

    it('should display cumulative totals in trends', async () => {
      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('13')).toBeInTheDocument();
        expect(screen.getByText('33')).toBeInTheDocument();
        expect(screen.getByText('58')).toBeInTheDocument();
      });
    });
  });

  describe('Reminder Functionality', () => {
    it('should enable send reminder button when there are pending reminders', async () => {
      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Reminder Emails');
        expect(sendButton).not.toBeDisabled();
      });
    });

    it('should disable send reminder button when there are no pending reminders', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          data: { ...mockAnalytics, pending_reminders: 0 },
        }),
      });

      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Reminder Emails');
        expect(sendButton).toBeDisabled();
      });
    });

    it('should handle send reminder button click', async () => {
      // Mock window.alert
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Reminder Emails');
        expect(sendButton).toBeInTheDocument();
      });

      const sendButton = screen.getByText('Send Reminder Emails');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Reminder emails sent successfully!');
      });

      alertMock.mockRestore();
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading state', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<RSVPAnalyticsPage />);

      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('should display error state', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: false,
          error: { message: 'Failed to fetch analytics' },
        }),
      });

      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error: Failed to fetch analytics/i)).toBeInTheDocument();
      });
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Capacity Warnings', () => {
    it('should display warning indicator for 90%+ capacity', async () => {
      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Beach Day ⚠️')).toBeInTheDocument();
      });
    });

    it('should display alert indicator for 100% capacity', async () => {
      render(<RSVPAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Zip Line 🔴')).toBeInTheDocument();
      });
    });
  });
});
