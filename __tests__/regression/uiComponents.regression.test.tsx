/**
 * Regression Test Suite: UI Components
 * 
 * Tests UI component rendering to prevent regressions in:
 * - TropicalIcon rendering
 * - Pura Vida thematic elements
 * - Costa Rica branding
 * - Responsive design
 * - Accessibility
 * 
 * Requirements: 21.6
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TropicalIcon } from '@/components/ui/TropicalIcon';
import {
  PuraVidaBanner,
  CostaRicaHeader,
  CostaRicaFooter,
} from '@/components/ui/PuraVidaBanner';

describe('Regression: UI Components', () => {
  describe('TropicalIcon Component', () => {
    it('should render palm icon', () => {
      render(<TropicalIcon name="palm" />);
      const icon = screen.getByLabelText('Palm tree');
      expect(icon).toBeInTheDocument();
    });

    it('should render wave icon', () => {
      render(<TropicalIcon name="wave" />);
      const icon = screen.getByLabelText('Ocean wave');
      expect(icon).toBeInTheDocument();
    });

    it('should render sun icon', () => {
      render(<TropicalIcon name="sun" />);
      const icon = screen.getByLabelText('Sun');
      expect(icon).toBeInTheDocument();
    });

    it('should render flower icon', () => {
      render(<TropicalIcon name="flower" />);
      const icon = screen.getByLabelText('Tropical flower');
      expect(icon).toBeInTheDocument();
    });

    it('should render bird icon', () => {
      render(<TropicalIcon name="bird" />);
      const icon = screen.getByLabelText('Tropical bird');
      expect(icon).toBeInTheDocument();
    });

    it('should render volcano icon', () => {
      render(<TropicalIcon name="volcano" />);
      const icon = screen.getByLabelText('Volcano');
      expect(icon).toBeInTheDocument();
    });

    it('should render beach icon', () => {
      render(<TropicalIcon name="beach" />);
      const icon = screen.getByLabelText('Beach');
      expect(icon).toBeInTheDocument();
    });

    it('should render pura-vida icon', () => {
      render(<TropicalIcon name="pura-vida" />);
      const icon = screen.getByLabelText('Pura Vida');
      expect(icon).toBeInTheDocument();
    });

    it('should apply small size class', () => {
      render(<TropicalIcon name="palm" size="sm" />);
      const icon = screen.getByLabelText('Palm tree');
      expect(icon).toHaveClass('w-4', 'h-4');
    });

    it('should apply medium size class', () => {
      render(<TropicalIcon name="palm" size="md" />);
      const icon = screen.getByLabelText('Palm tree');
      expect(icon).toHaveClass('w-6', 'h-6');
    });

    it('should apply large size class', () => {
      render(<TropicalIcon name="palm" size="lg" />);
      const icon = screen.getByLabelText('Palm tree');
      expect(icon).toHaveClass('w-8', 'h-8');
    });

    it('should apply extra large size class', () => {
      render(<TropicalIcon name="palm" size="xl" />);
      const icon = screen.getByLabelText('Palm tree');
      expect(icon).toHaveClass('w-12', 'h-12');
    });

    it('should apply animation class when animate is true', () => {
      render(<TropicalIcon name="wave" animate />);
      const icon = screen.getByLabelText('Ocean wave');
      expect(icon).toHaveClass('animate-wave');
    });

    it('should not apply animation class when animate is false', () => {
      render(<TropicalIcon name="wave" animate={false} />);
      const icon = screen.getByLabelText('Ocean wave');
      expect(icon).not.toHaveClass('animate-wave');
    });

    it('should apply custom className', () => {
      render(<TropicalIcon name="palm" className="custom-class" />);
      const icon = screen.getByLabelText('Palm tree');
      expect(icon).toHaveClass('custom-class');
    });

    it('should have proper ARIA labels for accessibility', () => {
      const icons = [
        { name: 'palm' as const, label: 'Palm tree' },
        { name: 'wave' as const, label: 'Ocean wave' },
        { name: 'sun' as const, label: 'Sun' },
        { name: 'flower' as const, label: 'Tropical flower' },
        { name: 'bird' as const, label: 'Tropical bird' },
        { name: 'volcano' as const, label: 'Volcano' },
        { name: 'beach' as const, label: 'Beach' },
        { name: 'pura-vida' as const, label: 'Pura Vida' },
      ];

      icons.forEach(({ name, label }) => {
        const { unmount } = render(<TropicalIcon name={name} />);
        expect(screen.getByLabelText(label)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('PuraVidaBanner Component', () => {
    it('should render "Pura Vida!" text', () => {
      render(<PuraVidaBanner />);
      expect(screen.getByText('Pura Vida!')).toBeInTheDocument();
    });

    it('should render with icons by default', () => {
      render(<PuraVidaBanner />);
      expect(screen.getByLabelText('Sun')).toBeInTheDocument();
      expect(screen.getByLabelText('Palm tree')).toBeInTheDocument();
    });

    it('should not render icons when showIcon is false', () => {
      render(<PuraVidaBanner showIcon={false} />);
      expect(screen.queryByLabelText('Sun')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Palm tree')).not.toBeInTheDocument();
    });

    it('should apply header variant styles', () => {
      render(<PuraVidaBanner variant="header" />);
      const text = screen.getByText('Pura Vida!');
      expect(text).toHaveClass('text-2xl', 'sm:text-3xl', 'font-bold');
    });

    it('should apply footer variant styles', () => {
      render(<PuraVidaBanner variant="footer" />);
      const text = screen.getByText('Pura Vida!');
      expect(text).toHaveClass('text-lg', 'sm:text-xl', 'font-semibold');
    });

    it('should apply inline variant styles', () => {
      render(<PuraVidaBanner variant="inline" />);
      const text = screen.getByText('Pura Vida!');
      expect(text).toHaveClass('text-base', 'sm:text-lg', 'font-medium');
    });

    it('should animate icons when animate is true', () => {
      render(<PuraVidaBanner animate />);
      const sunIcon = screen.getByLabelText('Sun');
      const palmIcon = screen.getByLabelText('Palm tree');
      expect(sunIcon).toHaveClass('animate-wave');
      expect(palmIcon).toHaveClass('animate-wave');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <PuraVidaBanner className="custom-banner" />
      );
      expect(container.firstChild).toHaveClass('custom-banner');
    });
  });

  describe('CostaRicaHeader Component', () => {
    it('should render header with title', () => {
      render(<CostaRicaHeader />);
      expect(screen.getByText('Costa Rica Wedding')).toBeInTheDocument();
    });

    it('should render tropical icons', () => {
      render(<CostaRicaHeader />);
      const palmIcons = screen.getAllByLabelText('Palm tree');
      const waveIcons = screen.getAllByLabelText('Ocean wave');
      expect(palmIcons.length).toBeGreaterThan(0);
      expect(waveIcons.length).toBeGreaterThan(0);
    });

    it('should render Pura Vida banner', () => {
      render(<CostaRicaHeader />);
      expect(screen.getByText('Pura Vida!')).toBeInTheDocument();
    });

    it('should have gradient background', () => {
      const { container } = render(<CostaRicaHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-gradient-to-r');
    });

    it('should have proper semantic HTML structure', () => {
      const { container } = render(<CostaRicaHeader />);
      const header = container.querySelector('header');
      const h1 = container.querySelector('h1');
      expect(header).toBeInTheDocument();
      expect(h1).toBeInTheDocument();
      expect(h1?.textContent).toBe('Costa Rica Wedding');
    });
  });

  describe('CostaRicaFooter Component', () => {
    it('should render footer with Pura Vida banner', () => {
      render(<CostaRicaFooter />);
      expect(screen.getByText('Pura Vida!')).toBeInTheDocument();
    });

    it('should render location information', () => {
      render(<CostaRicaFooter />);
      expect(screen.getByText('Costa Rica')).toBeInTheDocument();
      expect(screen.getByText('Destination Wedding')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();
    });

    it('should render tropical icons', () => {
      render(<CostaRicaFooter />);
      expect(screen.getByLabelText('Beach')).toBeInTheDocument();
      expect(screen.getByLabelText('Tropical flower')).toBeInTheDocument();
      expect(screen.getByLabelText('Tropical bird')).toBeInTheDocument();
    });

    it('should render footer message', () => {
      render(<CostaRicaFooter />);
      expect(
        screen.getByText('Made with ❤️ for an unforgettable celebration')
      ).toBeInTheDocument();
    });

    it('should have proper semantic HTML structure', () => {
      const { container } = render(<CostaRicaFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('should have dark background', () => {
      const { container } = render(<CostaRicaFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('bg-sage-900');
    });
  });

  describe('Costa Rica Theme Consistency', () => {
    it('should use consistent color palette across components', () => {
      const { container: headerContainer } = render(<CostaRicaHeader />);
      const { container: footerContainer } = render(<CostaRicaFooter />);

      // Check for Costa Rica color classes
      const headerHTML = headerContainer.innerHTML;
      const footerHTML = footerContainer.innerHTML;

      // Verify jungle, ocean, sunset, sage colors are used
      expect(
        headerHTML.includes('jungle') ||
          headerHTML.includes('ocean') ||
          headerHTML.includes('sunset')
      ).toBe(true);

      expect(footerHTML.includes('sage')).toBe(true);
    });

    it('should maintain tropical theme across all icons', () => {
      const tropicalIcons = [
        'palm',
        'wave',
        'sun',
        'flower',
        'bird',
        'volcano',
        'beach',
      ] as const;

      tropicalIcons.forEach((iconName) => {
        const { unmount } = render(<TropicalIcon name={iconName} />);
        const icon = screen.getByLabelText(
          iconName === 'palm'
            ? 'Palm tree'
            : iconName === 'wave'
            ? 'Ocean wave'
            : iconName === 'sun'
            ? 'Sun'
            : iconName === 'flower'
            ? 'Tropical flower'
            : iconName === 'bird'
            ? 'Tropical bird'
            : iconName === 'volcano'
            ? 'Volcano'
            : 'Beach'
        );
        expect(icon).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive text classes in header', () => {
      render(<CostaRicaHeader />);
      const title = screen.getByText('Costa Rica Wedding');
      expect(title).toHaveClass('text-responsive-xl');
    });

    it('should have responsive text classes in banner variants', () => {
      const { unmount: unmount1 } = render(
        <PuraVidaBanner variant="header" />
      );
      expect(screen.getByText('Pura Vida!')).toHaveClass('sm:text-3xl');
      unmount1();

      const { unmount: unmount2 } = render(
        <PuraVidaBanner variant="footer" />
      );
      expect(screen.getByText('Pura Vida!')).toHaveClass('sm:text-xl');
      unmount2();

      render(<PuraVidaBanner variant="inline" />);
      expect(screen.getByText('Pura Vida!')).toHaveClass('sm:text-lg');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on all icons', () => {
      render(
        <div>
          <TropicalIcon name="palm" />
          <TropicalIcon name="wave" />
          <TropicalIcon name="sun" />
        </div>
      );

      expect(screen.getByLabelText('Palm tree')).toBeInTheDocument();
      expect(screen.getByLabelText('Ocean wave')).toBeInTheDocument();
      expect(screen.getByLabelText('Sun')).toBeInTheDocument();
    });

    it('should use semantic HTML in header', () => {
      const { container } = render(<CostaRicaHeader />);
      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('h1')).toBeInTheDocument();
    });

    it('should use semantic HTML in footer', () => {
      const { container } = render(<CostaRicaFooter />);
      expect(container.querySelector('footer')).toBeInTheDocument();
    });
  });

  describe('Animation Support', () => {
    it('should support animation on TropicalIcon', () => {
      render(<TropicalIcon name="wave" animate />);
      expect(screen.getByLabelText('Ocean wave')).toHaveClass('animate-wave');
    });

    it('should support animation on PuraVidaBanner icons', () => {
      const { container } = render(<PuraVidaBanner animate />);
      // Query SVG elements directly instead of using role
      const svgElements = container.querySelectorAll('svg');
      const animatedIcons = Array.from(svgElements).filter(svg => 
        svg.classList.contains('animate-wave')
      );
      expect(animatedIcons.length).toBeGreaterThan(0);
      animatedIcons.forEach((icon) => {
        expect(icon).toHaveClass('animate-wave');
      });
    });

    it('should animate icons in CostaRicaHeader', () => {
      const { container } = render(<CostaRicaHeader />);
      const animatedElements = container.querySelectorAll('.animate-wave');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });
});
