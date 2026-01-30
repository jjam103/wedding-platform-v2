/**
 * Unit Tests for TopBar Component
 * 
 * Tests:
 * - TopBar rendering
 * - User menu functionality
 * - Responsive behavior
 * - User interactions
 * 
 * Requirements: Top bar functionality
 */

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TopBar } from './TopBar';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock fetch for logout API
global.fetch = jest.fn();

describe('TopBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render top bar container', () => {
      render(<TopBar />);

      const topBar = screen.getByRole('banner');
      expect(topBar).toBeInTheDocument();
      expect(topBar).toHaveClass('bg-white', 'border-b', 'border-sage-200');
    });

    it('should have proper height and sticky positioning', () => {
      render(<TopBar />);

      const topBar = screen.getByRole('banner');
      expect(topBar).toHaveClass('h-16', 'sticky', 'top-0', 'z-30');
    });

    it('should display wedding admin title', () => {
      render(<TopBar />);

      expect(screen.getByText('Wedding Admin')).toBeInTheDocument();
    });

    it('should have proper responsive padding', () => {
      render(<TopBar />);

      const container = screen.getByRole('banner').firstChild;
      expect(container).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });
  });

  describe('User Menu', () => {
    it('should display admin user label', () => {
      render(<TopBar />);

      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should show user menu button with proper accessibility', () => {
      render(<TopBar />);

      const userButton = screen.getByRole('button', { name: /user menu/i });
      expect(userButton).toBeInTheDocument();
      expect(userButton).toHaveAttribute('aria-expanded', 'false');
      expect(userButton).toHaveAttribute('aria-haspopup', 'true');
      expect(userButton).toHaveAttribute('aria-controls', 'user-menu-dropdown');
    });

    it('should display user avatar with initial', () => {
      render(<TopBar />);

      expect(screen.getByText('A')).toBeInTheDocument();
      const avatarDiv = screen.getByText('A');
      expect(avatarDiv).toHaveClass('w-8', 'h-8', 'bg-jungle-500', 'text-white', 'rounded-full');
    });

    it('should toggle user menu when clicked', () => {
      render(<TopBar />);

      const userButton = screen.getByRole('button', { name: /user menu/i });
      
      // Menu should be closed initially
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
      expect(userButton).toHaveAttribute('aria-expanded', 'false');
      
      // Click to open menu
      fireEvent.click(userButton);
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(userButton).toHaveAttribute('aria-expanded', 'true');
      
      // Click to close menu
      fireEvent.click(userButton);
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
      expect(userButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should close menu when clicking outside', () => {
      render(<TopBar />);

      const userButton = screen.getByRole('button', { name: /user menu/i });
      
      // Open menu
      fireEvent.click(userButton);
      expect(screen.getByText('Logout')).toBeInTheDocument();
      
      // Click outside
      fireEvent.mouseDown(document.body);
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });

  describe('Menu Actions', () => {
    it('should handle settings navigation', () => {
      const mockPush = jest.fn();
      require('next/navigation').useRouter.mockReturnValue({
        push: mockPush,
        refresh: jest.fn(),
      });

      render(<TopBar />);

      const userButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userButton);
      
      const settingsButton = screen.getByText('Settings');
      fireEvent.click(settingsButton);
      
      expect(mockPush).toHaveBeenCalledWith('/admin/settings');
      expect(screen.queryByText('Settings')).not.toBeInTheDocument(); // Menu should close
    });

    it('should handle logout action', async () => {
      const mockPush = jest.fn();
      require('next/navigation').useRouter.mockReturnValue({
        push: mockPush,
        refresh: jest.fn(),
      });

      render(<TopBar />);

      const userButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userButton);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
      });
    });

    it('should show loading state during logout', async () => {
      // Mock slow logout
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(<TopBar />);

      const userButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userButton);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /logging out/i })).toBeInTheDocument();
    });

    it('should handle logout error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<TopBar />);

      const userButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userButton);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(consoleSpy).toHaveBeenCalledWith('Logout failed');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Notifications', () => {
    it('should display notification button', () => {
      render(<TopBar />);

      const notificationButton = screen.getByRole('button', { name: /notifications/i });
      expect(notificationButton).toBeInTheDocument();
      expect(notificationButton).toHaveAttribute('title', 'Notifications (coming soon)');
    });

    it('should show notification icon', () => {
      render(<TopBar />);

      expect(screen.getByText('🔔')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper banner role', () => {
      render(<TopBar />);

      const topBar = screen.getByRole('banner');
      expect(topBar).toBeInTheDocument();
    });

    it('should have proper toolbar role for actions', () => {
      render(<TopBar />);

      const toolbar = screen.getByRole('toolbar', { name: /user actions/i });
      expect(toolbar).toBeInTheDocument();
    });

    it('should have proper menu accessibility when open', () => {
      render(<TopBar />);

      const userButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userButton);
      
      const menu = screen.getByRole('menu', { name: /user menu options/i });
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveAttribute('id', 'user-menu-dropdown');
      
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(2); // Settings and Logout
    });

    it('should support keyboard navigation', () => {
      render(<TopBar />);

      const userButton = screen.getByRole('button', { name: /user menu/i });
      
      // Focus and press Enter
      userButton.focus();
      fireEvent.click(userButton); // Simulate keyboard activation
      
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should hide title on small screens', () => {
      render(<TopBar />);

      const title = screen.getByText('Wedding Admin');
      expect(title).toHaveClass('hidden', 'sm:block');
    });

    it('should hide admin label on small screens', () => {
      render(<TopBar />);

      const adminLabel = screen.getByText('Admin');
      expect(adminLabel).toHaveClass('hidden', 'sm:inline');
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch network errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<TopBar />);

      const userButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userButton);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});