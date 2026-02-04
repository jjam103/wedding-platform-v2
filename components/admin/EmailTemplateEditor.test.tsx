/**
 * Unit Tests: EmailTemplateEditor Component
 * 
 * Tests template creation, variable insertion, preview, and validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailTemplateEditor } from './EmailTemplateEditor';

// Mock RichTextEditor
jest.mock('./RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange, disabled, placeholder }: any) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
    />
  ),
}));

describe('EmailTemplateEditor', () => {
  const mockOnChange = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Template Creation', () => {
    it('should render all form fields', () => {
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      expect(screen.getByLabelText(/template name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject line/i)).toBeInTheDocument();
      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
    });

    it('should call onChange when template name changes', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/template name/i);
      await user.type(nameInput, 'Test Template');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.name).toBe('Test Template');
    });

    it('should call onChange when subject changes', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      const subjectInput = screen.getByLabelText(/subject line/i);
      await user.type(subjectInput, 'Test Subject');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.subject).toBe('Test Subject');
    });

    it('should call onChange when body changes', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      const bodyEditor = screen.getByTestId('rich-text-editor');
      await user.type(bodyEditor, 'Test Body');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.body_html).toBe('Test Body');
    });

    it('should call onChange when category changes', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      const categorySelect = screen.getByLabelText(/category/i);
      await user.selectOptions(categorySelect, 'invitation');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.category).toBe('invitation');
    });

    it('should sanitize template name input', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/template name/i);
      await user.type(nameInput, '<script>alert("xss")</script>');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.name).not.toContain('<script>');
    });
  });

  describe('Variable Insertion', () => {
    it('should show variable picker when "Insert Variable" clicked', async () => {
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      const insertButton = screen.getByRole('button', { name: /insert variable/i });
      fireEvent.click(insertButton);

      await waitFor(() => {
        expect(screen.getByText(/available variables/i)).toBeInTheDocument();
      });
    });

    it('should display all template variables', async () => {
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      const insertButton = screen.getByRole('button', { name: /insert variable/i });
      fireEvent.click(insertButton);

      await waitFor(() => {
        expect(screen.getByText('{{guest_name}}')).toBeInTheDocument();
        expect(screen.getByText('{{event_name}}')).toBeInTheDocument();
        expect(screen.getByText('{{activity_name}}')).toBeInTheDocument();
        expect(screen.getByText('{{rsvp_deadline}}')).toBeInTheDocument();
      });
    });

    it('should insert variable into subject when clicked', async () => {
      render(
        <EmailTemplateEditor
          value={{ name: '', subject: 'Hello ', body_html: '', category: 'other' }}
          onChange={mockOnChange}
        />
      );

      const insertButton = screen.getByRole('button', { name: /insert variable/i });
      fireEvent.click(insertButton);

      await waitFor(() => {
        const guestNameButton = screen.getByText('{{guest_name}}');
        fireEvent.click(guestNameButton);
      });

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.subject).toContain('{{guest_name}}');
    });

    it('should hide variable picker after variable selected', async () => {
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      const insertButton = screen.getByRole('button', { name: /insert variable/i });
      fireEvent.click(insertButton);

      await waitFor(() => {
        const guestNameButton = screen.getByText('{{guest_name}}');
        fireEvent.click(guestNameButton);
      });

      await waitFor(() => {
        expect(screen.queryByText(/available variables/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Template Preview', () => {
    it('should show preview when "Show Preview" clicked', async () => {
      render(
        <EmailTemplateEditor
          value={{
            name: 'Test',
            subject: 'Hello {{guest_name}}',
            body_html: '<p>Welcome {{guest_name}}</p>',
            category: 'other',
          }}
          onChange={mockOnChange}
        />
      );

      const previewButton = screen.getByRole('button', { name: /show preview/i });
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/preview with sample data/i)).toBeInTheDocument();
      });
    });

    it('should replace variables with sample data in preview', async () => {
      render(
        <EmailTemplateEditor
          value={{
            name: 'Test',
            subject: 'Hello {{guest_name}}',
            body_html: '<p>Event: {{event_name}}</p>',
            category: 'other',
          }}
          onChange={mockOnChange}
        />
      );

      const previewButton = screen.getByRole('button', { name: /show preview/i });
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/Hello John Doe/i)).toBeInTheDocument();
        expect(screen.getByText(/Event: Wedding Ceremony/i)).toBeInTheDocument();
      });
    });

    it('should hide editor when showing preview', async () => {
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      const previewButton = screen.getByRole('button', { name: /show preview/i });
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.queryByTestId('rich-text-editor')).not.toBeInTheDocument();
      });
    });

    it('should show editor when hiding preview', async () => {
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      const previewButton = screen.getByRole('button', { name: /show preview/i });
      fireEvent.click(previewButton);

      await waitFor(() => {
        const hideButton = screen.getByRole('button', { name: /hide preview/i });
        fireEvent.click(hideButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Template Validation', () => {
    it('should disable save button when name is empty', () => {
      render(
        <EmailTemplateEditor
          value={{ name: '', subject: 'Test', body_html: '<p>Test</p>', category: 'other' }}
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save template/i });
      expect(saveButton).toBeDisabled();
    });

    it('should disable save button when subject is empty', () => {
      render(
        <EmailTemplateEditor
          value={{ name: 'Test', subject: '', body_html: '<p>Test</p>', category: 'other' }}
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save template/i });
      expect(saveButton).toBeDisabled();
    });

    it('should disable save button when body is empty', () => {
      render(
        <EmailTemplateEditor
          value={{ name: 'Test', subject: 'Test', body_html: '', category: 'other' }}
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save template/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when all required fields filled', () => {
      render(
        <EmailTemplateEditor
          value={{
            name: 'Test',
            subject: 'Test Subject',
            body_html: '<p>Test Body</p>',
            category: 'other',
          }}
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save template/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Action Buttons', () => {
    it('should call onSave when save button clicked', () => {
      render(
        <EmailTemplateEditor
          value={{
            name: 'Test',
            subject: 'Test',
            body_html: '<p>Test</p>',
            category: 'other',
          }}
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save template/i });
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should call onCancel when cancel button clicked', () => {
      render(
        <EmailTemplateEditor onChange={mockOnChange} onCancel={mockOnCancel} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not render action buttons when callbacks not provided', () => {
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      expect(screen.queryByRole('button', { name: /save template/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable all inputs when disabled prop is true', () => {
      render(
        <EmailTemplateEditor
          value={{
            name: 'Test',
            subject: 'Test',
            body_html: '<p>Test</p>',
            category: 'other',
          }}
          onChange={mockOnChange}
          onSave={mockOnSave}
          disabled={true}
        />
      );

      expect(screen.getByLabelText(/template name/i)).toBeDisabled();
      expect(screen.getByLabelText(/category/i)).toBeDisabled();
      expect(screen.getByLabelText(/subject line/i)).toBeDisabled();
      expect(screen.getByTestId('rich-text-editor')).toBeDisabled();
      expect(screen.getByRole('button', { name: /save template/i })).toBeDisabled();
    });

    it('should disable variable insertion when disabled', () => {
      render(<EmailTemplateEditor onChange={mockOnChange} disabled={true} />);

      const insertButtons = screen.getAllByRole('button', { name: /insert variable/i });
      insertButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Category Selection', () => {
    it('should render all category options', () => {
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      const categorySelect = screen.getByLabelText(/category/i);
      const options = categorySelect.querySelectorAll('option');

      expect(options).toHaveLength(7); // 7 categories
      expect(options[0]).toHaveTextContent('Invitation');
      expect(options[1]).toHaveTextContent('RSVP');
      expect(options[2]).toHaveTextContent('Reminder');
      expect(options[3]).toHaveTextContent('Confirmation');
      expect(options[4]).toHaveTextContent('Update');
      expect(options[5]).toHaveTextContent('Announcement');
      expect(options[6]).toHaveTextContent('Other');
    });

    it('should default to "other" category', () => {
      render(<EmailTemplateEditor onChange={mockOnChange} />);

      const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
      expect(categorySelect.value).toBe('other');
    });
  });
});
