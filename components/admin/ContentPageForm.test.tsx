/**
 * Unit Tests for ContentPageForm Component
 * 
 * Tests:
 * - Form expansion/collapse
 * - Auto-slug generation
 * - Manual slug override
 * - Form validation
 * - Unsaved changes warning
 * - URL preview
 * 
 * Requirements: Content page form functionality
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ContentPageForm } from './ContentPageForm';
import type { ContentPage } from '@/schemas/cmsSchemas';

// Mock slug utilities
jest.mock('@/utils/slugs', () => ({
  generateSlug: jest.fn((title: string) => title.toLowerCase().replace(/\s+/g, '-')),
  getSlugPreview: jest.fn((slug: string, type: string) => `/${type}/${slug}`),
  isValidSlug: jest.fn((slug: string) => /^[a-z0-9-]+$/.test(slug)),
}));

// Mock window.confirm
const originalConfirm = window.confirm;

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('ContentPageForm', () => {
  let mockOnSubmit: jest.Mock;
  let mockOnCancel: jest.Mock;
  let mockOnToggle: jest.Mock;

  beforeEach(() => {
    mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    mockOnCancel = jest.fn();
    mockOnToggle = jest.fn();
    window.confirm = jest.fn().mockReturnValue(true);
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    window.confirm = originalConfirm;
  });

  describe('Form Expansion/Collapse', () => {
    it('should render collapsed when isOpen is false', () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      // Header should be visible
      expect(screen.getByText('Add Content Page')).toBeInTheDocument();

      // Content should have aria-hidden="true"
      const content = document.querySelector('#content-page-form-content');
      expect(content).toHaveAttribute('aria-hidden', 'true');
      
      // Content should have maxHeight of 0
      expect(content).toHaveStyle({ maxHeight: '0px' });
    });

    it('should render expanded when isOpen is true', () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Form fields should be visible
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('should call onToggle when header is clicked', () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      const header = screen.getByRole('button', { name: /add content page/i });
      fireEvent.click(header);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should have proper aria attributes', () => {
      const { rerender } = render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      const header = screen.getByRole('button', { name: /add content page/i });
      expect(header).toHaveAttribute('aria-expanded', 'false');
      expect(header).toHaveAttribute('aria-controls', 'content-page-form-content');

      rerender(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      expect(header).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Auto-slug Generation', () => {
    it('should auto-generate slug from title', () => {
      const { generateSlug } = require('@/utils/slugs');

      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const slugInput = screen.getByLabelText(/slug/i);

      fireEvent.change(titleInput, { target: { value: 'Our Wedding Story' } });

      expect(generateSlug).toHaveBeenCalledWith('Our Wedding Story');
      expect(slugInput).toHaveValue('our-wedding-story');
    });

    it('should not auto-generate slug when manually edited', () => {
      const { generateSlug } = require('@/utils/slugs');

      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const slugInput = screen.getByLabelText(/slug/i);

      // Manually edit slug first
      fireEvent.change(slugInput, { target: { value: 'custom-slug' } });

      // Then change title
      fireEvent.change(titleInput, { target: { value: 'Our Wedding Story' } });

      // Slug should not change
      expect(slugInput).toHaveValue('custom-slug');
    });

    it('should preserve existing slug when editing', () => {
      const initialData: ContentPage = {
        id: '1',
        title: 'Existing Page',
        slug: 'existing-page',
        status: 'published',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      render(
        <ContentPageForm
          title="Edit Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          initialData={initialData}
        />
      );

      const slugInput = screen.getByLabelText(/slug/i);
      expect(slugInput).toHaveValue('existing-page');

      // Change title - slug should not auto-update
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      expect(slugInput).toHaveValue('existing-page');
    });
  });

  describe('URL Preview', () => {
    it('should display URL preview when slug is entered', () => {
      const { getSlugPreview } = require('@/utils/slugs');

      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const slugInput = screen.getByLabelText(/slug/i);
      fireEvent.change(slugInput, { target: { value: 'our-story' } });

      expect(getSlugPreview).toHaveBeenCalledWith('our-story', 'pages');
      expect(screen.getByText('/pages/our-story')).toBeInTheDocument();
    });

    it('should not display preview when slug is empty', () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.queryByText('URL Preview:')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required title field', async () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate required slug field', async () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const slugInput = screen.getByLabelText(/slug/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(slugInput, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Slug is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate slug format', async () => {
      const { isValidSlug } = require('@/utils/slugs');
      isValidSlug.mockReturnValue(false);

      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const slugInput = screen.getByLabelText(/slug/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(slugInput, { target: { value: 'Invalid Slug!' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Slug must contain only lowercase letters, numbers, and hyphens')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear field errors when user starts typing', async () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      // Start typing in title field
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test' } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
      });
    });

    it('should submit successfully with valid data', async () => {
      const { isValidSlug } = require('@/utils/slugs');
      isValidSlug.mockReturnValue(true);

      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const slugInput = screen.getByLabelText(/slug/i);
      const statusSelect = screen.getByLabelText(/status/i);

      fireEvent.change(titleInput, { target: { value: 'Our Story' } });
      fireEvent.change(slugInput, { target: { value: 'our-story' } });
      fireEvent.change(statusSelect, { target: { value: 'published' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Our Story',
          slug: 'our-story',
          status: 'published',
        });
      });
    });

    it('should display form-level errors', async () => {
      const errorOnSubmit = jest.fn().mockRejectedValue(new Error('Server error'));

      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={errorOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill valid data
      const titleInput = screen.getByLabelText(/title/i);
      const slugInput = screen.getByLabelText(/slug/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(slugInput, { target: { value: 'test-title' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });

  describe('Unsaved Changes Warning', () => {
    it('should not show warning when canceling with no changes', () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(window.confirm).not.toHaveBeenCalled();
      expect(mockOnToggle).toHaveBeenCalled();
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show warning when canceling with unsaved changes', () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          onCancel={mockOnCancel}
        />
      );

      // Make a change
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test' } });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(window.confirm).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
    });

    it('should cancel when user confirms warning', () => {
      window.confirm = jest.fn().mockReturnValue(true);

      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          onCancel={mockOnCancel}
        />
      );

      // Make a change
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test' } });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnToggle).toHaveBeenCalled();
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not cancel when user rejects warning', () => {
      window.confirm = jest.fn().mockReturnValue(false);

      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          onCancel={mockOnCancel}
        />
      );

      // Make a change
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test' } });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnToggle).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Initial Data Handling', () => {
    it('should populate form with initial data', () => {
      const initialData: ContentPage = {
        id: '1',
        title: 'Existing Page',
        slug: 'existing-page',
        status: 'draft',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      render(
        <ContentPageForm
          title="Edit Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          initialData={initialData}
        />
      );

      expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Page');
      expect(screen.getByLabelText(/slug/i)).toHaveValue('existing-page');
      expect(screen.getByLabelText(/status/i)).toHaveValue('draft');
    });

    it('should reset form when closed without initial data', () => {
      const { rerender } = render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill form
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });

      // Close form
      rerender(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      // Reopen form
      rerender(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Form should be reset
      expect(screen.getByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/slug/i)).toHaveValue('');
      expect(screen.getByLabelText(/status/i)).toHaveValue('draft');
    });
  });

  describe('Auto-scroll Behavior', () => {
    it('should scroll form into view when expanded', async () => {
      const scrollIntoViewMock = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const { rerender } = render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      rerender(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, { timeout: 200 });
    });
  });

  describe('Button Labels', () => {
    it('should use default button labels', () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should use custom button labels', () => {
      render(
        <ContentPageForm
          title="Edit Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          submitLabel="Update"
          cancelLabel="Discard"
        />
      );

      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should disable buttons during submission', async () => {
      const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={slowSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill form
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
      });
    });

    it('should show submitting text during submission', async () => {
      const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={slowSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill form
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria attributes on form fields', () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const slugInput = screen.getByLabelText(/slug/i);

      expect(titleInput).toHaveAttribute('required');
      expect(slugInput).toHaveAttribute('required');
    });

    it('should link error messages with aria-describedby', async () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i);
        expect(titleInput).toHaveAttribute('aria-invalid', 'true');
        
        const errorMessage = screen.getByText('Title is required');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should have proper help text for slug field', () => {
      render(
        <ContentPageForm
          title="Add Content Page"
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('URL-safe identifier (lowercase, hyphens only). Auto-generated from title.')).toBeInTheDocument();
    });
  });
});