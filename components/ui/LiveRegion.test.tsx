/**
 * Tests for LiveRegion Component
 * 
 * Tests ARIA live region functionality for screen reader announcements.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { LiveRegion, VisuallyHidden } from './LiveRegion';

describe('LiveRegion Component', () => {
  describe('ARIA Attributes', () => {
    it('should have polite aria-live by default', () => {
      const { container } = render(<LiveRegion message="Test message" />);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('role', 'status');
    });

    it('should have assertive aria-live when specified', () => {
      const { container } = render(<LiveRegion message="Error message" priority="assertive" />);

      const liveRegion = container.querySelector('[aria-live="assertive"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('role', 'alert');
    });

    it('should have aria-atomic="true"', () => {
      const { container } = render(<LiveRegion message="Test message" />);

      const liveRegion = container.querySelector('[aria-atomic="true"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('should be visually hidden', () => {
      const { container } = render(<LiveRegion message="Test message" />);

      const liveRegion = container.querySelector('.sr-only');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should display message after delay', async () => {
      const { container } = render(<LiveRegion message="Success message" />);

      await waitFor(() => {
        const liveRegion = container.querySelector('[aria-live]');
        expect(liveRegion?.textContent).toBe('Success message');
      }, { timeout: 200 });
    });

    it('should update message when prop changes', async () => {
      const { container, rerender } = render(<LiveRegion message="First message" />);

      await waitFor(() => {
        const liveRegion = container.querySelector('[aria-live]');
        expect(liveRegion?.textContent).toBe('First message');
      }, { timeout: 200 });

      rerender(<LiveRegion message="Second message" />);

      await waitFor(() => {
        const liveRegion = container.querySelector('[aria-live]');
        expect(liveRegion?.textContent).toBe('Second message');
      }, { timeout: 200 });
    });

    it('should clear message after specified time', async () => {
      const { container } = render(<LiveRegion message="Temporary message" clearAfter={500} />);

      await waitFor(() => {
        const liveRegion = container.querySelector('[aria-live]');
        expect(liveRegion?.textContent).toBe('Temporary message');
      }, { timeout: 200 });

      await waitFor(() => {
        const liveRegion = container.querySelector('[aria-live]');
        expect(liveRegion?.textContent).toBe('');
      }, { timeout: 700 });
    });

    it('should handle empty message', () => {
      const { container } = render(<LiveRegion message="" />);

      const liveRegion = container.querySelector('[aria-live]');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('Priority Levels', () => {
    it('should use status role for polite priority', () => {
      const { container } = render(<LiveRegion message="Info" priority="polite" />);

      const liveRegion = container.querySelector('[role="status"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('should use alert role for assertive priority', () => {
      const { container } = render(<LiveRegion message="Error" priority="assertive" />);

      const liveRegion = container.querySelector('[role="alert"]');
      expect(liveRegion).toBeInTheDocument();
    });
  });
});

describe('VisuallyHidden Component', () => {
  it('should render children', () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>);

    expect(screen.getByText('Hidden text')).toBeInTheDocument();
  });

  it('should have sr-only class', () => {
    const { container } = render(<VisuallyHidden>Hidden text</VisuallyHidden>);

    const element = container.querySelector('.sr-only');
    expect(element).toBeInTheDocument();
    expect(element?.textContent).toBe('Hidden text');
  });

  it('should render complex children', () => {
    render(
      <VisuallyHidden>
        <span>Part 1</span>
        <span>Part 2</span>
      </VisuallyHidden>
    );

    expect(screen.getByText('Part 1')).toBeInTheDocument();
    expect(screen.getByText('Part 2')).toBeInTheDocument();
  });
});
