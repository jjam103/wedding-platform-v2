import { render, screen, waitFor } from '@testing-library/react';
import RSVPsPage from './page';
import { useToast } from '@/components/ui/ToastContext';

// Mock the RSVPManager component
jest.mock('@/components/admin/RSVPManager', () => ({
  RSVPManager: jest.fn(() => <div data-testid="rsvp-manager">RSVP Manager Component</div>),
}));

// Mock the ToastContext
jest.mock('@/components/ui/ToastContext', () => ({
  useToast: jest.fn(),
}));

// Mock the ErrorBoundary component
jest.mock('@/components/ui/ErrorBoundary', () => ({
  ComponentErrorBoundary: ({ children }: any) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

describe('RSVPsPage', () => {
  const mockAddToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({
      addToast: mockAddToast,
    });
  });

  describe('Page Rendering', () => {
    it('should render page header with title and description', () => {
      render(<RSVPsPage />);

      expect(screen.getByText('RSVP Management')).toBeInTheDocument();
      expect(
        screen.getByText('View and manage all RSVPs across events and activities')
      ).toBeInTheDocument();
    });

    it('should render RSVPManager component', () => {
      render(<RSVPsPage />);

      expect(screen.getByTestId('rsvp-manager')).toBeInTheDocument();
    });

    it('should wrap RSVPManager in error boundary', () => {
      render(<RSVPsPage />);

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });

  describe('Page Structure', () => {
    it('should have proper heading hierarchy', () => {
      render(<RSVPsPage />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('RSVP Management');
    });

    it('should apply correct styling classes', () => {
      const { container } = render(<RSVPsPage />);

      // Check for space-y-6 on main container
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('space-y-6');
    });
  });

  describe('Error Handling', () => {
    it('should wrap RSVPManager in ComponentErrorBoundary', () => {
      render(<RSVPsPage />);

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('rsvp-manager')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible page title', () => {
      render(<RSVPsPage />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAccessibleName('RSVP Management');
    });

    it('should have descriptive text for screen readers', () => {
      render(<RSVPsPage />);

      const description = screen.getByText(
        'View and manage all RSVPs across events and activities'
      );
      expect(description).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should pass no initial filters to RSVPManager by default', () => {
      const RSVPManager = require('@/components/admin/RSVPManager').RSVPManager;
      
      render(<RSVPsPage />);

      // RSVPManager is called with no props (undefined)
      expect(RSVPManager).toHaveBeenCalledWith({}, undefined);
    });

    it('should render without crashing', () => {
      expect(() => render(<RSVPsPage />)).not.toThrow();
    });
  });

  describe('Page Metadata', () => {
    it('should export dynamic force-dynamic', () => {
      const module = require('./page');
      expect(module.dynamic).toBe('force-dynamic');
    });
  });
});
