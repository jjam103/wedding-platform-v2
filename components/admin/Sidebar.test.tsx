/**
 * Unit Tests for Sidebar Component
 * 
 * Tests:
 * - Sidebar rendering and layout
 * - Mobile/desktop responsive behavior
 * - Collapse/expand functionality
 * - Pending photos count display
 * - Navigation callbacks
 * - Accessibility features
 * 
 * Requirements: Sidebar navigation functionality
 */

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Sidebar } from './Sidebar';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/admin/guests'),
}));

// Mock child components
jest.mock('./GroupedNavigation', () => ({
  GroupedNavigation: ({ pendingPhotosCount, isCollapsed, onNavigate }: any) => (
    <div data-testid="grouped-navigation">
      <span>Pending: {pendingPhotosCount}</span>
      <span>Collapsed: {isCollapsed ? 'true' : 'false'}</span>
      <button onClick={onNavigate}>Navigate</button>
    </div>
  ),
}));

// Mock window.innerWidth for responsive tests
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('Sidebar', () => {
  beforeEach(() => {
    // Reset window width to desktop
    window.innerWidth = 1024;
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render sidebar with header and navigation', () => {
      render(<Sidebar currentSection="guests" />);

      expect(screen.getByText('🌴')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByTestId('grouped-navigation')).toBeInTheDocument();
    });

    it('should display current section in dashboard link', () => {
      render(<Sidebar currentSection="activities" />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/admin');
    });

    it('should pass pending photos count to GroupedNavigation', () => {
      render(<Sidebar currentSection="guests" pendingPhotosCount={5} />);

      expect(screen.getByText('Pending: 5')).toBeInTheDocument();
    });

    it('should render footer with Costa Rica message', () => {
      render(<Sidebar currentSection="guests" />);

      expect(screen.getByText('Pura Vida! ☀️')).toBeInTheDocument();
    });
  });

  describe('Collapse/Expand Functionality', () => {
    it('should start expanded on desktop', () => {
      window.innerWidth = 1024;
      
      render(<Sidebar currentSection="guests" />);

      const sidebar = screen.getByRole('navigation');
      expect(sidebar).not.toHaveClass('-translate-x-full');
      expect(sidebar).toHaveClass('w-64');
      
      // Header content should be visible
      expect(screen.getByText('Admin')).toBeInTheDocument();
      
      // GroupedNavigation should not be collapsed
      expect(screen.getByText('Collapsed: false')).toBeInTheDocument();
    });

    it('should toggle sidebar when toggle button is clicked', () => {
      render(<Sidebar currentSection="guests" />);

      const toggleButton = screen.getByLabelText(/collapse sidebar/i);
      fireEvent.click(toggleButton);

      // Should be collapsed
      expect(screen.getByText('Collapsed: true')).toBeInTheDocument();
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      
      // Button should change to expand
      expect(screen.getByLabelText(/expand sidebar/i)).toBeInTheDocument();
    });

    it('should expand sidebar when clicking expand button', () => {
      render(<Sidebar currentSection="guests" />);

      const toggleButton = screen.getByLabelText(/collapse sidebar/i);
      
      // Collapse first
      fireEvent.click(toggleButton);
      expect(screen.getByText('Collapsed: true')).toBeInTheDocument();
      
      // Then expand
      const expandButton = screen.getByLabelText(/expand sidebar/i);
      fireEvent.click(expandButton);
      
      expect(screen.getByText('Collapsed: false')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should show correct toggle button icons', () => {
      render(<Sidebar currentSection="guests" />);

      const toggleButton = screen.getByLabelText(/collapse sidebar/i);
      expect(toggleButton).toHaveTextContent('←');
      
      fireEvent.click(toggleButton);
      
      const expandButton = screen.getByLabelText(/expand sidebar/i);
      expect(expandButton).toHaveTextContent('→');
    });
  });

  describe('Mobile Responsive Behavior', () => {
    beforeEach(() => {
      // Mock mobile viewport
      window.innerWidth = 600;
      
      // Mock resize event
      const resizeEvent = new Event('resize');
      Object.defineProperty(resizeEvent, 'target', {
        value: { innerWidth: 600 },
        enumerable: true,
      });
    });

    it('should start collapsed on mobile', () => {
      window.innerWidth = 600;
      
      render(<Sidebar currentSection="guests" />);

      // Trigger resize event to simulate mobile detection
      fireEvent(window, new Event('resize'));

      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('should show mobile toggle button when collapsed on mobile', () => {
      window.innerWidth = 600;
      
      render(<Sidebar currentSection="guests" />);

      // Trigger resize to detect mobile
      fireEvent(window, new Event('resize'));

      // Should show mobile toggle button
      expect(screen.getByLabelText(/open sidebar/i)).toBeInTheDocument();
      expect(screen.getByText('☰')).toBeInTheDocument();
    });

    it('should show overlay when expanded on mobile', () => {
      window.innerWidth = 600;
      
      render(<Sidebar currentSection="guests" />);

      // Trigger resize to detect mobile
      fireEvent(window, new Event('resize'));

      // Open sidebar on mobile
      const mobileToggle = screen.getByLabelText(/open sidebar/i);
      fireEvent.click(mobileToggle);

      // Should show overlay
      const overlay = document.querySelector('.bg-black.bg-opacity-50');
      expect(overlay).toBeInTheDocument();
    });

    it('should close sidebar when overlay is clicked on mobile', () => {
      window.innerWidth = 600;
      
      render(<Sidebar currentSection="guests" />);

      // Trigger resize to detect mobile
      fireEvent(window, new Event('resize'));

      // Open sidebar
      const mobileToggle = screen.getByLabelText(/open sidebar/i);
      fireEvent.click(mobileToggle);

      // Click overlay
      const overlay = document.querySelector('.bg-black.bg-opacity-50');
      fireEvent.click(overlay!);

      // Sidebar should be closed
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('should close sidebar after navigation on mobile', () => {
      window.innerWidth = 600;
      
      render(<Sidebar currentSection="guests" />);

      // Trigger resize to detect mobile
      fireEvent(window, new Event('resize'));

      // Open sidebar
      const mobileToggle = screen.getByLabelText(/open sidebar/i);
      fireEvent.click(mobileToggle);

      // Trigger navigation
      const navigateButton = screen.getByText('Navigate');
      fireEvent.click(navigateButton);

      // Sidebar should be closed on mobile
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('-translate-x-full');
    });
  });

  describe('Dashboard Link', () => {
    it('should highlight dashboard link when on dashboard page', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/admin');

      render(<Sidebar currentSection="dashboard" />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('bg-jungle-50', 'text-jungle-700');
      expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    it('should not highlight dashboard link when on other pages', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/admin/guests');

      render(<Sidebar currentSection="guests" />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).not.toHaveClass('bg-jungle-50');
      expect(dashboardLink).not.toHaveAttribute('aria-current');
    });

    it('should have proper dashboard link structure', () => {
      render(<Sidebar currentSection="guests" />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/admin');
      expect(dashboardLink).toContainHTML('🏠');
      expect(dashboardLink).toHaveTextContent('Dashboard');
    });
  });

  describe('Pending Photos Count', () => {
    it('should pass pending count to GroupedNavigation', () => {
      render(<Sidebar currentSection="guests" pendingPhotosCount={10} />);

      expect(screen.getByText('Pending: 10')).toBeInTheDocument();
    });

    it('should handle zero pending count', () => {
      render(<Sidebar currentSection="guests" pendingPhotosCount={0} />);

      expect(screen.getByText('Pending: 0')).toBeInTheDocument();
    });

    it('should handle undefined pending count', () => {
      render(<Sidebar currentSection="guests" />);

      expect(screen.getByText('Pending: 0')).toBeInTheDocument();
    });
  });

  describe('Navigation Callbacks', () => {
    it('should pass onNavigate callback to GroupedNavigation', () => {
      render(<Sidebar currentSection="guests" />);

      const navigateButton = screen.getByText('Navigate');
      expect(navigateButton).toBeInTheDocument();
      
      // Should not throw when clicked
      expect(() => fireEvent.click(navigateButton)).not.toThrow();
    });

    it('should close sidebar on mobile when navigation occurs', () => {
      window.innerWidth = 600;
      
      render(<Sidebar currentSection="guests" />);

      // Trigger resize to detect mobile
      fireEvent(window, new Event('resize'));

      // Open sidebar
      const mobileToggle = screen.getByLabelText(/open sidebar/i);
      fireEvent.click(mobileToggle);

      // Sidebar should be open
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).not.toHaveClass('-translate-x-full');

      // Navigate
      const navigateButton = screen.getByText('Navigate');
      fireEvent.click(navigateButton);

      // Sidebar should close on mobile
      expect(sidebar).toHaveClass('-translate-x-full');
    });
  });

  describe('Accessibility', () => {
    it('should have proper navigation role and label', () => {
      render(<Sidebar currentSection="guests" />);

      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('should have proper toggle button accessibility', () => {
      render(<Sidebar currentSection="guests" />);

      const toggleButton = screen.getByLabelText(/collapse sidebar/i);
      expect(toggleButton).toHaveAttribute('aria-label', 'Collapse sidebar');
      
      fireEvent.click(toggleButton);
      
      const expandButton = screen.getByLabelText(/expand sidebar/i);
      expect(expandButton).toHaveAttribute('aria-label', 'Expand sidebar');
    });

    it('should have minimum touch target size for buttons', () => {
      render(<Sidebar currentSection="guests" />);

      const toggleButton = screen.getByLabelText(/collapse sidebar/i);
      expect(toggleButton).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });

    it('should have proper dashboard link accessibility', () => {
      render(<Sidebar currentSection="guests" />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('aria-label', 'Dashboard');
      expect(dashboardLink).toHaveClass('min-h-[44px]');
    });

    it('should have proper mobile toggle button accessibility', () => {
      window.innerWidth = 600;
      
      render(<Sidebar currentSection="guests" />);

      // Trigger resize to detect mobile
      fireEvent(window, new Event('resize'));

      const mobileToggle = screen.getByLabelText(/open sidebar/i);
      expect(mobileToggle).toHaveAttribute('aria-label', 'Open sidebar');
      expect(mobileToggle).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });

    it('should hide overlay from screen readers', () => {
      window.innerWidth = 600;
      
      render(<Sidebar currentSection="guests" />);

      // Trigger resize to detect mobile
      fireEvent(window, new Event('resize'));

      // Open sidebar
      const mobileToggle = screen.getByLabelText(/open sidebar/i);
      fireEvent.click(mobileToggle);

      const overlay = document.querySelector('.bg-black.bg-opacity-50');
      expect(overlay).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Responsive Design', () => {
    it('should apply correct classes for desktop layout', () => {
      window.innerWidth = 1024;
      
      render(<Sidebar currentSection="guests" />);

      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('fixed', 'top-0', 'left-0', 'h-full');
      expect(sidebar).toHaveClass('w-64'); // Desktop width
      expect(sidebar).not.toHaveClass('-translate-x-full'); // Not hidden
    });

    it('should apply correct classes for mobile layout', () => {
      window.innerWidth = 600;
      
      render(<Sidebar currentSection="guests" />);

      // Trigger resize to detect mobile
      fireEvent(window, new Event('resize'));

      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('-translate-x-full'); // Hidden on mobile
    });

    it('should handle window resize events', () => {
      render(<Sidebar currentSection="guests" />);

      // Start desktop
      expect(screen.getByText('Admin')).toBeInTheDocument();

      // Resize to mobile
      window.innerWidth = 600;
      fireEvent(window, new Event('resize'));

      // Should detect mobile and potentially change behavior
      // (The component should handle this internally)
    });

    it('should clean up resize event listener', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<Sidebar currentSection="guests" />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Layout Structure', () => {
    it('should have proper header structure', () => {
      render(<Sidebar currentSection="guests" />);

      const header = screen.getByText('🌴').closest('div');
      expect(header).toHaveClass('h-16', 'flex', 'items-center', 'justify-between');
      expect(header).toHaveClass('border-b', 'border-sage-200');
    });

    it('should have proper navigation area structure', () => {
      render(<Sidebar currentSection="guests" />);

      const navArea = screen.getByTestId('grouped-navigation').closest('div');
      expect(navArea).toHaveClass('overflow-y-auto');
    });

    it('should have proper footer structure when expanded', () => {
      render(<Sidebar currentSection="guests" />);

      const footer = screen.getByText('Pura Vida! ☀️').closest('div');
      expect(footer).toHaveClass('absolute', 'bottom-0', 'left-0', 'right-0');
      expect(footer).toHaveClass('border-t', 'border-sage-200', 'bg-sage-50');
    });

    it('should hide footer when collapsed', () => {
      render(<Sidebar currentSection="guests" />);

      // Collapse sidebar
      const toggleButton = screen.getByLabelText(/collapse sidebar/i);
      fireEvent.click(toggleButton);

      // Footer should not be visible
      expect(screen.queryByText('Pura Vida! ☀️')).not.toBeInTheDocument();
    });
  });

  describe('Z-Index and Layering', () => {
    it('should have proper z-index for sidebar', () => {
      render(<Sidebar currentSection="guests" />);

      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('z-50');
    });

    it('should have proper z-index for mobile overlay', () => {
      window.innerWidth = 600;
      
      render(<Sidebar currentSection="guests" />);

      // Trigger resize to detect mobile
      fireEvent(window, new Event('resize'));

      // Open sidebar
      const mobileToggle = screen.getByLabelText(/open sidebar/i);
      fireEvent.click(mobileToggle);

      const overlay = document.querySelector('.bg-black.bg-opacity-50');
      expect(overlay).toHaveClass('z-40');
    });

    it('should have proper z-index for mobile toggle button', () => {
      window.innerWidth = 600;
      
      render(<Sidebar currentSection="guests" />);

      // Trigger resize to detect mobile
      fireEvent(window, new Event('resize'));

      const mobileToggle = screen.getByLabelText(/open sidebar/i);
      expect(mobileToggle).toHaveClass('z-40');
    });
  });
});