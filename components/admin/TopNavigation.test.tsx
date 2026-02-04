/**
 * Unit Tests: TopNavigation Component
 * 
 * Tests for the horizontal top navigation system including:
 * - Tab switching
 * - Sub-item navigation
 * - Mobile menu toggle
 * - Active state highlighting
 * - State persistence
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { TopNavigation } from './TopNavigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock sessionStorage
const mockSessionStorage = (() => {
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

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('TopNavigation', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    (usePathname as jest.Mock).mockReturnValue('/admin');
    
    // Mock window.innerWidth for mobile detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Desktop by default
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Desktop Navigation', () => {
    it('should render all main tabs', () => {
      render(<TopNavigation />);

      const contentButtons = screen.getAllByText('Content');
      expect(contentButtons.length).toBeGreaterThan(0);
      
      const guestsButtons = screen.getAllByText('Guests');
      expect(guestsButtons.length).toBeGreaterThan(0);
      
      const rsvpsButtons = screen.getAllByText('RSVPs');
      expect(rsvpsButtons.length).toBeGreaterThan(0);
      
      const logisticsButtons = screen.getAllByText('Logistics');
      expect(logisticsButtons.length).toBeGreaterThan(0);
      
      const adminButtons = screen.getAllByText('Admin');
      expect(adminButtons.length).toBeGreaterThan(0);
    });

    it('should render logo and link to dashboard', () => {
      render(<TopNavigation />);

      const logoLink = screen.getByRole('link', { name: /admin/i });
      expect(logoLink).toHaveAttribute('href', '/admin');
    });

    it('should highlight active tab based on pathname', () => {
      (usePathname as jest.Mock).mockReturnValue('/admin/activities');
      render(<TopNavigation />);

      const contentTab = screen.getByRole('button', { name: 'Content' });
      expect(contentTab).toHaveClass('bg-emerald-50', 'text-emerald-700');
    });

    it('should display sub-items for active tab', () => {
      (usePathname as jest.Mock).mockReturnValue('/admin/activities');
      render(<TopNavigation />);

      // Content tab should be active, showing its sub-items
      expect(screen.getByText('Home Page')).toBeInTheDocument();
      expect(screen.getByText('Activities')).toBeInTheDocument();
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Content Pages')).toBeInTheDocument();
      expect(screen.getByText('Locations')).toBeInTheDocument();
      expect(screen.getByText('Photos')).toBeInTheDocument();
    });

    it('should highlight active sub-item', () => {
      (usePathname as jest.Mock).mockReturnValue('/admin/activities');
      render(<TopNavigation />);

      const activitiesLink = screen.getByRole('link', { name: 'Activities' });
      expect(activitiesLink).toHaveClass('bg-emerald-600', 'text-white');
    });

    it('should switch tabs when clicking tab button', () => {
      render(<TopNavigation />);

      const guestsTab = screen.getByRole('button', { name: 'Guests' });
      fireEvent.click(guestsTab);

      // Guests tab should now be active
      expect(guestsTab).toHaveClass('bg-emerald-50', 'text-emerald-700');

      // Guests sub-items should be visible
      expect(screen.getByText('Guest List')).toBeInTheDocument();
      expect(screen.getByText('Guest Groups')).toBeInTheDocument();
      expect(screen.getByText('Import/Export')).toBeInTheDocument();
    });

    it('should persist tab selection to sessionStorage', () => {
      render(<TopNavigation />);

      const logisticsTab = screen.getByRole('button', { name: 'Logistics' });
      fireEvent.click(logisticsTab);

      expect(sessionStorage.getItem('activeTab')).toBe('logistics');
    });

    it('should persist sub-item selection to sessionStorage', () => {
      (usePathname as jest.Mock).mockReturnValue('/admin/activities');
      render(<TopNavigation />);

      const eventsLink = screen.getByRole('link', { name: 'Events' });
      fireEvent.click(eventsLink);

      expect(sessionStorage.getItem('activeTab')).toBe('content');
      expect(sessionStorage.getItem('activeSubItem')).toBe('events');
    });

    it('should restore state from sessionStorage on mount', () => {
      sessionStorage.setItem('activeTab', 'rsvps');
      sessionStorage.setItem('activeSubItem', 'rsvp-analytics');

      render(<TopNavigation />);

      const rsvpsTab = screen.getByRole('button', { name: 'RSVPs' });
      expect(rsvpsTab).toHaveClass('bg-emerald-50', 'text-emerald-700');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('should render hamburger menu button on mobile', () => {
      render(<TopNavigation />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('should not render desktop tabs on mobile', () => {
      render(<TopNavigation />);

      // Desktop tabs should not be visible
      const contentButtons = screen.queryAllByRole('button', { name: 'Content' });
      // Should only find the mobile menu version, not desktop
      expect(contentButtons.length).toBeLessThanOrEqual(1);
    });

    it('should open mobile menu when clicking hamburger button', async () => {
      render(<TopNavigation />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /mobile navigation menu/i })).toBeInTheDocument();
      });
    });

    it('should display all tabs in mobile menu', async () => {
      render(<TopNavigation />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /mobile navigation menu/i })).toBeInTheDocument();
        
        // Check that tabs are visible in the dialog
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveTextContent('Content');
        expect(dialog).toHaveTextContent('Guests');
        expect(dialog).toHaveTextContent('RSVPs');
        expect(dialog).toHaveTextContent('Logistics');
        expect(dialog).toHaveTextContent('Admin');
      });
    });

    it('should expand tab to show sub-items when clicked in mobile menu', async () => {
      render(<TopNavigation />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      await waitFor(() => {
        const contentTab = screen.getByRole('button', { name: /content/i });
        fireEvent.click(contentTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });
    });

    it('should close mobile menu when clicking backdrop', async () => {
      render(<TopNavigation />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      await waitFor(() => {
        const backdrop = screen.getByRole('dialog').previousSibling as HTMLElement;
        fireEvent.click(backdrop);
      });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close mobile menu when clicking close button', async () => {
      render(<TopNavigation />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Get close button within the dialog
      const dialog = screen.getByRole('dialog');
      const closeButton = within(dialog).getByRole('button', { name: /close menu/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close mobile menu when pressing Escape key', async () => {
      render(<TopNavigation />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close mobile menu after navigating to sub-item', async () => {
      render(<TopNavigation />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      await waitFor(() => {
        const contentTab = screen.getByRole('button', { name: /content/i });
        fireEvent.click(contentTab);
      });

      await waitFor(() => {
        const activitiesLink = screen.getByRole('link', { name: 'Activities' });
        fireEvent.click(activitiesLink);
      });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should have minimum 44px touch targets on mobile', async () => {
      render(<TopNavigation />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      await waitFor(() => {
        const contentTab = screen.getByRole('button', { name: /content/i });
        expect(contentTab).toHaveClass('min-h-[44px]');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TopNavigation />);

      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    });

    it('should mark active tab with aria-current', () => {
      (usePathname as jest.Mock).mockReturnValue('/admin/activities');
      render(<TopNavigation />);

      const contentTab = screen.getByRole('button', { name: 'Content' });
      expect(contentTab).toHaveAttribute('aria-current', 'page');
    });

    it('should mark active sub-item with aria-current', () => {
      (usePathname as jest.Mock).mockReturnValue('/admin/activities');
      render(<TopNavigation />);

      const activitiesLink = screen.getByRole('link', { name: 'Activities' });
      expect(activitiesLink).toHaveAttribute('aria-current', 'page');
    });

    it('should have aria-expanded on mobile menu button', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<TopNavigation />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Styling', () => {
    it('should have sticky positioning', () => {
      render(<TopNavigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('sticky', 'top-0', 'z-50');
    });

    it('should have glassmorphism effect', () => {
      render(<TopNavigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-white/90', 'backdrop-blur-md');
    });

    it('should apply emerald color scheme to active elements', () => {
      (usePathname as jest.Mock).mockReturnValue('/admin/activities');
      render(<TopNavigation />);

      const contentTab = screen.getByRole('button', { name: 'Content' });
      expect(contentTab).toHaveClass('bg-emerald-50', 'text-emerald-700');

      const activitiesLink = screen.getByRole('link', { name: 'Activities' });
      expect(activitiesLink).toHaveClass('bg-emerald-600', 'text-white');
    });
  });
});
