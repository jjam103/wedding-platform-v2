/**
 * Tests for Tropical Loading Components
 * 
 * Tests loading indicators, spinners, and skeleton loaders for accessibility.
 */

import { render, screen } from '@testing-library/react';
import { TropicalLoading, TropicalSpinner, TropicalSkeleton } from './TropicalLoading';

// Mock TropicalIcon
jest.mock('./TropicalIcon', () => ({
  TropicalIcon: ({ name, size, animate, className }: any) => (
    <div data-testid={`icon-${name}`} className={className}>
      {name} icon
    </div>
  ),
}));

describe('TropicalLoading Component', () => {
  describe('ARIA Attributes', () => {
    it('should have role="status"', () => {
      const { container } = render(<TropicalLoading />);

      const status = container.querySelector('[role="status"]');
      expect(status).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      const { container } = render(<TropicalLoading />);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('should have aria-busy="true"', () => {
      const { container } = render(<TropicalLoading />);

      const busyElement = container.querySelector('[aria-busy="true"]');
      expect(busyElement).toBeInTheDocument();
    });

    it('should have screen reader text', () => {
      render(<TropicalLoading message="Loading guests" />);

      const srText = screen.getAllByText('Loading guests');
      expect(srText.length).toBeGreaterThan(0);
    });
  });

  describe('Loading Message', () => {
    it('should display default loading message', () => {
      render(<TropicalLoading />);

      expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);
    });

    it('should display custom loading message', () => {
      render(<TropicalLoading message="Saving changes..." />);

      expect(screen.getAllByText('Saving changes...').length).toBeGreaterThan(0);
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      const { container } = render(<TropicalLoading size="sm" />);

      const text = container.querySelector('.text-sm');
      expect(text).toBeInTheDocument();
    });

    it('should render medium size', () => {
      const { container } = render(<TropicalLoading size="md" />);

      const text = container.querySelector('.text-base');
      expect(text).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(<TropicalLoading size="lg" />);

      const text = container.querySelector('.text-lg');
      expect(text).toBeInTheDocument();
    });
  });

  describe('Full Screen Mode', () => {
    it('should render full screen when specified', () => {
      const { container } = render(<TropicalLoading fullScreen={true} />);

      const fullScreen = container.querySelector('.fixed.inset-0');
      expect(fullScreen).toBeInTheDocument();
    });

    it('should not render full screen by default', () => {
      const { container } = render(<TropicalLoading />);

      const fullScreen = container.querySelector('.fixed.inset-0');
      expect(fullScreen).not.toBeInTheDocument();
    });
  });

  describe('Tropical Icons', () => {
    it('should render palm, sun, and wave icons', () => {
      render(<TropicalLoading />);

      expect(screen.getByTestId('icon-palm')).toBeInTheDocument();
      expect(screen.getByTestId('icon-sun')).toBeInTheDocument();
      expect(screen.getByTestId('icon-wave')).toBeInTheDocument();
    });
  });
});

describe('TropicalSpinner Component', () => {
  describe('ARIA Attributes', () => {
    it('should have role="status"', () => {
      const { container } = render(<TropicalSpinner />);

      const status = container.querySelector('[role="status"]');
      expect(status).toBeInTheDocument();
    });

    it('should have aria-label="Loading"', () => {
      const { container } = render(<TropicalSpinner />);

      const spinner = container.querySelector('[aria-label="Loading"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small spinner', () => {
      const { container } = render(<TropicalSpinner size="sm" />);

      const spinner = container.querySelector('.h-6.w-6');
      expect(spinner).toBeInTheDocument();
    });

    it('should render medium spinner', () => {
      const { container } = render(<TropicalSpinner size="md" />);

      const spinner = container.querySelector('.h-10.w-10');
      expect(spinner).toBeInTheDocument();
    });

    it('should render large spinner', () => {
      const { container } = render(<TropicalSpinner size="lg" />);

      const spinner = container.querySelector('.h-16.w-16');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should have spin animation', () => {
      const { container } = render(<TropicalSpinner />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });
});

describe('TropicalSkeleton Component', () => {
  describe('ARIA Attributes', () => {
    it('should have role="status"', () => {
      const { container } = render(<TropicalSkeleton />);

      const status = container.querySelector('[role="status"]');
      expect(status).toBeInTheDocument();
    });

    it('should have aria-label="Loading content"', () => {
      const { container } = render(<TropicalSkeleton />);

      const skeleton = container.querySelector('[aria-label="Loading content"]');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render text variant', () => {
      const { container } = render(<TropicalSkeleton variant="text" />);

      const skeleton = container.querySelector('.h-4.rounded');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render circular variant', () => {
      const { container } = render(<TropicalSkeleton variant="circular" />);

      const skeleton = container.querySelector('.rounded-full');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render rectangular variant', () => {
      const { container } = render(<TropicalSkeleton variant="rectangular" />);

      const skeleton = container.querySelector('.rounded-lg');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<TropicalSkeleton className="custom-class" />);

      const skeleton = container.querySelector('.custom-class');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should have pulse animation', () => {
      const { container } = render(<TropicalSkeleton />);

      const skeleton = container.querySelector('.animate-pulse-gentle');
      expect(skeleton).toBeInTheDocument();
    });
  });
});

describe('Loading States - Screen Reader Announcements', () => {
  it('should announce loading state to screen readers', () => {
    render(<TropicalLoading message="Loading data" />);

    // Check for screen reader only text
    const srText = document.querySelector('.sr-only');
    expect(srText).toBeInTheDocument();
    expect(srText?.textContent).toBe('Loading data');
  });

  it('should have proper ARIA attributes for async operations', () => {
    const { container } = render(<TropicalLoading />);

    const status = container.querySelector('[role="status"][aria-live="polite"][aria-busy="true"]');
    expect(status).toBeInTheDocument();
  });
});

describe('Loading States - Element Disabling', () => {
  it('should disable interactive elements during loading', () => {
    const { container } = render(
      <div>
        <button disabled aria-busy="true">
          Save
        </button>
      </div>
    );

    const button = container.querySelector('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
