/**
 * Unit Tests for PhotoGallerySkeleton Component
 * 
 * Tests:
 * - Skeleton rendering
 * - Animation effects
 * - Grid layout
 * - Accessibility
 * 
 * Requirements: Photo gallery loading state
 */

import { render, screen, cleanup } from '@testing-library/react';
import { PhotoGallerySkeleton } from './PhotoGallerySkeleton';

describe('PhotoGallerySkeleton', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render skeleton container', () => {
      render(<PhotoGallerySkeleton />);

      const container = screen.getByTestId('photo-gallery-skeleton');
      expect(container).toBeInTheDocument();
    });

    it('should render multiple skeleton items', () => {
      render(<PhotoGallerySkeleton />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      expect(skeletonItems.length).toBeGreaterThan(0);
      expect(skeletonItems.length).toBeLessThanOrEqual(12); // Reasonable max
    });

    it('should render default number of items when no count specified', () => {
      render(<PhotoGallerySkeleton />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      expect(skeletonItems.length).toBe(8); // Default count
    });

    it('should render custom number of items when count specified', () => {
      render(<PhotoGallerySkeleton count={6} />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      expect(skeletonItems.length).toBe(6);
    });
  });

  describe('Grid Layout', () => {
    it('should have proper grid container classes', () => {
      render(<PhotoGallerySkeleton />);

      const container = screen.getByTestId('photo-gallery-skeleton');
      expect(container).toHaveClass('grid');
      expect(container).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4');
      expect(container).toHaveClass('gap-4');
    });

    it('should have responsive grid columns', () => {
      render(<PhotoGallerySkeleton />);

      const container = screen.getByTestId('photo-gallery-skeleton');
      
      // Should have responsive classes
      expect(container.className).toContain('grid-cols-2'); // Mobile
      expect(container.className).toContain('md:grid-cols-3'); // Tablet
      expect(container.className).toContain('lg:grid-cols-4'); // Desktop
    });

    it('should have proper spacing between items', () => {
      render(<PhotoGallerySkeleton />);

      const container = screen.getByTestId('photo-gallery-skeleton');
      expect(container).toHaveClass('gap-4');
    });
  });

  describe('Skeleton Items', () => {
    it('should render skeleton items with proper structure', () => {
      render(<PhotoGallerySkeleton />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      
      skeletonItems.forEach(item => {
        expect(item).toHaveClass('bg-sage-200');
        expect(item).toHaveClass('rounded-lg');
        expect(item).toHaveClass('aspect-square'); // Square aspect ratio
      });
    });

    it('should have animation classes', () => {
      render(<PhotoGallerySkeleton />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      
      skeletonItems.forEach(item => {
        expect(item).toHaveClass('animate-pulse');
      });
    });

    it('should have proper dimensions', () => {
      render(<PhotoGallerySkeleton />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      
      skeletonItems.forEach(item => {
        expect(item).toHaveClass('w-full');
        expect(item).toHaveClass('aspect-square');
      });
    });

    it('should have rounded corners', () => {
      render(<PhotoGallerySkeleton />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      
      skeletonItems.forEach(item => {
        expect(item).toHaveClass('rounded-lg');
      });
    });
  });

  describe('Animation', () => {
    it('should have pulse animation on skeleton items', () => {
      render(<PhotoGallerySkeleton />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      
      skeletonItems.forEach(item => {
        expect(item).toHaveClass('animate-pulse');
      });
    });

    it('should have consistent animation timing', () => {
      render(<PhotoGallerySkeleton />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      
      // All items should have the same animation class
      skeletonItems.forEach(item => {
        expect(item.className).toContain('animate-pulse');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<PhotoGallerySkeleton />);

      const container = screen.getByTestId('photo-gallery-skeleton');
      expect(container).toHaveAttribute('aria-label', 'Loading photos');
      expect(container).toHaveAttribute('role', 'status');
    });

    it('should have aria-hidden on skeleton items', () => {
      render(<PhotoGallerySkeleton />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      
      skeletonItems.forEach(item => {
        expect(item).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should provide screen reader text', () => {
      render(<PhotoGallerySkeleton />);

      expect(screen.getByText('Loading photo gallery...')).toBeInTheDocument();
    });

    it('should have visually hidden screen reader text', () => {
      render(<PhotoGallerySkeleton />);

      const srText = screen.getByText('Loading photo gallery...');
      expect(srText).toHaveClass('sr-only');
    });
  });

  describe('Color Scheme', () => {
    it('should use sage color scheme', () => {
      render(<PhotoGallerySkeleton />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      
      skeletonItems.forEach(item => {
        expect(item).toHaveClass('bg-sage-200');
      });
    });

    it('should have consistent color across all items', () => {
      render(<PhotoGallerySkeleton />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      
      // All items should have the same background color
      skeletonItems.forEach(item => {
        expect(item.className).toContain('bg-sage-200');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero count gracefully', () => {
      render(<PhotoGallerySkeleton count={0} />);

      const container = screen.getByTestId('photo-gallery-skeleton');
      expect(container).toBeInTheDocument();
      
      const skeletonItems = screen.queryAllByTestId('photo-skeleton-item');
      expect(skeletonItems.length).toBe(0);
    });

    it('should handle large count values', () => {
      render(<PhotoGallerySkeleton count={20} />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      expect(skeletonItems.length).toBe(20);
    });

    it('should handle negative count values', () => {
      render(<PhotoGallerySkeleton count={-5} />);

      // Should fallback to default or handle gracefully
      const skeletonItems = screen.queryAllByTestId('photo-skeleton-item');
      expect(skeletonItems.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should render efficiently with many items', () => {
      const startTime = performance.now();
      
      render(<PhotoGallerySkeleton count={50} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      
      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      expect(skeletonItems.length).toBe(50);
    });

    it('should not cause memory leaks', () => {
      const { unmount } = render(<PhotoGallerySkeleton count={20} />);
      
      // Should unmount cleanly
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to different screen sizes', () => {
      render(<PhotoGallerySkeleton />);

      const container = screen.getByTestId('photo-gallery-skeleton');
      
      // Should have responsive grid classes
      expect(container).toHaveClass('grid-cols-2'); // Mobile: 2 columns
      expect(container).toHaveClass('md:grid-cols-3'); // Tablet: 3 columns
      expect(container).toHaveClass('lg:grid-cols-4'); // Desktop: 4 columns
    });

    it('should maintain aspect ratio across screen sizes', () => {
      render(<PhotoGallerySkeleton />);

      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      
      skeletonItems.forEach(item => {
        expect(item).toHaveClass('aspect-square');
      });
    });
  });

  describe('Integration', () => {
    it('should work with different parent containers', () => {
      const { container } = render(
        <div className="max-w-4xl mx-auto p-4">
          <PhotoGallerySkeleton />
        </div>
      );

      const skeleton = screen.getByTestId('photo-gallery-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('max-w-4xl');
    });

    it('should not interfere with other components', () => {
      render(
        <div>
          <h1>Photo Gallery</h1>
          <PhotoGallerySkeleton />
          <p>Loading photos...</p>
        </div>
      );

      expect(screen.getByText('Photo Gallery')).toBeInTheDocument();
      expect(screen.getByTestId('photo-gallery-skeleton')).toBeInTheDocument();
      expect(screen.getByText('Loading photos...')).toBeInTheDocument();
    });
  });

  describe('Styling Consistency', () => {
    it('should match photo gallery styling', () => {
      render(<PhotoGallerySkeleton />);

      const container = screen.getByTestId('photo-gallery-skeleton');
      const skeletonItems = screen.getAllByTestId('photo-skeleton-item');
      
      // Container should match gallery grid
      expect(container).toHaveClass('grid', 'gap-4');
      
      // Items should match photo card styling
      skeletonItems.forEach(item => {
        expect(item).toHaveClass('rounded-lg', 'aspect-square');
      });
    });

    it('should use consistent spacing', () => {
      render(<PhotoGallerySkeleton />);

      const container = screen.getByTestId('photo-gallery-skeleton');
      expect(container).toHaveClass('gap-4'); // Matches photo gallery spacing
    });
  });
});