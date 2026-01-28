/**
 * Unit Tests for GroupedNavigation Component
 * 
 * Tests:
 * - Group expansion/collapse
 * - localStorage persistence
 * - Keyboard navigation
 * - Badge display
 * 
 * Requirements: 29.2-29.5
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { GroupedNavigation } from './GroupedNavigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/admin/guests'),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('GroupedNavigation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Group Expansion/Collapse', () => {
    it('should render all navigation groups', () => {
      render(<GroupedNavigation />);

      expect(screen.getByText('Guest Management')).toBeInTheDocument();
      expect(screen.getByText('Event Planning')).toBeInTheDocument();
      expect(screen.getByText('Logistics')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('Financial')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('should expand all groups by default when no localStorage data exists', () => {
      render(<GroupedNavigation />);

      // All groups should be expanded, so navigation items should be visible
      expect(screen.getByText('Guests')).toBeInTheDocument();
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Activities')).toBeInTheDocument();
      expect(screen.getByText('Vendors')).toBeInTheDocument();
      expect(screen.getByText('Photos')).toBeInTheDocument();
      expect(screen.getByText('Emails')).toBeInTheDocument();
      expect(screen.getByText('Budget')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should collapse group when clicking on group header', async () => {
      render(<GroupedNavigation />);

      // Verify group is initially expanded
      expect(screen.getByText('Guests')).toBeInTheDocument();

      // Click on Guest Management header to collapse
      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      fireEvent.click(guestManagementButton);

      // Wait for collapse animation
      await waitFor(() => {
        expect(screen.queryByText('Guests')).not.toBeInTheDocument();
      });

      // Verify aria-expanded is false
      expect(guestManagementButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should expand collapsed group when clicking on group header', async () => {
      render(<GroupedNavigation />);

      // First collapse the group
      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      fireEvent.click(guestManagementButton);

      await waitFor(() => {
        expect(screen.queryByText('Guests')).not.toBeInTheDocument();
      });

      // Now expand it again
      fireEvent.click(guestManagementButton);

      await waitFor(() => {
        expect(screen.getByText('Guests')).toBeInTheDocument();
      });

      // Verify aria-expanded is true
      expect(guestManagementButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should toggle multiple groups independently', async () => {
      render(<GroupedNavigation />);

      // Collapse Guest Management
      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      fireEvent.click(guestManagementButton);

      await waitFor(() => {
        expect(screen.queryByText('Guests')).not.toBeInTheDocument();
      });

      // Event Planning should still be expanded
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Activities')).toBeInTheDocument();

      // Collapse Event Planning
      const eventPlanningButton = screen.getByRole('button', { name: /event planning section/i });
      fireEvent.click(eventPlanningButton);

      await waitFor(() => {
        expect(screen.queryByText('Events')).not.toBeInTheDocument();
        expect(screen.queryByText('Activities')).not.toBeInTheDocument();
      });

      // Guest Management should still be collapsed
      expect(screen.queryByText('Guests')).not.toBeInTheDocument();
    });

    it('should display correct aria-expanded attribute', () => {
      render(<GroupedNavigation />);

      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      
      // Initially expanded
      expect(guestManagementButton).toHaveAttribute('aria-expanded', 'true');

      // After clicking, should be collapsed
      fireEvent.click(guestManagementButton);
      expect(guestManagementButton).toHaveAttribute('aria-expanded', 'false');

      // After clicking again, should be expanded
      fireEvent.click(guestManagementButton);
      expect(guestManagementButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('localStorage Persistence', () => {
    it('should save expanded groups to localStorage when toggling', async () => {
      render(<GroupedNavigation />);

      // Collapse a group
      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      fireEvent.click(guestManagementButton);

      // Wait for localStorage to be updated
      await waitFor(() => {
        const stored = localStorageMock.getItem('admin_nav_expanded_groups');
        expect(stored).toBeTruthy();
        
        const parsed = JSON.parse(stored!);
        expect(parsed).not.toContain('guest-management');
        expect(parsed).toContain('event-planning');
        expect(parsed).toContain('logistics');
      });
    });

    it('should load expanded groups from localStorage on mount', () => {
      // Pre-populate localStorage with only some groups expanded
      const expandedGroups = ['event-planning', 'content'];
      localStorageMock.setItem('admin_nav_expanded_groups', JSON.stringify(expandedGroups));

      render(<GroupedNavigation />);

      // Event Planning and Content should be expanded
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Activities')).toBeInTheDocument();
      expect(screen.getByText('Photos')).toBeInTheDocument();

      // Guest Management should be collapsed
      expect(screen.queryByText('Guests')).not.toBeInTheDocument();

      // Logistics should be collapsed
      expect(screen.queryByText('Vendors')).not.toBeInTheDocument();
    });

    it('should persist state across multiple toggles', async () => {
      render(<GroupedNavigation />);

      // Toggle multiple groups
      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      const eventPlanningButton = screen.getByRole('button', { name: /event planning section/i });
      const logisticsButton = screen.getByRole('button', { name: /logistics section/i });

      fireEvent.click(guestManagementButton); // Collapse
      fireEvent.click(eventPlanningButton); // Collapse
      fireEvent.click(logisticsButton); // Collapse

      await waitFor(() => {
        const stored = localStorageMock.getItem('admin_nav_expanded_groups');
        const parsed = JSON.parse(stored!);
        
        expect(parsed).not.toContain('guest-management');
        expect(parsed).not.toContain('event-planning');
        expect(parsed).not.toContain('logistics');
        expect(parsed).toContain('content');
        expect(parsed).toContain('communication');
      });

      // Expand one back
      fireEvent.click(guestManagementButton);

      await waitFor(() => {
        const stored = localStorageMock.getItem('admin_nav_expanded_groups');
        const parsed = JSON.parse(stored!);
        
        expect(parsed).toContain('guest-management');
        expect(parsed).not.toContain('event-planning');
      });
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Set invalid JSON in localStorage
      localStorageMock.setItem('admin_nav_expanded_groups', 'invalid-json{');

      // Should not throw error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<GroupedNavigation />);

      // Should still render without crashing
      expect(screen.getByText('Guest Management')).toBeInTheDocument();
      expect(screen.getByText('Event Planning')).toBeInTheDocument();
      
      // Groups will be collapsed due to error, but component should still work
      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      expect(guestManagementButton).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<GroupedNavigation />);

      // Toggle a group
      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      fireEvent.click(guestManagementButton);

      // Should log error but not crash
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      localStorageMock.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should toggle group on Enter key press', async () => {
      render(<GroupedNavigation />);

      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      
      // Initially expanded
      expect(screen.getByText('Guests')).toBeInTheDocument();

      // Press Enter
      fireEvent.keyDown(guestManagementButton, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.queryByText('Guests')).not.toBeInTheDocument();
      });

      // Press Enter again to expand
      fireEvent.keyDown(guestManagementButton, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Guests')).toBeInTheDocument();
      });
    });

    it('should toggle group on Space key press', async () => {
      render(<GroupedNavigation />);

      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      
      // Initially expanded
      expect(screen.getByText('Guests')).toBeInTheDocument();

      // Press Space
      fireEvent.keyDown(guestManagementButton, { key: ' ' });

      await waitFor(() => {
        expect(screen.queryByText('Guests')).not.toBeInTheDocument();
      });

      // Press Space again to expand
      fireEvent.keyDown(guestManagementButton, { key: ' ' });

      await waitFor(() => {
        expect(screen.getByText('Guests')).toBeInTheDocument();
      });
    });

    it('should prevent default behavior on Space key to avoid page scroll', () => {
      render(<GroupedNavigation />);

      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      guestManagementButton.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not toggle on other key presses', () => {
      render(<GroupedNavigation />);

      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      
      // Initially expanded
      expect(screen.getByText('Guests')).toBeInTheDocument();

      // Press other keys
      fireEvent.keyDown(guestManagementButton, { key: 'a' });
      fireEvent.keyDown(guestManagementButton, { key: 'Escape' });
      fireEvent.keyDown(guestManagementButton, { key: 'Tab' });

      // Should still be expanded
      expect(screen.getByText('Guests')).toBeInTheDocument();
    });

    it('should support keyboard navigation between groups', () => {
      render(<GroupedNavigation />);

      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      const eventPlanningButton = screen.getByRole('button', { name: /event planning section/i });

      // Focus first group
      guestManagementButton.focus();
      expect(document.activeElement).toBe(guestManagementButton);

      // Tab to next group
      fireEvent.keyDown(guestManagementButton, { key: 'Tab' });
      
      // Note: Actual tab navigation is handled by browser, we just verify buttons are focusable
      expect(eventPlanningButton).toBeInTheDocument();
    });
  });

  describe('Badge Display', () => {
    it('should display badge on group when pendingPhotosCount is provided', () => {
      render(<GroupedNavigation pendingPhotosCount={5} />);

      // Find the Content group button
      const contentButton = screen.getByRole('button', { name: /content section/i });
      
      // Badge should be visible with count (there are two badges: one on group, one on Photos item)
      const badges = screen.getAllByLabelText('5 pending');
      expect(badges.length).toBeGreaterThan(0);
      expect(badges[0]).toHaveTextContent('5');
    });

    it('should display badge on Photos item when pendingPhotosCount is provided', () => {
      render(<GroupedNavigation pendingPhotosCount={3} />);

      // Find the Photos link badge
      const badges = screen.getAllByLabelText('3 pending');
      expect(badges.length).toBeGreaterThan(0);
      
      // At least one badge should show the count
      const photoBadge = badges.find(badge => badge.textContent === '3');
      expect(photoBadge).toBeInTheDocument();
    });

    it('should not display badge when pendingPhotosCount is 0', () => {
      render(<GroupedNavigation pendingPhotosCount={0} />);

      // No badges should be visible
      const badges = screen.queryAllByLabelText(/pending/);
      expect(badges.length).toBe(0);
    });

    it('should update badge when pendingPhotosCount prop changes', () => {
      const { rerender } = render(<GroupedNavigation pendingPhotosCount={5} />);

      // Initial badge
      expect(screen.getAllByLabelText('5 pending').length).toBeGreaterThan(0);

      // Update count
      rerender(<GroupedNavigation pendingPhotosCount={10} />);

      // Badge should update
      expect(screen.getAllByLabelText('10 pending').length).toBeGreaterThan(0);
      expect(screen.queryAllByLabelText('5 pending').length).toBe(0);
    });

    it('should remove badge when pendingPhotosCount changes to 0', () => {
      const { rerender } = render(<GroupedNavigation pendingPhotosCount={5} />);

      // Initial badge
      expect(screen.getAllByLabelText('5 pending').length).toBeGreaterThan(0);

      // Update to 0
      rerender(<GroupedNavigation pendingPhotosCount={0} />);

      // Badge should be removed
      expect(screen.queryAllByLabelText(/pending/).length).toBe(0);
    });

    it('should display badge with correct styling', () => {
      render(<GroupedNavigation pendingPhotosCount={7} />);

      const badges = screen.getAllByLabelText('7 pending');
      expect(badges.length).toBeGreaterThan(0);
      
      const badge = badges[0];
      
      // Verify badge has volcano (red) color classes
      expect(badge.className).toContain('volcano');
      expect(badge.className).toContain('text-white');
      expect(badge.className).toContain('rounded-full');
    });

    it('should handle large badge numbers', () => {
      render(<GroupedNavigation pendingPhotosCount={999} />);

      const badges = screen.getAllByLabelText('999 pending');
      expect(badges.length).toBeGreaterThan(0);
      expect(badges[0]).toHaveTextContent('999');
    });
  });

  describe('Collapsed View', () => {
    it('should render icon-only view when isCollapsed is true', () => {
      render(<GroupedNavigation isCollapsed={true} />);

      // Group labels should not be visible
      expect(screen.queryByText('Guest Management')).not.toBeInTheDocument();
      expect(screen.queryByText('Event Planning')).not.toBeInTheDocument();

      // Icons should still be present (via aria-label)
      expect(screen.getByLabelText('Guest Management')).toBeInTheDocument();
      expect(screen.getByLabelText('Event Planning')).toBeInTheDocument();
    });

    it('should show badge indicator in collapsed view', () => {
      render(<GroupedNavigation isCollapsed={true} pendingPhotosCount={5} />);

      // Badge should be visible as a dot indicator
      const contentButton = screen.getByLabelText('Content');
      expect(contentButton).toBeInTheDocument();
      
      // Should have badge indicator (small dot)
      const badges = screen.getAllByLabelText('5 pending');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should not show navigation items in collapsed view', () => {
      render(<GroupedNavigation isCollapsed={true} />);

      // Navigation items should not be visible
      expect(screen.queryByText('Guests')).not.toBeInTheDocument();
      expect(screen.queryByText('Events')).not.toBeInTheDocument();
      expect(screen.queryByText('Photos')).not.toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should highlight active group based on current pathname', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/admin/guests');

      render(<GroupedNavigation />);

      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      
      // Should have active styling
      expect(guestManagementButton.className).toContain('jungle');
    });

    it('should highlight active navigation item', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/admin/guests');

      render(<GroupedNavigation />);

      const guestsLink = screen.getByRole('link', { name: 'Guests' });
      
      // Should have active styling
      expect(guestsLink.className).toContain('jungle');
      expect(guestsLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Navigation Callback', () => {
    it('should call onNavigate when navigation item is clicked', () => {
      const onNavigate = jest.fn();
      render(<GroupedNavigation onNavigate={onNavigate} />);

      const guestsLink = screen.getByRole('link', { name: 'Guests' });
      fireEvent.click(guestsLink);

      expect(onNavigate).toHaveBeenCalled();
    });

    it('should not call onNavigate when group header is clicked', () => {
      const onNavigate = jest.fn();
      render(<GroupedNavigation onNavigate={onNavigate} />);

      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      fireEvent.click(guestManagementButton);

      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on navigation', () => {
      render(<GroupedNavigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Admin sections');
    });

    it('should have proper ARIA labels on group buttons', () => {
      render(<GroupedNavigation />);

      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      expect(guestManagementButton).toHaveAttribute('aria-expanded');
      expect(guestManagementButton).toHaveAttribute('aria-label', 'Guest Management section');
    });

    it('should have proper role on group items container', () => {
      render(<GroupedNavigation />);

      const groupContainer = screen.getByRole('group', { name: /guest management items/i });
      expect(groupContainer).toBeInTheDocument();
    });

    it('should have proper aria-current on active links', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/admin/guests');

      render(<GroupedNavigation />);

      const guestsLink = screen.getByRole('link', { name: 'Guests' });
      expect(guestsLink).toHaveAttribute('aria-current', 'page');
    });

    it('should have minimum touch target size (44px)', () => {
      render(<GroupedNavigation />);

      const guestManagementButton = screen.getByRole('button', { name: /guest management section/i });
      
      // Should have min-h-[44px] class for accessibility
      expect(guestManagementButton.className).toContain('min-h-[44px]');
    });
  });
});
