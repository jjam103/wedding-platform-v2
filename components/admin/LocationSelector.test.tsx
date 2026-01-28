import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationSelector } from './LocationSelector';

// Mock fetch
global.fetch = jest.fn();

describe('LocationSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockLocations = [
    {
      id: 'loc-1',
      name: 'Costa Rica',
      parentLocationId: null,
      address: null,
      coordinates: null,
      description: null,
      createdAt: '2025-01-01T00:00:00Z',
      children: [
        {
          id: 'loc-2',
          name: 'Guanacaste',
          parentLocationId: 'loc-1',
          address: null,
          coordinates: null,
          description: null,
          createdAt: '2025-01-01T00:00:00Z',
          children: [
            {
              id: 'loc-3',
              name: 'Tamarindo',
              parentLocationId: 'loc-2',
              address: null,
              coordinates: null,
              description: null,
              createdAt: '2025-01-01T00:00:00Z',
              children: [],
            },
          ],
        },
      ],
    },
  ];

  describe('Hierarchy Display', () => {
    it('should display location hierarchy with arrows', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(<LocationSelector value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByText('Select a location')).toBeInTheDocument();
      });

      // Open dropdown
      fireEvent.click(screen.getByText('Select a location'));

      await waitFor(() => {
        expect(screen.getByText('Costa Rica')).toBeInTheDocument();
        expect(screen.getByText('Costa Rica → Guanacaste')).toBeInTheDocument();
        expect(
          screen.getByText('Costa Rica → Guanacaste → Tamarindo')
        ).toBeInTheDocument();
      });
    });

    it('should show selected location path', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(<LocationSelector value="loc-3" onChange={onChange} />);

      await waitFor(() => {
        expect(
          screen.getByText('Costa Rica → Guanacaste → Tamarindo')
        ).toBeInTheDocument();
      });
    });

    it('should display placeholder when no selection', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(
        <LocationSelector
          value={null}
          onChange={onChange}
          placeholder="Choose location"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Choose location')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter locations by search query', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(<LocationSelector value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByText('Select a location')).toBeInTheDocument();
      });

      // Open dropdown
      fireEvent.click(screen.getByText('Select a location'));

      await waitFor(() => {
        expect(screen.getByText('Costa Rica')).toBeInTheDocument();
      });

      // Search for Tamarindo
      const searchInput = screen.getByPlaceholderText('Search locations...');
      fireEvent.change(searchInput, { target: { value: 'Tamarindo' } });

      await waitFor(() => {
        expect(
          screen.getByText('Costa Rica → Guanacaste → Tamarindo')
        ).toBeInTheDocument();
        expect(screen.queryByText(/^Costa Rica$/)).not.toBeInTheDocument();
      });
    });

    it('should show no results when search has no matches', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(<LocationSelector value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByText('Select a location')).toBeInTheDocument();
      });

      // Open dropdown
      fireEvent.click(screen.getByText('Select a location'));

      await waitFor(() => {
        expect(screen.getByText('Costa Rica')).toBeInTheDocument();
      });

      // Search for non-existent location
      const searchInput = screen.getByPlaceholderText('Search locations...');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      await waitFor(() => {
        expect(screen.getByText('No locations found')).toBeInTheDocument();
      });
    });

    it('should clear search when selection made', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(<LocationSelector value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByText('Select a location')).toBeInTheDocument();
      });

      // Open dropdown
      fireEvent.click(screen.getByText('Select a location'));

      await waitFor(() => {
        expect(screen.getByText('Costa Rica')).toBeInTheDocument();
      });

      // Search
      const searchInput = screen.getByPlaceholderText('Search locations...');
      fireEvent.change(searchInput, { target: { value: 'Tamarindo' } });

      // Select location
      fireEvent.click(screen.getByText('Costa Rica → Guanacaste → Tamarindo'));

      expect(onChange).toHaveBeenCalledWith('loc-3');
    });
  });

  describe('Selection Handling', () => {
    it('should call onChange when location selected', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(<LocationSelector value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByText('Select a location')).toBeInTheDocument();
      });

      // Open dropdown
      fireEvent.click(screen.getByText('Select a location'));

      await waitFor(() => {
        expect(screen.getByText('Costa Rica')).toBeInTheDocument();
      });

      // Select location
      fireEvent.click(screen.getByText('Costa Rica'));

      expect(onChange).toHaveBeenCalledWith('loc-1');
    });

    it('should close dropdown after selection', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(<LocationSelector value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByText('Select a location')).toBeInTheDocument();
      });

      // Open dropdown
      fireEvent.click(screen.getByText('Select a location'));

      await waitFor(() => {
        expect(screen.getByText('Costa Rica')).toBeInTheDocument();
      });

      // Select location
      fireEvent.click(screen.getByText('Costa Rica'));

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search locations...')).not.toBeInTheDocument();
      });
    });

    it('should allow selecting None when not required', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(<LocationSelector value="loc-1" onChange={onChange} required={false} />);

      await waitFor(() => {
        expect(screen.getByText('Costa Rica')).toBeInTheDocument();
      });

      // Open dropdown
      fireEvent.click(screen.getByText('Costa Rica'));

      await waitFor(() => {
        expect(screen.getByText('None')).toBeInTheDocument();
      });

      // Select None
      fireEvent.click(screen.getByText('None'));

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('should not show None option when required', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(<LocationSelector value={null} onChange={onChange} required={true} />);

      await waitFor(() => {
        expect(screen.getByText('Select a location')).toBeInTheDocument();
      });

      // Open dropdown
      fireEvent.click(screen.getByText('Select a location'));

      await waitFor(() => {
        expect(screen.getByText('Costa Rica')).toBeInTheDocument();
      });

      expect(screen.queryByText('None')).not.toBeInTheDocument();
    });
  });

  describe('Exclude Location', () => {
    it('should exclude specified location and its descendants', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(<LocationSelector value={null} onChange={onChange} excludeId="loc-2" />);

      await waitFor(() => {
        expect(screen.getByText('Select a location')).toBeInTheDocument();
      });

      // Open dropdown
      fireEvent.click(screen.getByText('Select a location'));

      await waitFor(() => {
        expect(screen.getByText('Costa Rica')).toBeInTheDocument();
      });

      // Guanacaste and its children should not be visible
      expect(screen.queryByText(/Guanacaste/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Tamarindo/)).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      );

      const onChange = jest.fn();
      render(<LocationSelector value={null} onChange={onChange} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Dropdown Behavior', () => {
    it('should close dropdown when clicking outside', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(<LocationSelector value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByText('Select a location')).toBeInTheDocument();
      });

      // Open dropdown
      fireEvent.click(screen.getByText('Select a location'));

      await waitFor(() => {
        expect(screen.getByText('Costa Rica')).toBeInTheDocument();
      });

      // Click backdrop
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search locations...')).not.toBeInTheDocument();
      });
    });

    it('should toggle dropdown on button click', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      const onChange = jest.fn();
      render(<LocationSelector value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByText('Select a location')).toBeInTheDocument();
      });

      const button = screen.getByText('Select a location');

      // Open
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText('Costa Rica')).toBeInTheDocument();
      });

      // Close
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.queryByText('Costa Rica')).not.toBeInTheDocument();
      });
    });
  });
});
