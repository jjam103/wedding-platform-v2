/**
 * Tests for Accessibility Utilities
 * 
 * Tests screen reader announcements, ARIA label generation, and focus management.
 */

import {
  announceToScreenReader,
  generateAriaLabel,
  generateAriaDescription,
  focusElement,
  trapFocus,
  getAccessibleButtonName,
  formatCountForScreenReader,
  generatePaginationAriaLabel,
  generateStatusAriaLabel,
} from './accessibility';

describe('Accessibility Utilities', () => {
  beforeEach(() => {
    // Clean up any existing live regions
    const existingRegion = document.getElementById('screen-reader-announcements');
    if (existingRegion) {
      existingRegion.remove();
    }
  });

  describe('announceToScreenReader', () => {
    it('should create live region if it does not exist', () => {
      announceToScreenReader('Test message', 'polite');

      const liveRegion = document.getElementById('screen-reader-announcements');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('role', 'status');
    });

    it('should announce message with polite priority', (done) => {
      announceToScreenReader('Guest created successfully', 'polite');

      setTimeout(() => {
        const liveRegion = document.getElementById('screen-reader-announcements');
        expect(liveRegion?.textContent).toBe('Guest created successfully');
        done();
      }, 150);
    });

    it('should announce message with assertive priority', (done) => {
      announceToScreenReader('Error occurred', 'assertive');

      setTimeout(() => {
        const liveRegion = document.getElementById('screen-reader-announcements');
        expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
        expect(liveRegion).toHaveAttribute('role', 'alert');
        expect(liveRegion?.textContent).toBe('Error occurred');
        done();
      }, 150);
    });

    it('should update existing live region', (done) => {
      announceToScreenReader('First message', 'polite');

      setTimeout(() => {
        announceToScreenReader('Second message', 'polite');

        setTimeout(() => {
          const liveRegion = document.getElementById('screen-reader-announcements');
          expect(liveRegion?.textContent).toBe('Second message');
          done();
        }, 150);
      }, 150);
    });

    it('should change priority when specified', (done) => {
      announceToScreenReader('Polite message', 'polite');

      setTimeout(() => {
        announceToScreenReader('Assertive message', 'assertive');

        setTimeout(() => {
          const liveRegion = document.getElementById('screen-reader-announcements');
          expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
          expect(liveRegion).toHaveAttribute('role', 'alert');
          done();
        }, 150);
      }, 150);
    });
  });

  describe('generateAriaLabel', () => {
    it('should generate basic label', () => {
      const label = generateAriaLabel('Email');
      expect(label).toBe('Email');
    });

    it('should add required indicator', () => {
      const label = generateAriaLabel('Email', true);
      expect(label).toBe('Email (required)');
    });

    it('should add error message', () => {
      const label = generateAriaLabel('Email', false, 'Invalid email format');
      expect(label).toBe('Email - Error: Invalid email format');
    });

    it('should add both required and error', () => {
      const label = generateAriaLabel('Email', true, 'Invalid email format');
      expect(label).toBe('Email (required) - Error: Invalid email format');
    });
  });

  describe('generateAriaDescription', () => {
    it('should return base description', () => {
      const description = generateAriaDescription('Delete guest');
      expect(description).toBe('Delete guest');
    });

    it('should add additional info', () => {
      const description = generateAriaDescription('Delete guest', 'This action cannot be undone');
      expect(description).toBe('Delete guest. This action cannot be undone');
    });
  });

  describe('focusElement', () => {
    it('should focus element by ID', () => {
      const input = document.createElement('input');
      input.id = 'test-input';
      document.body.appendChild(input);

      focusElement('test-input');

      expect(document.activeElement).toBe(input);

      document.body.removeChild(input);
    });

    it('should announce when focusing element', (done) => {
      const input = document.createElement('input');
      input.id = 'test-input';
      document.body.appendChild(input);

      focusElement('test-input', 'Search field focused');

      setTimeout(() => {
        const liveRegion = document.getElementById('screen-reader-announcements');
        expect(liveRegion?.textContent).toBe('Search field focused');
        document.body.removeChild(input);
        done();
      }, 150);
    });

    it('should handle non-existent element gracefully', () => {
      expect(() => focusElement('non-existent')).not.toThrow();
    });
  });

  describe('trapFocus', () => {
    it('should trap focus within container', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      const button3 = document.createElement('button');

      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);
      document.body.appendChild(container);

      const cleanup = trapFocus(container);

      // First element should be focused
      expect(document.activeElement).toBe(button1);

      cleanup();
      document.body.removeChild(container);
    });

    it('should return cleanup function', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      container.appendChild(button);
      document.body.appendChild(container);

      const cleanup = trapFocus(container);

      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();

      document.body.removeChild(container);
    });
  });

  describe('getAccessibleButtonName', () => {
    it('should generate button name without entity name', () => {
      const name = getAccessibleButtonName('delete', 'guest');
      expect(name).toBe('Delete guest');
    });

    it('should generate button name with entity name', () => {
      const name = getAccessibleButtonName('delete', 'guest', 'John Doe');
      expect(name).toBe('Delete guest John Doe');
    });

    it('should capitalize action', () => {
      const name = getAccessibleButtonName('edit', 'event', 'Wedding Ceremony');
      expect(name).toBe('Edit event Wedding Ceremony');
    });
  });

  describe('formatCountForScreenReader', () => {
    it('should use singular for count of 1', () => {
      const formatted = formatCountForScreenReader(1, 'guest', 'guests');
      expect(formatted).toBe('1 guest');
    });

    it('should use plural for count of 0', () => {
      const formatted = formatCountForScreenReader(0, 'guest', 'guests');
      expect(formatted).toBe('0 guests');
    });

    it('should use plural for count greater than 1', () => {
      const formatted = formatCountForScreenReader(5, 'guest', 'guests');
      expect(formatted).toBe('5 guests');
    });
  });

  describe('generatePaginationAriaLabel', () => {
    it('should generate pagination label', () => {
      const label = generatePaginationAriaLabel(2, 10);
      expect(label).toBe('Page 2 of 10');
    });

    it('should handle first page', () => {
      const label = generatePaginationAriaLabel(1, 5);
      expect(label).toBe('Page 1 of 5');
    });

    it('should handle last page', () => {
      const label = generatePaginationAriaLabel(10, 10);
      expect(label).toBe('Page 10 of 10');
    });
  });

  describe('generateStatusAriaLabel', () => {
    it('should generate status label', () => {
      const label = generateStatusAriaLabel('published', 'page');
      expect(label).toBe('page status: published');
    });

    it('should handle different statuses', () => {
      const label = generateStatusAriaLabel('draft', 'content');
      expect(label).toBe('content status: draft');
    });
  });
});
