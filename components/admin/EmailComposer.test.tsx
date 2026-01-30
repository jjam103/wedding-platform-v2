/**
 * Unit Tests for EmailComposer Component
 * 
 * Tests:
 * - Modal display and closing
 * - Data loading (guests, groups, templates)
 * - Form submission
 * - Template selection
 * - Recipient selection
 * - Email preview
 * - Error handling
 * 
 * Requirements: Email composer functionality
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { EmailComposer } from './EmailComposer';

// Mock toast context
const mockAddToast = jest.fn();
jest.mock('@/components/ui/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockGuests = [
  { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
  { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
  { id: '3', first_name: 'Bob', last_name: 'Wilson', email: null },
];

const mockGroups = [
  { id: '1', name: 'Family' },
  { id: '2', name: 'Friends' },
];

const mockTemplates = [
  { id: '1', name: 'RSVP Reminder', subject: 'Please RSVP', body_html: '<p>Please respond by...</p>' },
  { id: '2', name: 'Welcome Email', subject: 'Welcome!', body_html: '<p>Welcome to our wedding...</p>' },
];

describe('EmailComposer', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  let mockOnClose: jest.Mock;
  let mockOnSuccess: jest.Mock;

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnSuccess = jest.fn();
    mockAddToast.mockClear();
    mockFetch.mockClear();
    
    // Default successful responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { guests: mockGuests } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockGroups }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTemplates }),
      } as Response);
  });

  afterEach(() => {
    cleanup();
  });

  describe('Modal Display', () => {
    it('should not render when isOpen is false', () => {
      render(
        <EmailComposer
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByText('Compose Email')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Compose Email')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when cancel button is clicked', async () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Data Loading', () => {
    it('should show loading state initially', () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should fetch guests, groups, and templates on open', async () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/guests');
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/groups');
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/emails/templates');
      });
    });

    it('should not fetch data when modal is closed', () => {
      render(
        <EmailComposer
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should display loaded data', async () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Check templates are loaded
      expect(screen.getByText('RSVP Reminder')).toBeInTheDocument();
      expect(screen.getByText('Welcome Email')).toBeInTheDocument();

      // Check guests are loaded (only those with emails)
      expect(screen.getByText('John Doe (john@example.com)')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith (jane@example.com)')).toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument(); // No email

      // Check groups are loaded
      expect(screen.getByText('Family')).toBeInTheDocument();
      expect(screen.getByText('Friends')).toBeInTheDocument();
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          message: 'Failed to load data',
        });
      });
    });
  });

  describe('Template Selection', () => {
    it('should populate subject and body when template is selected', async () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const templateSelect = screen.getByLabelText(/email template/i);
      fireEvent.change(templateSelect, { target: { value: '1' } });

      const subjectInput = screen.getByLabelText(/subject/i);
      const bodyTextarea = screen.getByLabelText(/email body/i);

      expect(subjectInput).toHaveValue('Please RSVP');
      expect(bodyTextarea).toHaveValue('<p>Please respond by...</p>');
    });

    it('should clear subject and body when no template is selected', async () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const templateSelect = screen.getByLabelText(/email template/i);
      const subjectInput = screen.getByLabelText(/subject/i);
      const bodyTextarea = screen.getByLabelText(/email body/i);

      // Select template first
      fireEvent.change(templateSelect, { target: { value: '1' } });
      expect(subjectInput).toHaveValue('Please RSVP');

      // Clear template
      fireEvent.change(templateSelect, { target: { value: '' } });
      expect(subjectInput).toHaveValue('');
      expect(bodyTextarea).toHaveValue('');
    });
  });

  describe('Recipient Selection', () => {
    it('should switch between guest and group recipient types', async () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Initially guests should be selected
      const guestRadio = screen.getByLabelText('Individual Guests');
      const groupRadio = screen.getByLabelText('Guest Groups');

      expect(guestRadio).toBeChecked();
      expect(screen.getByText('John Doe (john@example.com)')).toBeInTheDocument();

      // Switch to groups
      fireEvent.click(groupRadio);

      expect(groupRadio).toBeChecked();
      expect(screen.getByText('Family')).toBeInTheDocument();
      expect(screen.queryByText('John Doe (john@example.com)')).not.toBeInTheDocument();
    });

    it('should clear selected recipients when switching types', async () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const recipientSelect = screen.getByLabelText(/recipients/i);
      const groupRadio = screen.getByLabelText('Guest Groups');

      // Select a guest
      fireEvent.change(recipientSelect, { target: { value: ['1'] } });

      // Switch to groups
      fireEvent.click(groupRadio);

      // Recipients should be cleared
      expect(recipientSelect.selectedOptions.length).toBe(0);
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should validate that recipients are selected', async () => {
      const sendButton = screen.getByRole('button', { name: /send email/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          message: 'Please select at least one recipient',
        });
      });
    });

    it('should validate that subject is entered', async () => {
      const recipientSelect = screen.getByLabelText(/recipients/i);
      fireEvent.change(recipientSelect, { target: { value: ['1'] } });

      const sendButton = screen.getByRole('button', { name: /send email/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          message: 'Please enter a subject',
        });
      });
    });

    it('should validate that body is entered', async () => {
      const recipientSelect = screen.getByLabelText(/recipients/i);
      const subjectInput = screen.getByLabelText(/subject/i);

      fireEvent.change(recipientSelect, { target: { value: ['1'] } });
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });

      const sendButton = screen.getByRole('button', { name: /send email/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          message: 'Please enter email body',
        });
      });
    });

    it('should validate that selected recipients have email addresses', async () => {
      // Mock guests with no email addresses
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { guests: [{ id: '1', first_name: 'John', last_name: 'Doe', email: null }] } }),
      } as Response);

      const { rerender } = render(
        <EmailComposer
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      rerender(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const recipientSelect = screen.getByLabelText(/recipients/i);
      const subjectInput = screen.getByLabelText(/subject/i);
      const bodyTextarea = screen.getByLabelText(/email body/i);

      fireEvent.change(recipientSelect, { target: { value: ['1'] } });
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(bodyTextarea, { target: { value: 'Test Body' } });

      const sendButton = screen.getByRole('button', { name: /send email/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          message: 'No valid email addresses found for selected recipients',
        });
      });
    });
  });

  describe('Email Sending', () => {
    beforeEach(async () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should send email successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const recipientSelect = screen.getByLabelText(/recipients/i);
      const subjectInput = screen.getByLabelText(/subject/i);
      const bodyTextarea = screen.getByLabelText(/email body/i);

      fireEvent.change(recipientSelect, { target: { value: ['1', '2'] } });
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(bodyTextarea, { target: { value: '<p>Test Body</p>' } });

      const sendButton = screen.getByRole('button', { name: /send email/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/emails/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: ['john@example.com', 'jane@example.com'],
            subject: 'Test Subject',
            html: '<p>Test Body</p>',
            text: 'Test Body',
            template_id: undefined,
          }),
        });
      });

      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'Email sent to 2 recipient(s)',
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should include template ID when template is selected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const templateSelect = screen.getByLabelText(/email template/i);
      const recipientSelect = screen.getByLabelText(/recipients/i);

      fireEvent.change(templateSelect, { target: { value: '1' } });
      fireEvent.change(recipientSelect, { target: { value: ['1'] } });

      const sendButton = screen.getByRole('button', { name: /send email/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/emails/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: ['john@example.com'],
            subject: 'Please RSVP',
            html: '<p>Please respond by...</p>',
            text: 'Please respond by...',
            template_id: '1',
          }),
        });
      });
    });

    it('should handle send errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: { message: 'Send failed' } }),
      } as Response);

      const recipientSelect = screen.getByLabelText(/recipients/i);
      const subjectInput = screen.getByLabelText(/subject/i);
      const bodyTextarea = screen.getByLabelText(/email body/i);

      fireEvent.change(recipientSelect, { target: { value: ['1'] } });
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(bodyTextarea, { target: { value: 'Test Body' } });

      const sendButton = screen.getByRole('button', { name: /send email/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          message: 'Send failed',
        });
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const recipientSelect = screen.getByLabelText(/recipients/i);
      const subjectInput = screen.getByLabelText(/subject/i);
      const bodyTextarea = screen.getByLabelText(/email body/i);

      fireEvent.change(recipientSelect, { target: { value: ['1'] } });
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(bodyTextarea, { target: { value: 'Test Body' } });

      const sendButton = screen.getByRole('button', { name: /send email/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          message: 'Failed to send email',
        });
      });
    });
  });

  describe('Email Preview', () => {
    beforeEach(async () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should show preview when preview button is clicked', () => {
      const previewButton = screen.getByRole('button', { name: /show preview/i });
      fireEvent.click(previewButton);

      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hide preview/i })).toBeInTheDocument();
    });

    it('should hide preview when hide button is clicked', () => {
      const previewButton = screen.getByRole('button', { name: /show preview/i });
      fireEvent.click(previewButton);

      const hideButton = screen.getByRole('button', { name: /hide preview/i });
      fireEvent.click(hideButton);

      expect(screen.queryByText('Preview')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show preview/i })).toBeInTheDocument();
    });

    it('should display preview content', async () => {
      const recipientSelect = screen.getByLabelText(/recipients/i);
      const subjectInput = screen.getByLabelText(/subject/i);
      const bodyTextarea = screen.getByLabelText(/email body/i);

      fireEvent.change(recipientSelect, { target: { value: ['1', '2'] } });
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(bodyTextarea, { target: { value: '<p>Test Body</p>' } });

      const previewButton = screen.getByRole('button', { name: /show preview/i });
      fireEvent.click(previewButton);

      expect(screen.getByText('Subject:')).toBeInTheDocument();
      expect(screen.getByText('Test Subject')).toBeInTheDocument();
      expect(screen.getByText('To:')).toBeInTheDocument();
      expect(screen.getByText('2 recipient(s)')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    beforeEach(async () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should disable buttons during submission', async () => {
      const slowSend = new Promise(resolve => setTimeout(resolve, 1000));
      mockFetch.mockReturnValueOnce(slowSend as any);

      const recipientSelect = screen.getByLabelText(/recipients/i);
      const subjectInput = screen.getByLabelText(/subject/i);
      const bodyTextarea = screen.getByLabelText(/email body/i);

      fireEvent.change(recipientSelect, { target: { value: ['1'] } });
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(bodyTextarea, { target: { value: 'Test Body' } });

      const sendButton = screen.getByRole('button', { name: /send email/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const previewButton = screen.getByRole('button', { name: /show preview/i });

      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(sendButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
        expect(previewButton).toBeDisabled();
      });
    });

    it('should show sending text during submission', async () => {
      const slowSend = new Promise(resolve => setTimeout(resolve, 1000));
      mockFetch.mockReturnValueOnce(slowSend as any);

      const recipientSelect = screen.getByLabelText(/recipients/i);
      const subjectInput = screen.getByLabelText(/subject/i);
      const bodyTextarea = screen.getByLabelText(/email body/i);

      fireEvent.change(recipientSelect, { target: { value: ['1'] } });
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(bodyTextarea, { target: { value: 'Test Body' } });

      const sendButton = screen.getByRole('button', { name: /send email/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(
        <EmailComposer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should have proper form labels', () => {
      expect(screen.getByLabelText(/email template/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recipients/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email body/i)).toBeInTheDocument();
    });

    it('should have required attributes on required fields', () => {
      expect(screen.getByLabelText(/recipients/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/subject/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/email body/i)).toHaveAttribute('required');
    });

    it('should have proper close button accessibility', () => {
      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should provide help text for recipients field', () => {
      expect(screen.getByText('Hold Ctrl/Cmd to select multiple recipients')).toBeInTheDocument();
    });

    it('should provide help text for email body', () => {
      expect(screen.getByText(/HTML tags are supported/)).toBeInTheDocument();
    });
  });
});