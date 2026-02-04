/**
 * Unit Tests: DeletedItemsManager Component
 * 
 * Tests deleted items display, filtering, and actions.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeletedItemsManager } from './DeletedItemsManager';

// Mock fetch
global.fetch = jest.fn();

describe('DeletedItemsManager', () => {
  const mockOnRestore = jest.fn();
  const mockOnPermanentDelete = jest.fn();

  const mockDeletedItems = [
    {
      id: '1',
      type: 'content_page' as const,
      name: 'Test Page',
      deleted_at: '2024-01-15T10:00:00Z',
      deleted_by_email: 'admin@example.com',
    },
    {
      id: '2',
      type: 'event' as const,
      name: 'Test Event',
      deleted_at: '2024-01-16T10:00:00Z',
      deleted_by_email: 'admin@example.com',
    },
    {
      id: '3',
      type: 'activity' as const,
      name: 'Test Activity',
      deleted_at: '2024-01-17T10:00:00Z',
      deleted_by_email: 'admin@example.com',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, data: mockDeletedItems }),
    });
  });

  it('should render deleted items list', async () => {
    render(
      <DeletedItemsManager
        onRestore={mockOnRestore}
        onPermanentDelete={mockOnPermanentDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    render(
      <DeletedItemsManager
        onRestore={mockOnRestore}
        onPermanentDelete={mockOnPermanentDelete}
      />
    );

    expect(screen.getByText('Loading deleted items...')).toBeInTheDocument();
  });

  it('should display error state', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: false, error: { message: 'Test error' } }),
    });

    render(
      <DeletedItemsManager
        onRestore={mockOnRestore}
        onPermanentDelete={mockOnPermanentDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Test error/)).toBeInTheDocument();
    });
  });

  it('should filter items by type', async () => {
    render(
      <DeletedItemsManager
        onRestore={mockOnRestore}
        onPermanentDelete={mockOnPermanentDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    // Change filter to events
    const typeFilter = screen.getByLabelText('Filter by type');
    fireEvent.change(typeFilter, { target: { value: 'event' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=event')
      );
    });
  });

  it('should filter items by search query', async () => {
    render(
      <DeletedItemsManager
        onRestore={mockOnRestore}
        onPermanentDelete={mockOnPermanentDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    // Search for "Event"
    const searchInput = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(searchInput, { target: { value: 'Event' } });

    // Should show only Event
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.queryByText('Test Page')).not.toBeInTheDocument();
  });

  it('should call onRestore when restore button clicked', async () => {
    // Mock window.confirm
    global.confirm = jest.fn(() => true);

    render(
      <DeletedItemsManager
        onRestore={mockOnRestore}
        onPermanentDelete={mockOnPermanentDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    // Click restore button
    const restoreButtons = screen.getAllByText('Restore');
    fireEvent.click(restoreButtons[0]);

    await waitFor(() => {
      expect(mockOnRestore).toHaveBeenCalledWith('1', 'content_page');
    });
  });

  it('should call onPermanentDelete when delete permanently button clicked', async () => {
    // Mock window.confirm
    global.confirm = jest.fn(() => true);

    render(
      <DeletedItemsManager
        onRestore={mockOnRestore}
        onPermanentDelete={mockOnPermanentDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    // Click delete permanently button
    const deleteButtons = screen.getAllByText('Delete Permanently');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockOnPermanentDelete).toHaveBeenCalledWith('1', 'content_page');
    });
  });

  it('should not call onRestore if user cancels confirmation', async () => {
    // Mock window.confirm to return false
    global.confirm = jest.fn(() => false);

    render(
      <DeletedItemsManager
        onRestore={mockOnRestore}
        onPermanentDelete={mockOnPermanentDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    // Click restore button
    const restoreButtons = screen.getAllByText('Restore');
    fireEvent.click(restoreButtons[0]);

    // Should not call onRestore
    expect(mockOnRestore).not.toHaveBeenCalled();
  });

  it('should display empty state when no items', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, data: [] }),
    });

    render(
      <DeletedItemsManager
        onRestore={mockOnRestore}
        onPermanentDelete={mockOnPermanentDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No deleted items')).toBeInTheDocument();
    });
  });

  it('should refresh items when refresh button clicked', async () => {
    render(
      <DeletedItemsManager
        onRestore={mockOnRestore}
        onPermanentDelete={mockOnPermanentDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
