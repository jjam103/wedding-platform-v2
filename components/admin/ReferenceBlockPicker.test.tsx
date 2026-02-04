import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReferenceBlockPicker } from './ReferenceBlockPicker';

// Mock fetch
global.fetch = jest.fn();

describe('ReferenceBlockPicker', () => {
  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();
  const defaultProps = {
    onSelect: mockOnSelect,
    onClose: mockOnClose,
    pageType: 'home',
    pageId: 'test-page-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('should render the modal with title and search input', () => {
      render(<ReferenceBlockPicker {...defaultProps} />);

      expect(screen.getByText('Add Reference Block')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search events, activities/i)).toBeInTheDocument();
    });

    it('should render all type filter buttons', () => {
      render(<ReferenceBlockPicker {...defaultProps} />);

      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Activities')).toBeInTheDocument();
      expect(screen.getByText('Pages')).toBeInTheDocument();
      expect(screen.getByText('Accommodations')).toBeInTheDocument();
    });

    it('should show empty state when no search query', () => {
      render(<ReferenceBlockPicker {...defaultProps} />);

      expect(screen.getByText('Start typing to search')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<ReferenceBlockPicker {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should debounce search input and call API after 300ms', async () => {
      const mockResponse = {
        success: true,
        data: {
          events: [{ id: '1', name: 'Test Event', date: '2024-06-15', location: 'Beach' }],
          activities: [],
          content_pages: [],
          accommodations: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<ReferenceBlockPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/Search events, activities/i);
      await userEvent.type(searchInput, 'ceremony');

      // Should not call immediately
      expect(global.fetch).not.toHaveBeenCalled();

      // Should call after debounce delay
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/references/search?q=ceremony')
        );
      }, { timeout: 500 });
    });

    it('should display search results grouped by type', async () => {
      const mockResponse = {
        success: true,
        data: {
          events: [{ id: '1', name: 'Wedding Ceremony', date: '2024-06-15', location: 'Beach' }],
          activities: [{ id: '2', name: 'Beach Volleyball', date: '2024-06-14', capacity: 20 }],
          content_pages: [{ id: '3', title: 'Our Story', slug: 'our-story', type: 'page' }],
          accommodations: [{ id: '4', name: 'Beach Resort', location: 'Costa Rica', room_count: 50 }],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<ReferenceBlockPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/Search events, activities/i);
      await userEvent.type(searchInput, 'test');

      await waitFor(() => {
        expect(screen.getByText('Events (1)')).toBeInTheDocument();
        expect(screen.getByText('Activities (1)')).toBeInTheDocument();
        expect(screen.getByText('Content Pages (1)')).toBeInTheDocument();
        expect(screen.getByText('Accommodations (1)')).toBeInTheDocument();
      });

      expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      expect(screen.getByText('Our Story')).toBeInTheDocument();
      expect(screen.getByText('Beach Resort')).toBeInTheDocument();
    });

    it('should show no results message when search returns empty', async () => {
      const mockResponse = {
        success: true,
        data: {
          events: [],
          activities: [],
          content_pages: [],
          accommodations: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<ReferenceBlockPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/Search events, activities/i);
      await userEvent.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
    });

    it('should show loading spinner during search', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, data: { events: [], activities: [], content_pages: [], accommodations: [] } }),
        }), 100))
      );

      render(<ReferenceBlockPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/Search events, activities/i);
      await userEvent.type(searchInput, 'test');

      await waitFor(() => {
        expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
      });
    });

    it('should display error message when search fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<ReferenceBlockPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/Search events, activities/i);
      await userEvent.type(searchInput, 'test');

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Type Filtering', () => {
    it('should toggle type filters when clicked', async () => {
      render(<ReferenceBlockPicker {...defaultProps} />);

      const eventsButton = screen.getByText('Events');
      
      // Initially selected (all types selected by default)
      expect(eventsButton).toHaveClass('border-purple-500');

      // Click to deselect
      await userEvent.click(eventsButton);
      expect(eventsButton).toHaveClass('border-transparent');

      // Click to select again
      await userEvent.click(eventsButton);
      expect(eventsButton).toHaveClass('border-purple-500');
    });

    it('should include selected types in search query', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { events: [], activities: [], content_pages: [], accommodations: [] } }),
      });

      render(<ReferenceBlockPicker {...defaultProps} />);

      // Deselect activities and pages
      await userEvent.click(screen.getByText('Activities'));
      await userEvent.click(screen.getByText('Pages'));

      const searchInput = screen.getByPlaceholderText(/Search events, activities/i);
      await userEvent.type(searchInput, 'test');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('types=event,accommodation')
        );
      });
    });
  });

  describe('Reference Selection', () => {
    it('should call onSelect with event reference when event card clicked', async () => {
      const mockResponse = {
        success: true,
        data: {
          events: [{ id: 'event-1', name: 'Wedding Ceremony', date: '2024-06-15', location: 'Beach' }],
          activities: [],
          content_pages: [],
          accommodations: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<ReferenceBlockPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/Search events, activities/i);
      await userEvent.type(searchInput, 'ceremony');

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      });

      const eventCard = screen.getByText('Wedding Ceremony').closest('div');
      await userEvent.click(eventCard!);

      expect(mockOnSelect).toHaveBeenCalledWith({
        type: 'event',
        id: 'event-1',
        name: 'Wedding Ceremony',
        metadata: { date: '2024-06-15', location: 'Beach' },
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onSelect with activity reference when activity card clicked', async () => {
      const mockResponse = {
        success: true,
        data: {
          events: [],
          activities: [{ id: 'activity-1', name: 'Beach Volleyball', date: '2024-06-14', capacity: 20 }],
          content_pages: [],
          accommodations: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<ReferenceBlockPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/Search events, activities/i);
      await userEvent.type(searchInput, 'volleyball');

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      });

      const activityCard = screen.getByText('Beach Volleyball').closest('div');
      await userEvent.click(activityCard!);

      expect(mockOnSelect).toHaveBeenCalledWith({
        type: 'activity',
        id: 'activity-1',
        name: 'Beach Volleyball',
        metadata: { date: '2024-06-14', capacity: 20 },
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Modal Interactions', () => {
    it('should call onClose when close button clicked', async () => {
      render(<ReferenceBlockPicker {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close');
      await userEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when cancel button clicked', async () => {
      render(<ReferenceBlockPicker {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Result Display', () => {
    it('should display event metadata correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          events: [{ id: '1', name: 'Wedding Ceremony', date: '2024-06-15', location: 'Sunset Beach' }],
          activities: [],
          content_pages: [],
          accommodations: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<ReferenceBlockPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/Search events, activities/i);
      await userEvent.type(searchInput, 'ceremony');

      await waitFor(() => {
        expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
        expect(screen.getByText(/6\/15\/2024/)).toBeInTheDocument();
        expect(screen.getByText(/Sunset Beach/)).toBeInTheDocument();
      });
    });

    it('should display activity capacity correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          events: [],
          activities: [{ id: '1', name: 'Beach Volleyball', date: '2024-06-14', capacity: 20 }],
          content_pages: [],
          accommodations: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<ReferenceBlockPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/Search events, activities/i);
      await userEvent.type(searchInput, 'volleyball');

      await waitFor(() => {
        expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
        expect(screen.getByText(/Capacity: 20/)).toBeInTheDocument();
      });
    });

    it('should display content page slug correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          events: [],
          activities: [],
          content_pages: [{ id: '1', title: 'Our Story', slug: 'our-story', type: 'page' }],
          accommodations: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<ReferenceBlockPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/Search events, activities/i);
      await userEvent.type(searchInput, 'story');

      await waitFor(() => {
        expect(screen.getByText('Our Story')).toBeInTheDocument();
        expect(screen.getByText(/\/our-story/)).toBeInTheDocument();
      });
    });
  });
});
