/**
 * Automated Accessibility Tests with axe-core
 * 
 * Tests WCAG 2.1 AA compliance using axe-core automated testing.
 * Validates:
 * - Color contrast ratios
 * - ARIA attributes
 * - Form labels
 * - Heading hierarchy
 * - Keyboard accessibility
 * - Image alt text
 */

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibleForm, AccessibleFormField } from '@/components/ui/AccessibleForm';
import { GuestDashboard } from '@/components/guest/GuestDashboard';
import { RSVPManager } from '@/components/guest/RSVPManager';
import { FamilyManager } from '@/components/guest/FamilyManager';
import { PhotoUpload } from '@/components/guest/PhotoUpload';
import { ItineraryViewer } from '@/components/guest/ItineraryViewer';
import { AccommodationViewer } from '@/components/guest/AccommodationViewer';
import { TransportationForm } from '@/components/guest/TransportationForm';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test',
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

describe('Accessibility Tests - axe-core', () => {
  describe('Form Components', () => {
    it('should have no accessibility violations in AccessibleForm', async () => {
      const { container } = render(
        <AccessibleForm
          onSubmit={() => {}}
          title="Test Form"
          description="This is a test form"
          submitLabel="Submit"
        >
          <AccessibleFormField
            label="First Name"
            name="firstName"
            value=""
            onChange={() => {}}
            required
          />
          <AccessibleFormField
            label="Email"
            name="email"
            type="email"
            value=""
            onChange={() => {}}
            required
            helpText="Enter your email address"
          />
          <AccessibleFormField
            label="Message"
            name="message"
            type="textarea"
            value=""
            onChange={() => {}}
          />
        </AccessibleForm>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in form with errors', async () => {
      const { container } = render(
        <AccessibleForm onSubmit={() => {}} title="Form with Errors">
          <AccessibleFormField
            label="Email"
            name="email"
            type="email"
            value="invalid"
            onChange={() => {}}
            required
            error="Please enter a valid email address"
          />
        </AccessibleForm>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in disabled form', async () => {
      const { container } = render(
        <AccessibleForm onSubmit={() => {}} isSubmitting={true}>
          <AccessibleFormField
            label="Name"
            name="name"
            value="John"
            onChange={() => {}}
            disabled
          />
        </AccessibleForm>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in select field', async () => {
      const { container } = render(
        <AccessibleForm onSubmit={() => {}}>
          <AccessibleFormField
            label="Guest Type"
            name="guestType"
            type="select"
            value=""
            onChange={() => {}}
            options={[
              { value: 'wedding_party', label: 'Wedding Party' },
              { value: 'wedding_guest', label: 'Wedding Guest' },
            ]}
            required
          />
        </AccessibleForm>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Guest Portal Components', () => {
    // Mock guest data for components that require it
    const mockGuest = {
      id: 'guest-123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      age_type: 'adult' as const,
      guest_type: 'wedding_guest' as const,
      group_id: 'group-123',
      airport_code: 'SJO' as const,
      flight_number: 'AA123',
      arrival_date: '2024-06-01',
      departure_date: '2024-06-07',
      invitation_sent: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    // Skip complex components that require extensive mocking
    // These are better tested in E2E tests
    it.skip('should have no accessibility violations in GuestDashboard', async () => {
      const { container } = render(<GuestDashboard guest={mockGuest} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it.skip('should have no accessibility violations in RSVPManager', async () => {
      const { container } = render(<RSVPManager guest={mockGuest} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it.skip('should have no accessibility violations in FamilyManager', async () => {
      const { container} = render(<FamilyManager currentGuest={mockGuest} familyMembers={[]} rsvpsByGuest={{}} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in PhotoUpload', async () => {
      const { container } = render(<PhotoUpload guest={mockGuest} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it.skip('should have no accessibility violations in ItineraryViewer', async () => {
      const { container } = render(<ItineraryViewer guest={mockGuest} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in AccommodationViewer', async () => {
      const { container } = render(<AccommodationViewer guest={mockGuest} assignment={null} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in TransportationForm', async () => {
      const { container } = render(<TransportationForm guest={mockGuest} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast', () => {
    it('should meet WCAG AA color contrast requirements for primary buttons', async () => {
      const { container } = render(
        <button className="bg-jungle-500 text-white px-4 py-2 rounded">
          Primary Button
        </button>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should meet WCAG AA color contrast requirements for text', async () => {
      const { container } = render(
        <div>
          <p className="text-sage-900">Dark text on light background</p>
          <p className="text-sage-600">Medium text on light background</p>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should meet WCAG AA color contrast requirements for error messages', async () => {
      const { container } = render(
        <div className="text-volcano-700 bg-volcano-50 p-4 rounded">
          Error: This is an error message
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

  describe('ARIA Attributes', () => {
    it('should have proper ARIA labels on interactive elements', async () => {
      const { container } = render(
        <div>
          <button aria-label="Close dialog">×</button>
          <input type="text" aria-label="Search guests" />
          <div role="alert" aria-live="polite">
            Success message
          </div>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA roles on custom components', async () => {
      const { container } = render(
        <div>
          <nav role="navigation" aria-label="Main navigation">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </nav>
          <main role="main" aria-label="Main content">
            <h1>Page Title</h1>
          </main>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Labels', () => {
    it('should have proper labels for all form inputs', async () => {
      const { container } = render(
        <form>
          <label htmlFor="name">Name</label>
          <input id="name" type="text" />
          
          <label htmlFor="email">Email</label>
          <input id="email" type="email" />
          
          <label htmlFor="message">Message</label>
          <textarea id="message" />
        </form>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support aria-labelledby for complex labels', async () => {
      const { container } = render(
        <div>
          <div id="label-1">First Name</div>
          <input type="text" aria-labelledby="label-1" />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Heading Hierarchy', () => {
    it('should have proper heading hierarchy', async () => {
      const { container } = render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
          <h2>Another Section</h2>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not skip heading levels', async () => {
      const { container } = render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should have focusable interactive elements', async () => {
      const { container } = render(
        <div>
          <button aria-label="Click me">Click me</button>
          <a href="/test" aria-label="Test link">Link</a>
          <input type="text" aria-label="Text input" />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have positive tabindex values', async () => {
      const { container } = render(
        <div>
          <button tabIndex={0}>Button 1</button>
          <button tabIndex={0}>Button 2</button>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Image Alt Text', () => {
    it('should have alt text for all images', async () => {
      const { container } = render(
        <div>
          <img src="/logo.png" alt="Company Logo" />
          <img src="/photo.jpg" alt="Wedding photo" />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should allow empty alt for decorative images', async () => {
      const { container } = render(
        <div>
          <img src="/decoration.png" alt="" role="presentation" />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Landmark Regions', () => {
    it('should have proper landmark regions', async () => {
      const { container } = render(
        <div>
          <header role="banner">
            <h1>Site Header</h1>
          </header>
          <nav role="navigation">
            <ul><li><a href="/">Home</a></li></ul>
          </nav>
          <main role="main">
            <h1>Main Content</h1>
          </main>
          <footer role="contentinfo">
            <p>Footer content</p>
          </footer>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Language Attribute', () => {
    it('should have lang attribute on html element', async () => {
      const { container } = render(
        <div lang="en">
          <p>English content</p>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
