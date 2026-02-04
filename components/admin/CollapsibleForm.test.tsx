/**
 * Unit Tests for CollapsibleForm Component
 * 
 * Tests:
 * - Expand/collapse animation
 * - Form validation
 * - Unsaved changes warning
 * - Auto-scroll behavior
 * 
 * Requirements: 28.1-28.4
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { z } from 'zod';
import { CollapsibleForm } from './CollapsibleForm';

// Test schema
const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(1, 'Age is required'),
  description: z.string().optional(),
});

type TestFormData = z.infer<typeof testSchema>;

// Test fields
const testFields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true, placeholder: 'Enter name' },
  { name: 'email', label: 'Email', type: 'email' as const, required: true, placeholder: 'Enter email' },
  { name: 'age', label: 'Age', type: 'number' as const, required: true },
  { name: 'description', label: 'Description', type: 'textarea' as const, rows: 4 },
];

// Mock window.confirm
const originalConfirm = window.confirm;

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('CollapsibleForm', () => {
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

  // Helper to get inputs by field name (since labels have asterisk as separate element)
  const getInputByName = (name: string) => screen.getByRole('textbox', { name: new RegExp(name, 'i') }) || screen.getByLabelText(new RegExp(name, 'i'));

  describe('Expand/Collapse Animation', () => {
    it('should render collapsed when isOpen is false', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      // Header should be visible
      expect(screen.getByText('Add New Item')).toBeInTheDocument();

      // Content should have aria-hidden="true"
      const content = document.querySelector('#collapsible-form-content');
      expect(content).toHaveAttribute('aria-hidden', 'true');
      
      // Content should have maxHeight of 0
      expect(content).toHaveStyle({ maxHeight: '0px' });
    });

    it('should render expanded when isOpen is true', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Form fields should be visible
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('should call onToggle when header is clicked', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      const header = screen.getByRole('button', { name: /add new item/i });
      fireEvent.click(header);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should have proper aria-expanded attribute', () => {
      const { rerender } = render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      const header = screen.getByRole('button', { name: /add new item/i });
      expect(header).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      expect(header).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper aria-controls attribute', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      const header = screen.getByRole('button', { name: /add new item/i });
      expect(header).toHaveAttribute('aria-controls', 'collapsible-form-content');
    });

    it('should rotate arrow icon when expanded', () => {
      const { rerender } = render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      const header = screen.getByRole('button', { name: /add new item/i });
      const arrow = header.querySelector('[aria-hidden="true"]');
      
      expect(arrow?.className).not.toContain('rotate-180');

      rerender(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const arrowExpanded = header.querySelector('[aria-hidden="true"]');
      expect(arrowExpanded?.className).toContain('rotate-180');
    });

    it('should apply transition classes for smooth animation', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const content = screen.getByRole('button', { name: /add new item/i }).parentElement?.querySelector('#collapsible-form-content');
      
      expect(content?.className).toContain('transition-all');
      expect(content?.className).toContain('duration-300');
      expect(content?.className).toContain('ease-in-out');
    });
  });

  describe('Form Validation', () => {
    it('should display validation errors for invalid email format', async () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill all required fields but with invalid email (passes HTML5, fails Zod)
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      // Submit form directly to bypass HTML5 validation and test Zod validation
      const form = screen.getByRole('button', { name: /create/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      // Wait for Zod validation error
      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
      });

      // onSubmit should not be called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill with invalid email
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      const form = screen.getByRole('button', { name: /create/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear field error when user starts typing', async () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill with invalid email to trigger validation error
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);

      fireEvent.change(nameInput, { target: { value: 'John' } });
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      // Submit form to trigger validation
      const form = screen.getByRole('button', { name: /create/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
      });

      // Start typing in email field to fix it
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
      });
    });

    it('should submit successfully with valid data', async () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill all required fields
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          age: 25, // Number input converts to number
        });
      });
    });

    it('should display aria-invalid on fields with errors', async () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const form = screen.getByRole('button', { name: /create/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        const emailInput = screen.getByLabelText(/email/i);
        
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should link error messages with aria-describedby', async () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill with invalid email
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);

      fireEvent.change(nameInput, { target: { value: 'John' } });
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      // Submit form to trigger validation
      const form = screen.getByRole('button', { name: /create/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        const emailInputElement = screen.getByLabelText(/email/i);
        expect(emailInputElement).toHaveAttribute('aria-describedby', 'field-email-error');
        
        const errorMessage = screen.getByText('Invalid email');
        expect(errorMessage).toHaveAttribute('id', 'field-email-error');
      });
    });

    it('should display form-level errors', async () => {
      const errorOnSubmit = jest.fn().mockRejectedValue(new Error('Server error'));

      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={errorOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill valid data
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('should apply error styling to fields with validation errors', async () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const form = screen.getByRole('button', { name: /create/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        expect(nameInput.className).toContain('border-red-500'); // Component uses border-red-500
      });
    });
  });

  describe('Unsaved Changes Warning', () => {
    it('should not show warning when canceling with no changes', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // window.confirm should not be called
      expect(window.confirm).not.toHaveBeenCalled();
      expect(mockOnToggle).toHaveBeenCalled();
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show warning when canceling with unsaved changes', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          onCancel={mockOnCancel}
        />
      );

      // Make a change
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'John' } });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // window.confirm should be called
      expect(window.confirm).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
    });

    it('should cancel when user confirms unsaved changes warning', () => {
      window.confirm = jest.fn().mockReturnValue(true);

      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          onCancel={mockOnCancel}
        />
      );

      // Make a change
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'John' } });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnToggle).toHaveBeenCalled();
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not cancel when user rejects unsaved changes warning', () => {
      window.confirm = jest.fn().mockReturnValue(false);

      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          onCancel={mockOnCancel}
        />
      );

      // Make a change
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'John' } });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should not toggle or call onCancel
      expect(mockOnToggle).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should track dirty state when any field changes', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Change name field
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'John' } });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(window.confirm).toHaveBeenCalled();
    });

    it('should reset dirty state after successful submission', async () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill and submit
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // After successful submit, form should be clean
      // This is tested indirectly - the form collapses and clears
      expect(mockOnToggle).toHaveBeenCalled();
    });

    it('should clear form data after successful submission', async () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill form
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const ageInput = screen.getByLabelText(/age/i) as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      expect(nameInput.value).toBe('John Doe');

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Form should be cleared (values reset to empty)
      await waitFor(() => {
        expect(nameInput.value).toBe('');
        expect(emailInput.value).toBe('');
        expect(ageInput.value).toBe('');
      });
    });

    it('should reset form to initialData when canceling', () => {
      const initialData = { name: 'Initial Name', email: 'initial@example.com', age: '30' };

      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          initialData={initialData}
        />
      );

      // Change a field
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } });

      expect(nameInput.value).toBe('Changed Name');

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should reset to initial data
      expect(nameInput.value).toBe('Initial Name');
    });
  });

  describe('Auto-scroll Behavior', () => {
    it('should scroll form into view when expanded', async () => {
      const scrollIntoViewMock = jest.fn();
      
      // Mock scrollIntoView
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      // Initially collapsed, no scroll
      expect(scrollIntoViewMock).not.toHaveBeenCalled();

      // Re-render as expanded
      const { rerender } = render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Wait for scroll effect
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      }, { timeout: 200 });
    });

    it('should use smooth scroll behavior', async () => {
      const scrollIntoViewMock = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const { rerender } = render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      rerender(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
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

    it('should not scroll when already expanded', () => {
      const scrollIntoViewMock = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Clear any initial calls
      scrollIntoViewMock.mockClear();

      // Re-render with same isOpen state
      const { rerender } = render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Should not scroll again
      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });

    it('should delay scroll to allow animation', async () => {
      jest.useFakeTimers();
      const scrollIntoViewMock = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const { rerender } = render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      rerender(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Should not scroll immediately
      expect(scrollIntoViewMock).not.toHaveBeenCalled();

      // Fast-forward 100ms
      jest.advanceTimersByTime(100);

      // Now should have scrolled
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe('Field Rendering', () => {
    it('should render text input fields', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('placeholder', 'Enter name');
    });

    it('should render email input fields', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should render number input fields', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const ageInput = screen.getByLabelText(/age/i);
      expect(ageInput).toHaveAttribute('type', 'number');
    });

    it('should render textarea fields', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const descriptionInput = screen.getByLabelText('Description');
      expect(descriptionInput.tagName).toBe('TEXTAREA');
      expect(descriptionInput).toHaveAttribute('rows', '4');
    });

    it('should render select fields', () => {
      const fieldsWithSelect = [
        ...testFields,
        {
          name: 'category',
          label: 'Category',
          type: 'select' as const,
          options: [
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
          ],
        },
      ];

      const schemaWithSelect = testSchema.extend({
        category: z.string().optional(),
      });

      render(
        <CollapsibleForm
          title="Add New Item"
          fields={fieldsWithSelect}
          schema={schemaWithSelect}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const selectInput = screen.getByLabelText('Category');
      expect(selectInput.tagName).toBe('SELECT');
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });

    it('should mark required fields with asterisk', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      // Check that there are asterisks for required fields
      const asterisks = screen.getAllByText('*');
      expect(asterisks.length).toBeGreaterThan(0);
      
      // Verify asterisks have the correct styling (component uses text-red-500)
      asterisks.forEach(asterisk => {
        expect(asterisk.className).toContain('text-red-500');
      });
    });

    it('should populate fields with initialData', () => {
      const initialData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: '25',
        description: 'Test description',
      };

      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          initialData={initialData}
        />
      );

      expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe');
      expect(screen.getByLabelText(/email/i)).toHaveValue('john@example.com');
      expect(screen.getByLabelText(/age/i)).toHaveValue(25); // number input returns number
      expect(screen.getByLabelText('Description')).toHaveValue('Test description');
    });
  });

  describe('Submit and Cancel Buttons', () => {
    it('should render submit button with default label', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should render submit button with custom label', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          submitLabel="Save Changes"
        />
      );

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('should render cancel button with default label', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render cancel button with custom label', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          cancelLabel="Discard"
        />
      );

      expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
    });

    it('should disable buttons during submission', async () => {
      const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={slowSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill form
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      fireEvent.click(submitButton);

      // Buttons should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
      });
    });

    it('should show submitting text during submission', async () => {
      const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={slowSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill form
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
      });
    });

    it('should collapse form after successful submission', async () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill and submit
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper role on error messages', async () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill with invalid email
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);

      fireEvent.change(nameInput, { target: { value: 'John' } });
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      // Submit form to trigger validation
      const form = screen.getByRole('button', { name: /create/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        const errorMessage = screen.getByText('Invalid email');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should have proper aria-hidden on content when collapsed', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      );

      const content = document.querySelector('#collapsible-form-content');
      expect(content).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have proper aria-hidden on content when expanded', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const content = document.querySelector('#collapsible-form-content');
      expect(content).toHaveAttribute('aria-hidden', 'false');
    });

    it('should have unique IDs for form fields', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      expect(nameInput).toHaveAttribute('id', 'field-name');
      expect(emailInput).toHaveAttribute('id', 'field-email');
    });

    it('should associate labels with inputs', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      const nameLabel = screen.getByText('Name').closest('label');
      expect(nameLabel).toHaveAttribute('for', 'field-name');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty fields array', () => {
      render(
        <CollapsibleForm
          title="Add New Item"
          fields={[]}
          schema={z.object({})}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Should render without crashing
      expect(screen.getByText('Add New Item')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should handle submission error gracefully', async () => {
      const errorSubmit = jest.fn().mockRejectedValue(new Error('Network error'));

      render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={errorSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      );

      // Fill form
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Form should still be open
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('should not update form when initialData prop changes (preserves user input)', () => {
      const { rerender } = render(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          initialData={{ name: 'John', email: 'john@example.com', age: 25 }}
        />
      );

      expect(screen.getByLabelText(/name/i)).toHaveValue('John');

      // Update initialData - form should NOT update to preserve user input
      rerender(
        <CollapsibleForm
          title="Add New Item"
          fields={testFields}
          schema={testSchema}
          onSubmit={mockOnSubmit}
          isOpen={true}
          onToggle={mockOnToggle}
          initialData={{ name: 'Jane', email: 'jane@example.com', age: 30 }}
        />
      );

      // Form should still show original value (preserves user input)
      expect(screen.getByLabelText(/name/i)).toHaveValue('John');
    });
  });
});
