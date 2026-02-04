/**
 * Unit Tests for AdminLayout Component
 * 
 * Tests:
 * - Layout structure rendering
 * - Keyboard shortcuts functionality
 * - Pending photos count display
 * - Auto-refresh behavior
 * - Accessibility features
 * 
 * Requirements: Admin layout functionality
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AdminLayout } from './AdminLayout';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/admin/guests'),
}));

// Mock child components
jest.mock('./Sidebar', () => ({
  Sidebar: ({ currentSection, pendingPhotosCount }: any) => (
    <div data-testid="sidebar">
      <span>Current: {currentSection}</span>
      <span>Pending: {pendingPhotosCount}</span>
    </div>
  ),
}));

jest.mock('./TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}));

jest.mock('@/components/ui/KeyboardShortcutsDialog', () => ({
  KeyboardShortcutsDialog: ({ isOpen, onClose, shortcuts }: any) => (
    <div data-testid="shortcuts-dialog" style={{ display: isOpen ? 'block' : 'none' }}>
      <button onClick={onClose}>Close</button>
      <div>Shortcuts: {shortcuts.length}</div>
    </div>
  ),
}));

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
}));

// Mock fetch for pending photos API
global.fetch = jest.fn();

describe('AdminLayout', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { count: 5 } }),
    } as Response);
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Layout Structure', () => {
    it('should render main layout components', () => {
      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('topbar')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should pass currentSection to Sidebar', () => {
      render(
        <AdminLayout currentSection="activities">
          <div>Test Content</div>
        </AdminLayout>
      );

      expect(screen.getByText('Current: activities')).toBeInTheDocument();
    });

    it('should render main content with proper role and tabIndex', () => {
      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
      expect(main).toHaveAttribute('tabIndex', '-1');
      expect(main).toHaveClass('focus:outline-none');
    });

    it('should apply proper layout classes', () => {
      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      const container = screen.getByRole('main').closest('div');
      expect(container).toHaveClass('lg:pl-64');
    });
  });

  describe('Pending Photos Count', () => {
    it('should fetch pending photos count on mount', async () => {
      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/photos/pending-count');
      });
    });

    it('should display fetched pending count in sidebar', async () => {
      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Pending: 5')).toBeInTheDocument();
      });
    });

    it('should handle fetch error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch pending photos count:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle API error response gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: { message: 'API error' } }),
      } as Response);

      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Pending: 0')).toBeInTheDocument();
      });
    });

    it('should refresh count every 30 seconds', async () => {
      jest.useFakeTimers();

      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      // Initial call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Fast forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });

    it('should refresh count on photoModerated event', async () => {
      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      // Initial call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Dispatch custom event
      window.dispatchEvent(new Event('photoModerated'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should register keyboard shortcuts', () => {
      const { useKeyboardShortcuts } = require('@/hooks/useKeyboardShortcuts');

      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      expect(useKeyboardShortcuts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ key: '/', description: 'Focus search input' }),
          expect.objectContaining({ key: 'n', description: 'Open new entity form' }),
          expect.objectContaining({ key: '?', description: 'Show keyboard shortcuts' }),
          expect.objectContaining({ key: 'Escape', description: 'Close open modals' }),
        ]),
        true
      );
    });

    it('should show keyboard shortcuts dialog when ? is pressed', async () => {
      const { useKeyboardShortcuts } = require('@/hooks/useKeyboardShortcuts');
      let helpHandler: () => void;

      useKeyboardShortcuts.mockImplementation((shortcuts: any[]) => {
        helpHandler = shortcuts.find(s => s.key === '?').handler;
      });

      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      // Initially dialog should be hidden
      expect(screen.getByTestId('shortcuts-dialog')).toHaveStyle({ display: 'none' });

      // Trigger help handler
      helpHandler!();

      // Dialog should be visible after state update
      await waitFor(() => {
        expect(screen.getByTestId('shortcuts-dialog')).toHaveStyle({ display: 'block' });
      });
    });

    it('should close keyboard shortcuts dialog', async () => {
      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      // Show dialog first
      const { useKeyboardShortcuts } = require('@/hooks/useKeyboardShortcuts');
      const helpHandler = useKeyboardShortcuts.mock.calls[0][0].find((s: any) => s.key === '?').handler;
      helpHandler();

      await waitFor(() => {
        expect(screen.getByTestId('shortcuts-dialog')).toHaveStyle({ display: 'block' });
      });

      // Close dialog
      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.getByTestId('shortcuts-dialog')).toHaveStyle({ display: 'none' });
      });
    });

    it('should focus search input when / is pressed', () => {
      const { useKeyboardShortcuts } = require('@/hooks/useKeyboardShortcuts');
      let focusHandler: () => void;

      useKeyboardShortcuts.mockImplementation((shortcuts: any[]) => {
        focusHandler = shortcuts.find(s => s.key === '/').handler;
      });

      // Add a search input to the DOM
      const searchInput = document.createElement('input');
      searchInput.type = 'search';
      searchInput.focus = jest.fn();
      document.body.appendChild(searchInput);

      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      // Trigger focus handler
      focusHandler!();

      expect(searchInput.focus).toHaveBeenCalled();

      document.body.removeChild(searchInput);
    });

    it('should click add button when n is pressed', () => {
      const { useKeyboardShortcuts } = require('@/hooks/useKeyboardShortcuts');
      let addHandler: () => void;

      useKeyboardShortcuts.mockImplementation((shortcuts: any[]) => {
        addHandler = shortcuts.find(s => s.key === 'n').handler;
      });

      // Add an add button to the DOM
      const addButton = document.createElement('button');
      addButton.setAttribute('data-action', 'add-new');
      addButton.click = jest.fn();
      document.body.appendChild(addButton);

      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      // Trigger add handler
      addHandler!();

      expect(addButton.click).toHaveBeenCalled();

      document.body.removeChild(addButton);
    });

    it('should disable shortcuts when dialog is open', async () => {
      const { useKeyboardShortcuts } = require('@/hooks/useKeyboardShortcuts');

      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      // Initially shortcuts should be enabled
      expect(useKeyboardShortcuts).toHaveBeenCalledWith(expect.any(Array), true);

      // Show dialog
      const helpHandler = useKeyboardShortcuts.mock.calls[0][0].find((s: any) => s.key === '?').handler;
      helpHandler();

      // Wait for state update and re-render
      await waitFor(() => {
        expect(screen.getByTestId('shortcuts-dialog')).toHaveStyle({ display: 'block' });
      });

      // Shortcuts should be disabled when dialog is open (check last call)
      const lastCall = useKeyboardShortcuts.mock.calls[useKeyboardShortcuts.mock.calls.length - 1];
      expect(lastCall[1]).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('id', 'main-content');
    });

    it('should have focusable main content area', () => {
      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('tabIndex', '-1');
      expect(main).toHaveClass('focus:outline-none');
    });

    it('should provide keyboard shortcuts help', () => {
      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      const shortcutsDialog = screen.getByTestId('shortcuts-dialog');
      expect(shortcutsDialog).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup interval and event listeners on unmount', () => {
      jest.useFakeTimers();
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('photoModerated', expect.any(Function));

      removeEventListenerSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing search input gracefully', () => {
      const { useKeyboardShortcuts } = require('@/hooks/useKeyboardShortcuts');
      let focusHandler: () => void;

      useKeyboardShortcuts.mockImplementation((shortcuts: any[]) => {
        focusHandler = shortcuts.find(s => s.key === '/').handler;
      });

      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      // Should not throw error when no search input exists
      expect(() => focusHandler!()).not.toThrow();
    });

    it('should handle missing add button gracefully', () => {
      const { useKeyboardShortcuts } = require('@/hooks/useKeyboardShortcuts');
      let addHandler: () => void;

      useKeyboardShortcuts.mockImplementation((shortcuts: any[]) => {
        addHandler = shortcuts.find(s => s.key === 'n').handler;
      });

      render(
        <AdminLayout currentSection="guests">
          <div>Test Content</div>
        </AdminLayout>
      );

      // Should not throw error when no add button exists
      expect(() => addHandler!()).not.toThrow();
    });
  });
});