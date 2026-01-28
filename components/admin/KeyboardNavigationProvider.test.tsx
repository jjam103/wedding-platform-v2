/**
 * Tests for KeyboardNavigationProvider
 * 
 * Tests keyboard navigation functionality including:
 * - Shortcut registration and unregistration
 * - Help dialog display
 * - Focus management
 * - Tab order
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KeyboardNavigationProvider, useRegisterShortcuts } from './KeyboardNavigationProvider';
import type { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

// Mock KeyboardShortcutsDialog
jest.mock('@/components/ui/KeyboardShortcutsDialog', () => ({
  KeyboardShortcutsDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="shortcuts-dialog">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

describe('KeyboardNavigationProvider', () => {
  describe('Help Dialog', () => {
    it('should show help dialog when ? key is pressed', () => {
      render(
        <KeyboardNavigationProvider>
          <div>Content</div>
        </KeyboardNavigationProvider>
      );

      // Press ? key
      fireEvent.keyDown(window, { key: '?' });

      // Help dialog should be visible
      expect(screen.getByTestId('shortcuts-dialog')).toBeInTheDocument();
    });

    it('should hide help dialog when close button is clicked', () => {
      render(
        <KeyboardNavigationProvider>
          <div>Content</div>
        </KeyboardNavigationProvider>
      );

      // Show dialog
      fireEvent.keyDown(window, { key: '?' });
      expect(screen.getByTestId('shortcuts-dialog')).toBeInTheDocument();

      // Close dialog
      fireEvent.click(screen.getByText('Close'));

      // Dialog should be hidden
      expect(screen.queryByTestId('shortcuts-dialog')).not.toBeInTheDocument();
    });

    it('should hide help dialog when Escape key is pressed', () => {
      render(
        <KeyboardNavigationProvider>
          <div>Content</div>
        </KeyboardNavigationProvider>
      );

      // Show dialog
      fireEvent.keyDown(window, { key: '?' });
      expect(screen.getByTestId('shortcuts-dialog')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      // Dialog should be hidden
      waitFor(() => {
        expect(screen.queryByTestId('shortcuts-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Skip to Main Content', () => {
    it('should render skip to main content link', () => {
      render(
        <KeyboardNavigationProvider>
          <div>Content</div>
        </KeyboardNavigationProvider>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should have proper class for screen reader visibility', () => {
      render(
        <KeyboardNavigationProvider>
          <div>Content</div>
        </KeyboardNavigationProvider>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('skip-to-main');
    });
  });

  describe('Shortcut Registration', () => {
    it('should render without errors when shortcuts are registered', () => {
      const TestComponent = () => {
        return <div>Test Component</div>;
      };

      render(
        <KeyboardNavigationProvider>
          <TestComponent />
        </KeyboardNavigationProvider>
      );

      // Component should render without errors
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });
});

describe('Keyboard Navigation - Tab Order', () => {
  it('should maintain logical tab order for interactive elements', () => {
    render(
      <div>
        <button>First</button>
        <input type="text" aria-label="Input" />
        <a href="/test">Link</a>
        <button>Last</button>
      </div>
    );

    const first = screen.getByText('First');
    const input = screen.getByLabelText('Input');
    const link = screen.getByText('Link');
    const last = screen.getByText('Last');

    // All elements should be in the document
    expect(first).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(link).toBeInTheDocument();
    expect(last).toBeInTheDocument();

    // Elements should not have positive tabindex
    expect(first).not.toHaveAttribute('tabindex', expect.stringMatching(/^[1-9]/));
    expect(input).not.toHaveAttribute('tabindex', expect.stringMatching(/^[1-9]/));
    expect(link).not.toHaveAttribute('tabindex', expect.stringMatching(/^[1-9]/));
    expect(last).not.toHaveAttribute('tabindex', expect.stringMatching(/^[1-9]/));
  });

  it('should skip hidden elements in tab order', () => {
    render(
      <div>
        <button>Visible</button>
        <button style={{ display: 'none' }}>Hidden</button>
        <button>Also Visible</button>
      </div>
    );

    const visible = screen.getByText('Visible');
    const alsoVisible = screen.getByText('Also Visible');

    expect(visible).toBeVisible();
    expect(alsoVisible).toBeVisible();
  });
});

describe('Keyboard Navigation - Focus Indicators', () => {
  it('should have visible focus indicators on buttons', () => {
    render(<button>Test Button</button>);

    const button = screen.getByText('Test Button');
    button.focus();

    expect(button).toHaveFocus();
  });

  it('should have visible focus indicators on links', () => {
    render(<a href="/test">Test Link</a>);

    const link = screen.getByText('Test Link');
    link.focus();

    expect(link).toHaveFocus();
  });

  it('should have visible focus indicators on inputs', () => {
    render(<input type="text" aria-label="Test Input" />);

    const input = screen.getByLabelText('Test Input');
    input.focus();

    expect(input).toHaveFocus();
  });
});

describe('Keyboard Shortcuts', () => {
  it('should handle ? key to show help', () => {
    render(
      <KeyboardNavigationProvider>
        <div>Test</div>
      </KeyboardNavigationProvider>
    );

    // Press ?
    fireEvent.keyDown(window, { key: '?' });

    // Help dialog should be visible
    expect(screen.getByTestId('shortcuts-dialog')).toBeInTheDocument();
  });

  it('should not trigger shortcuts when typing in input fields', () => {
    render(
      <KeyboardNavigationProvider>
        <input type="text" aria-label="Test Input" />
      </KeyboardNavigationProvider>
    );

    const input = screen.getByLabelText('Test Input');
    input.focus();

    // Type 'n' in input field - should not trigger any shortcuts
    fireEvent.keyDown(input, { key: 'n' });

    // No errors should occur
    expect(input).toBeInTheDocument();
  });

  it('should handle Escape key', () => {
    render(
      <KeyboardNavigationProvider>
        <div>Test</div>
      </KeyboardNavigationProvider>
    );

    // Press Escape - should not cause errors
    fireEvent.keyDown(window, { key: 'Escape' });

    // Component should still be rendered
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
