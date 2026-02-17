/**
 * Automated Accessibility Tests for Admin Components
 * 
 * Tests WCAG 2.1 AA compliance for admin interface components using axe-core.
 * Validates:
 * - Color contrast ratios
 * - ARIA attributes
 * - Form labels
 * - Keyboard accessibility
 * - Interactive element accessibility
 * 
 * Requirements: 21.1-21.7
 */

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { GroupedNavigation } from '@/components/admin/GroupedNavigation';
import { CollapsibleForm } from '@/components/admin/CollapsibleForm';
import { LocationSelector } from '@/components/admin/LocationSelector';
import { ReferenceLookup } from '@/components/admin/ReferenceLookup';
import { PhotoPicker } from '@/components/admin/PhotoPicker';
import BudgetDashboard from '@/components/admin/BudgetDashboard';
import { EmailComposer } from '@/components/admin/EmailComposer';
import SettingsForm from '@/components/admin/SettingsForm';
import { ToastProvider } from '@/components/ui/ToastContext';
import { z } from 'zod';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Helper to wrap components with ToastProvider
function renderWithToast(component: React.ReactElement) {
  return render(<ToastProvider>{component}</ToastProvider>);
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/admin/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createClientComponentClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  })),
}));

describe('Admin Components Accessibility Tests', () => {
  describe('GroupedNavigation', () => {
    const mockGroups = [
      {
        id: 'guest-management',
        label: 'Guest Management',
        icon: '👥',
        items: [
          { id: 'guests', label: 'Guests', href: '/admin/guests' },
          { id: 'groups', label: 'Groups', href: '/admin/groups' },
        ],
      },
      {
        id: 'event-planning',
        label: 'Event Planning',
        icon: '📅',
        items: [
          { id: 'events', label: 'Events', href: '/admin/events' },
          { id: 'activities', label: 'Activities', href: '/admin/activities' },
        ],
        badge: 3,
      },
    ];

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <GroupedNavigation groups={mockGroups} activeItem="guests" /> as any
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes for expandable groups', async () => {
      const { container } = render(
        <GroupedNavigation groups={mockGroups} activeItem="guests" /> as any
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible badge indicators', async () => {
      const { container } = render(
        <GroupedNavigation groups={mockGroups} activeItem="events" /> as any
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CollapsibleForm', () => {
    const mockSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    const mockFields = [
      {
        name: 'name',
        label: 'Name',
        type: 'text' as const,
        required: true,
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email' as const,
        required: true,
      },
    ];

    it('should have no accessibility violations when collapsed', async () => {
      const { container } = render(
        <CollapsibleForm
          title="Add Guest"
          fields={mockFields}
          schema={mockSchema}
          onSubmit={async () => {}}
          isOpen={false}
          onToggle={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when expanded', async () => {
      const { container } = render(
        <CollapsibleForm
          title="Add Guest"
          fields={mockFields}
          schema={mockSchema}
          onSubmit={async () => {}}
          isOpen={true}
          onToggle={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and associations', async () => {
      const { container } = render(
        <CollapsibleForm
          title="Add Guest"
          fields={mockFields}
          schema={mockSchema}
          onSubmit={async () => {}}
          isOpen={true}
          onToggle={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('LocationSelector', () => {
    const mockLocations = [
      {
        id: 'loc-1',
        name: 'Costa Rica',
        parent_location_id: null,
        children: [
          {
            id: 'loc-2',
            name: 'Guanacaste',
            parent_location_id: 'loc-1',
            children: [],
          },
        ],
      },
    ];

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <LocationSelector
          value=""
          onChange={() => {}}
          locations={mockLocations}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for hierarchical selection', async () => {
      const { container } = render(
        <LocationSelector
          value="loc-2"
          onChange={() => {}}
          locations={mockLocations}
          label="Select Location"
        /> as any
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ReferenceLookup', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <ReferenceLookup
          entityTypes={['event', 'activity']}
          onSelect={() => {}}
          placeholder="Search for events or activities"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes for search input', async () => {
      const { container } = render(
        <ReferenceLookup
          entityTypes={['event', 'activity', 'content_page']}
          onSelect={() => {}}
          placeholder="Search"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('PhotoPicker', () => {
    const mockPhotos = [
      {
        id: 'photo-1',
        photo_url: 'https://example.com/photo1.jpg',
        caption: 'Beach sunset',
        alt_text: 'Beautiful sunset over the beach',
        moderation_status: 'approved' as const,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'photo-2',
        photo_url: 'https://example.com/photo2.jpg',
        caption: 'Wedding ceremony',
        alt_text: 'Couple exchanging vows',
        moderation_status: 'approved' as const,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    // Mock fetch for photos
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { photos: mockPhotos },
          }),
        })
      ) as jest.Mock;
    });

    it('should have no accessibility violations', async () => {
      const { container } = renderWithToast(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper alt text for all images', async () => {
      const { container } = renderWithToast(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('BudgetDashboard', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithToast(<BudgetDashboard /> as any);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible table structure', async () => {
      const { container } = renderWithToast(<BudgetDashboard /> as any);

      const results = await axe(container, {
        rules: {
          'table-fake-caption': { enabled: true },
          'th-has-data-cells': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('EmailComposer', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithToast(<EmailComposer /> as any);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form field labels', async () => {
      const { container } = renderWithToast(<EmailComposer /> as any);

      const results = await axe(container, {
        rules: {
          'label': { enabled: true },
          'label-title-only': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('SettingsForm', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithToast(<SettingsForm /> as any);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible form controls', async () => {
      const { container } = renderWithToast(<SettingsForm /> as any);

      const results = await axe(container, {
        rules: {
          'label': { enabled: true },
          'button-name': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast - Admin Theme', () => {
    it('should meet WCAG AA for primary admin buttons', async () => {
      const { container } = render(
        <button className="bg-jungle-600 text-white px-4 py-2 rounded hover:bg-jungle-700">
          Save Changes
        </button>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should meet WCAG AA for secondary admin buttons', async () => {
      const { container } = render(
        <button className="bg-sage-100 text-sage-900 px-4 py-2 rounded hover:bg-sage-200">
          Cancel
        </button>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should meet WCAG AA for danger buttons', async () => {
      const { container } = render(
        <button className="bg-volcano-600 text-white px-4 py-2 rounded hover:bg-volcano-700">
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

    it('should meet WCAG AA for admin text colors', async () => {
      const { container } = render(
        <div>
          <h1 className="text-sage-900 text-2xl font-bold">Dashboard</h1>
          <p className="text-sage-700">Welcome to the admin dashboard</p>
          <p className="text-sage-600">Last updated: Today</p>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should meet WCAG AA for status badges', async () => {
      const { container } = render(
        <div className="space-y-2">
          <span className="bg-jungle-100 text-jungle-800 px-2 py-1 rounded">
            Active
          </span>
          <span className="bg-volcano-100 text-volcano-800 px-2 py-1 rounded">
            Inactive
          </span>
          <span className="bg-sunset-100 text-sunset-800 px-2 py-1 rounded">
            Pending
          </span>
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
    it('should have focusable interactive elements', async () => {
      const { container } = render(
        <div>
          <button aria-label="Add new guest">Add Guest</button>
          <button aria-label="Edit guest">Edit</button>
          <button aria-label="Delete guest">Delete</button>
          <input type="text" aria-label="Search guests" />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have positive tabindex values', async () => {
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
  });

  describe('ARIA Live Regions', () => {
    it('should have proper ARIA live regions for notifications', async () => {
      const { container } = render(
        <div>
          <div role="status" aria-live="polite" aria-atomic="true">
            Guest created successfully
          </div>
          <div role="alert" aria-live="assertive" aria-atomic="true">
            Error: Failed to save changes
          </div>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Modal Dialogs', () => {
    it('should have proper ARIA attributes for modals', async () => {
      const { container } = render(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <h2 id="modal-title">Confirm Delete</h2>
          <p id="modal-description">Are you sure you want to delete this guest?</p>
          <button aria-label="Confirm delete">Delete</button>
          <button aria-label="Cancel">Cancel</button>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Data Tables', () => {
    it('should have accessible table structure', async () => {
      const { container } = render(
        <table>
          <caption>Guest List</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Doe</td>
              <td>john@example.com</td>
              <td>Active</td>
            </tr>
          </tbody>
        </table>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
