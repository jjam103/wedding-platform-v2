import { render, screen, waitFor } from '@testing-library/react';
import { GuestDashboard } from './GuestDashboard';
import type { Guest } from '@/types';

// Mock fetch
global.fetch = jest.fn();

const mockGuest: Guest = {
  id: 'guest-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  age_type: 'adult',
  guest_type: 'wedding_guest',
  group_id: 'group-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockWeddingInfo = {
  date: '2024-12-25T00:00:00Z',
  location: 'Manuel Antonio, Costa Rica',
  venue: 'Arenas del Mar Resort',
};

const mockAnnouncements = [
  {
    id: 'ann-1',
    title: 'Important Update',
    message: 'Please RSVP by December 1st',
    urgent: true,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'ann-2',
    title: 'Welcome',
    message: 'We are excited to celebrate with you!',
    urgent: false,
    created_at: '2024-01-10T00:00:00Z',
  },
];

const mockUpcomingEvents = [
  {
    id: 'event-1',
    name: 'Welcome Reception',
    type: 'event' as const,
    date: '2024-12-24T18:00:00Z',
    time: '6:00 PM',
    location: 'Beach Pavilion',
    rsvpStatus: 'pending' as const,
  },
  {
    id: 'event-2',
    name: 'Wedding Ceremony',
    type: 'event' as const,
    date: '2024-12-25T16:00:00Z',
    time: '4:00 PM',
    location: 'Oceanfront Terrace',
    rsvpStatus: 'attending' as const,
  },
];

const mockRsvps = [
  { id: 'rsvp-1', status: 'attending' },
  { id: 'rsvp-2', status: 'attending' },
  { id: 'rsvp-3', status: 'pending' },
  { id: 'rsvp-4', status: 'maybe' },
  { id: 'rsvp-5', status: 'declined' },
];

describe('GuestDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/guest/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUpcomingEvents }),
        });
      }
      if (url.includes('/api/guest/rsvps')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockRsvps }),
        });
      }
      if (url.includes('/api/guest/wedding-info')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockWeddingInfo }),
        });
      }
      if (url.includes('/api/guest/announcements')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockAnnouncements }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false }),
      });
    });
  });

  it('should render welcome message with guest name', async () => {
    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      expect(screen.getByText(/¡Pura Vida, John!/i)).toBeInTheDocument();
    });
  });

  it('should display wedding date, location, and venue', async () => {
    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      expect(screen.getByText(/Costa Rica Wedding/i)).toBeInTheDocument();
      expect(screen.getByText(/Manuel Antonio, Costa Rica/i)).toBeInTheDocument();
      expect(screen.getByText(/Arenas del Mar Resort/i)).toBeInTheDocument();
    });
  });

  it('should display RSVP summary with correct counts', async () => {
    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      expect(screen.getByText('Total Events:')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // total
      expect(screen.getByText('2')).toBeInTheDocument(); // attending
      expect(screen.getByText('1')).toBeInTheDocument(); // pending, maybe, declined
    });
  });

  it('should display upcoming events', async () => {
    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Reception')).toBeInTheDocument();
      expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      expect(screen.getByText('Beach Pavilion')).toBeInTheDocument();
      expect(screen.getByText('Oceanfront Terrace')).toBeInTheDocument();
    });
  });

  it('should display RSVP status for each event', async () => {
    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      expect(screen.getByText('Pending Response')).toBeInTheDocument();
      expect(screen.getByText('Attending')).toBeInTheDocument();
    });
  });

  it('should display quick action links', async () => {
    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      expect(screen.getByText(/Family Information/i)).toBeInTheDocument();
      expect(screen.getByText(/Transportation Details/i)).toBeInTheDocument();
      expect(screen.getByText(/Accommodation Info/i)).toBeInTheDocument();
      expect(screen.getByText(/Upload Photos/i)).toBeInTheDocument();
      expect(screen.getByText(/View Itinerary/i)).toBeInTheDocument();
    });
  });

  it('should display urgent announcements first', async () => {
    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      const announcements = screen.getAllByRole('heading', { level: 3 });
      const urgentIndex = announcements.findIndex((h) => h.textContent === 'Important Update');
      const normalIndex = announcements.findIndex((h) => h.textContent === 'Welcome');
      
      expect(urgentIndex).toBeLessThan(normalIndex);
    });
  });

  it('should display urgent indicator for urgent announcements', async () => {
    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    render(<GuestDashboard guest={mockGuest} />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false }),
      })
    );

    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load dashboard data/i)).toBeInTheDocument();
    });
  });

  it('should show "Respond to RSVP" button for pending events', async () => {
    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      expect(screen.getByText('Respond to RSVP')).toBeInTheDocument();
    });
  });

  it('should not show "Respond to RSVP" button for non-pending events', async () => {
    const eventsWithoutPending = mockUpcomingEvents.filter(
      (e) => e.rsvpStatus !== 'pending'
    );

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/guest/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: eventsWithoutPending }),
        });
      }
      if (url.includes('/api/guest/rsvps')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockRsvps }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    });

    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      expect(screen.queryByText('Respond to RSVP')).not.toBeInTheDocument();
    });
  });

  it('should display "Manage RSVPs" button', async () => {
    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      expect(screen.getByText('Manage RSVPs')).toBeInTheDocument();
    });
  });

  it('should show message when no upcoming events', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/guest/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      }
      if (url.includes('/api/guest/rsvps')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    });

    render(<GuestDashboard guest={mockGuest} />);

    await waitFor(() => {
      expect(screen.getByText(/No upcoming events at this time/i)).toBeInTheDocument();
    });
  });
});
