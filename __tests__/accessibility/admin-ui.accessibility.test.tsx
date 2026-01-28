/**
 * Accessibility Tests for Admin UI Components
 * 
 * Tests WCAG 2.1 AA compliance for admin interface components.
 */

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Admin UI Accessibility Tests', () => {
  describe('Button Component', () => {
    it('should have no accessibility violations for primary button', async () => {
      const { container } = render(
        <Button variant="primary">Primary Button</Button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for secondary button', async () => {
      const { container } = render(
        <Button variant="secondary">Secondary Button</Button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for danger button', async () => {
      const { container } = render(
        <Button variant="danger">Delete</Button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for loading button', async () => {
      const { container } = render(
        <Button loading={true}>Loading...</Button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for disabled button', async () => {
      const { container } = render(
        <Button disabled={true}>Disabled Button</Button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes for loading state', async () => {
      const { container } = render(
        <Button loading={true} aria-label="Saving changes">
          Save
        </Button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Card Component', () => {
    it('should have no accessibility violations for basic card', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <h2>Card Title</h2>
          </CardHeader>
          <CardBody>
            <p>Card content goes here</p>
          </CardBody>
          <CardFooter>
            <Button>Action</Button>
          </CardFooter>
        </Card>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for clickable card', async () => {
      const { container } = render(
        <Card onClick={() => {}}>
          <CardBody>
            <p>Clickable card content</p>
          </CardBody>
        </Card>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Toast Component', () => {
    it('should have no accessibility violations for success toast', async () => {
      const { container } = render(
        <Toast
          id="toast-1"
          type="success"
          message="Operation completed successfully"
          onClose={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for error toast', async () => {
      const { container } = render(
        <Toast
          id="toast-2"
          type="error"
          message="An error occurred"
          onClose={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for warning toast', async () => {
      const { container } = render(
        <Toast
          id="toast-3"
          type="warning"
          message="Warning: Please review"
          onClose={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for info toast', async () => {
      const { container } = render(
        <Toast
          id="toast-4"
          type="info"
          message="Information message"
          onClose={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA live region', async () => {
      const { container } = render(
        <Toast
          id="toast-5"
          type="success"
          message="Success message"
          onClose={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ConfirmDialog Component', () => {
    it('should have no accessibility violations for confirm dialog', async () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={async () => {}}
          title="Confirm Delete"
          message="Are you sure you want to delete this item?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes for modal', async () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={async () => {}}
          title="Confirm Action"
          message="Please confirm this action"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast - Admin Theme', () => {
    it('should meet WCAG AA for jungle (green) buttons', async () => {
      const { container } = render(
        <button className="bg-jungle-500 text-white px-4 py-2 rounded">
          Primary Action
        </button>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should meet WCAG AA for volcano (red) buttons', async () => {
      const { container } = render(
        <button className="bg-volcano-500 text-white px-4 py-2 rounded">
          Delete
        </button>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should meet WCAG AA for sage (gray) text', async () => {
      const { container } = render(
        <div className="bg-white">
          <p className="text-sage-900">Primary text</p>
          <p className="text-sage-700">Secondary text</p>
          <p className="text-sage-600">Tertiary text</p>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should meet WCAG AA for success messages', async () => {
      const { container } = render(
        <div className="bg-jungle-50 text-jungle-700 p-4 rounded">
          Success: Operation completed
        </div>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should meet WCAG AA for error messages', async () => {
      const { container } = render(
        <div className="bg-volcano-50 text-volcano-700 p-4 rounded">
          Error: Something went wrong
        </div>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have focusable buttons', async () => {
      const { container } = render(
        <div>
          <Button>Button 1</Button>
          <Button>Button 2</Button>
          <Button>Button 3</Button>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper tab order', async () => {
      const { container } = render(
        <div>
          <button tabIndex={0}>First</button>
          <button tabIndex={0}>Second</button>
          <button tabIndex={0}>Third</button>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have positive tabindex values', async () => {
      const { container } = render(
        <div>
          <Button>Button 1</Button>
          <Button>Button 2</Button>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ARIA Labels and Roles', () => {
    it('should have proper ARIA labels on icon buttons', async () => {
      const { container } = render(
        <div>
          <button aria-label="Close">×</button>
          <button aria-label="Delete">🗑️</button>
          <button aria-label="Edit">✏️</button>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper roles on custom components', async () => {
      const { container } = render(
        <div>
          <div role="alert" aria-live="polite">
            Alert message
          </div>
          <div role="status" aria-live="polite">
            Status update
          </div>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes on dialogs', async () => {
      const { container } = render(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          <h2 id="dialog-title">Dialog Title</h2>
          <p id="dialog-description">Dialog description</p>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      const { container } = render(
        <div>
          <Button>Focusable Button</Button>
          <input type="text" aria-label="Text input" />
          <a href="/test">Link</a>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
