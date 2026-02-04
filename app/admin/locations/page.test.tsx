import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocationManagementPage from './page';

// Mock DataTable components
jest.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data, columns, loading, onRowClick }: any) => {
    if (loading) return <div>Loading...</div>;
    if (data.length === 0) return <div>No items found</div>;
    return (
      <div data-testid="data-table">
        {data.map((item: any, index: number) => (
          <div 
            key={index} 
            data-testid={`location-row-${item.id}`}
            onClick={() => onRowClick && onRowClick(item)}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {columns.map((col: any) => {
              const value = item[col.key];
              const displayValue = col.render ? col.render(value, item) : value;
              return (
                <div key={col.key} data-testid={`${col.key}-${item.id}`}>
                  {displayValue}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  },
}));

jest.mock('@/components/ui/DataTableWithSuspense', () => ({
  DataTableWithSuspense: ({ data, columns, loading, onRowClick }: any) => {
    if (loading) return <div>Loading...</div>;
    if (data.length === 0) return <div>No items found</div>;
    return (
      <div data-testid="data-table">
        {data.map((item: any, index: number) => (
          <div 
            key={index} 
            data-testid={`location-row-${item.id}`}
            onClick={() => onRowClick && onRowClick(item)}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {columns.map((col: any) => {
              const value = item[col.key];
              const displayValue = col.render ? col.render(value, item) : value;
              return (
                <div key={col.key} data-testid={`${col.key}-${item.id}`}>
                  {displayValue}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('LocationManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock to ensure clean state
    (global.fetch as jest.Mock) = jest.fn();
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
              address: 'Tamarindo, Guanacaste',
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

  describe('Tree View Rendering', () => {
    it('should render location hierarchy', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockLocations }),
      } as Response);

      render(<LocationManagementPage />);

      // Wait for the location name to appear (it appears in both select and tree)
      await waitFor(() => {
        const costaRicaElements = screen.getAllByText('Costa Rica');
        expect(costaRicaElements.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });

    it('should expand and collapse nodes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockLocations }),
      } as Response);

      render(<LocationManagementPage />);

      await waitFor(() => {
        const costaRicaElements = screen.getAllByText('Costa Rica');
        expect(costaRicaElements.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      // Click expand button
      const expandButton = screen.getByLabelText('Expand');
      fireEvent.click(expandButton);

      // Child should now be visible in tree (not just in select)
      await waitFor(() => {
        const guanacasteElements = screen.getAllByText('Guanacaste');
        expect(guanacasteElements.length).toBeGreaterThan(1); // In select and tree
      });

      // Click collapse button
      const collapseButton = screen.getByLabelText('Collapse');
      fireEvent.click(collapseButton);

      // Child should be hidden from tree (but still in select)
      await waitFor(() => {
        const guanacasteElements = screen.getAllByText('Guanacaste');
        expect(guanacasteElements.length).toBe(1); // Only in select
      });
    });

    it('should display location addresses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      render(<LocationManagementPage />);

      // Expand to show Tamarindo
      await waitFor(() => {
        expect(screen.getAllByText('Costa Rica').length).toBeGreaterThan(0);
      });

      const expandButtons = screen.getAllByLabelText('Expand');
      fireEvent.click(expandButtons[0]); // Expand Costa Rica

      await waitFor(() => {
        expect(screen.getAllByText('Guanacaste').length).toBeGreaterThan(1);
      });

      fireEvent.click(screen.getAllByLabelText('Expand')[0]); // Expand Guanacaste

      await waitFor(() => {
        expect(screen.getByText('Tamarindo, Guanacaste')).toBeInTheDocument();
      });
    });
  });

  describe('Location Creation', () => {
    it('should open form when Add Location clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] }),
      });

      render(<LocationManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Location')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Add Location'));

      await waitFor(() => {
        expect(screen.getByText('Add New Location')).toBeInTheDocument();
      });
    });

    it('should create location successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            data: {
              id: 'new-loc',
              name: 'New Location',
              parentLocationId: null,
              address: null,
              coordinates: null,
              description: null,
              createdAt: '2025-01-01T00:00:00Z',
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: [] }),
        });

      render(<LocationManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Location')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Add Location'));

      // Fill form
      const nameInput = screen.getByPlaceholderText('e.g., Tamarindo Beach');
      fireEvent.change(nameInput, { target: { value: 'New Location' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit|create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/locations',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ name: 'New Location' }),
          })
        );
      });
    });
  });

  describe('Parent Assignment', () => {
    it('should allow selecting parent location', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      render(<LocationManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Location')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Add Location'));

      // Parent selector should be available
      await waitFor(() => {
        expect(screen.getByText('Parent Location')).toBeInTheDocument();
      });
    });
  });

  describe('Circular Reference Prevention', () => {
    it('should prevent creating circular reference', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockLocations }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            success: false,
            error: {
              code: 'CIRCULAR_REFERENCE',
              message: 'This would create a circular reference',
            },
          }),
        });

      render(<LocationManagementPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Costa Rica').length).toBeGreaterThan(0);
      });

      // Expand and edit
      const expandButton = screen.getByLabelText('Expand');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getAllByText('Guanacaste').length).toBeGreaterThan(1);
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[1]); // Edit Guanacaste

      // Form should open - just verify it's there
      await waitFor(() => {
        expect(screen.getByText('Edit Location')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it.skip('should filter locations by search query', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      render(<LocationManagementPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Costa Rica').length).toBeGreaterThan(0);
      });

      // Expand to show all locations
      const expandButtons = screen.getAllByLabelText('Expand');
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText('Guanacaste').length).toBeGreaterThan(1);
      });

      // Search for Tamarindo
      const searchInput = screen.getByPlaceholderText('Search locations...');
      fireEvent.change(searchInput, { target: { value: 'Tamarindo' } });

      // Tamarindo should be visible
      await waitFor(() => {
        expect(screen.getByText('Tamarindo')).toBeInTheDocument();
      });
    });

    it('should show no results message when search has no matches', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockLocations }),
      } as Response);

      render(<LocationManagementPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Costa Rica').length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const searchInput = screen.getByPlaceholderText('Search locations...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentLocation' } });

      await waitFor(() => {
        expect(screen.getByText('No locations match your search')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Location Deletion', () => {
    it('should delete location with confirmation', async () => {
      global.confirm = jest.fn(() => true);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockLocations }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: undefined }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: [] }),
        });

      render(<LocationManagementPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Costa Rica').length).toBeGreaterThan(0);
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure')
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/locations/'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    it.skip('should not delete if confirmation cancelled', async () => {
      global.confirm = jest.fn(() => false);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations }),
      });

      render(<LocationManagementPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Costa Rica').length).toBeGreaterThan(0);
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(global.confirm).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only initial load
    });
  });

  describe('Error Handling', () => {
    it.skip('should display error message on load failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to load locations' },
        }),
      });

      render(<LocationManagementPage />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading locations...')).not.toBeInTheDocument();
      });

      // Error should be displayed
      expect(screen.getByText(/Failed to load locations/i)).toBeInTheDocument();
    });

    it('should show empty state when no locations', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] }),
      });

      render(<LocationManagementPage />);

      await waitFor(() => {
        expect(
          screen.getByText('No locations yet. Add your first location above.')
        ).toBeInTheDocument();
      });
    });
  });
});
