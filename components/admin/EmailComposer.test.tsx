import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailComposer } from './EmailComposer';
import { ToastProvider } from '@/components/ui/ToastContext';

// Mock fetch
global.fetch = jest.fn();

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

const mockGuests = [
  { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', group_id: 'group-1' },
  { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', group_id: 'group-1' },
  { id: '3', first_name: 'Bob', last_name: 'Johnson', email: null, group_id: 'group-2' },
];

const mockGroups = [
  { id: 'group-1', name: 'Family A', guest_count: 2 },
  { id: 'group-2', name: 'Family B', guest_count: 1 },
];

const mockTemplates = [
  {
    id: 'template-1',
    name: 'RSVP Confirmation',
    subject: 'RSVP Confirmed for {{event_name}}',
    body_html: '<p>Hi {{guest_name}}, your RSVP is confirmed!</p>',
    body_text: 'Hi {{guest_name}}, your RSVP is confirmed!',
    variables: ['guest_name', 'event_name'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

function renderEmailComposer(props = {}) {
  return render(
    <ToastProvider>
      <EmailComposer
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        {...props}
      />
    </ToastProvider>
  );
}

describe('EmailComposer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/admin/guests')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: { guests: mockGuests } }),
        });
      }
      if (url.includes('/api/admin/groups')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: mockGroups }),
        });
      }
      if (url.includes('/api/admin/emails/templates')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: mockTemplates }),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: false }),
      });
    });
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        expect(screen.getByText('Compose Email')).toBeInTheDocument();
      });
    });

    it('should not render when isOpen is false', () => {
      renderEmailComposer({ isOpen: false });
      
      expect(screen.queryByText('Compose Email')).not.toBeInTheDocument();
    });

    it('should display loading state while fetching data', () => {
      renderEmailComposer();
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display all recipient type options', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Individual Guests')).toBeInTheDocument();
        expect(screen.getByLabelText('Guest Groups')).toBeInTheDocument();
        expect(screen.getByLabelText('All Guests')).toBeInTheDocument();
        expect(screen.getByLabelText('Custom List')).toBeInTheDocument();
      });
    });
  });

  describe('Recipient Selection', () => {
    it('should display guest selection when "Individual Guests" is selected', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Select Guests *')).toBeInTheDocument();
      });
      
      const guestSelect = screen.getByLabelText('Select Guests *') as HTMLSelectElement;
      expect(guestSelect.options).toHaveLength(2); // Only guests with emails
    });

    it('should display group selection when "Guest Groups" is selected', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const groupsRadio = screen.getByLabelText('Guest Groups');
        fireEvent.click(groupsRadio);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Select Groups *')).toBeInTheDocument();
      });
    });

    it('should display all guests message when "All Guests" is selected', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const allRadio = screen.getByLabelText('All Guests');
        fireEvent.click(allRadio);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/All Guests:/)).toBeInTheDocument();
        expect(screen.getByText(/2 guests with email addresses/)).toBeInTheDocument();
      });
    });

    it('should display custom email input when "Custom List" is selected', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const customRadio = screen.getByLabelText('Custom List');
        fireEvent.click(customRadio);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Email Addresses *')).toBeInTheDocument();
      });
    });

    it('should clear selected recipients when changing recipient type', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const guestSelect = screen.getByLabelText('Select Guests *') as HTMLSelectElement;
        fireEvent.change(guestSelect, { target: { value: ['1'] } });
      });
      
      const groupsRadio = screen.getByLabelText('Guest Groups');
      fireEvent.click(groupsRadio);
      
      await waitFor(() => {
        const groupSelect = screen.getByLabelText('Select Groups *') as HTMLSelectElement;
        expect(groupSelect.selectedOptions).toHaveLength(0);
      });
    });
  });

  describe('Template Selection', () => {
    it('should populate subject and body when template is selected', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const templateSelect = screen.getByLabelText('Email Template (Optional)') as HTMLSelectElement;
        fireEvent.change(templateSelect, { target: { value: 'template-1' } });
      });
      
      await waitFor(() => {
        const subjectInput = screen.getByLabelText('Subject *') as HTMLInputElement;
        const bodyInput = screen.getByLabelText('Email Body *') as HTMLTextAreaElement;
        
        expect(subjectInput.value).toBe('RSVP Confirmed for {{event_name}}');
        expect(bodyInput.value).toBe('<p>Hi {{guest_name}}, your RSVP is confirmed!</p>');
      });
    });

    it('should clear subject and body when template is deselected', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const templateSelect = screen.getByLabelText('Email Template (Optional)') as HTMLSelectElement;
        fireEvent.change(templateSelect, { target: { value: 'template-1' } });
      });
      
      await waitFor(() => {
        const templateSelect = screen.getByLabelText('Email Template (Optional)') as HTMLSelectElement;
        fireEvent.change(templateSelect, { target: { value: '' } });
      });
      
      await waitFor(() => {
        const subjectInput = screen.getByLabelText('Subject *') as HTMLInputElement;
        const bodyInput = screen.getByLabelText('Email Body *') as HTMLTextAreaElement;
        
        expect(subjectInput.value).toBe('');
        expect(bodyInput.value).toBe('');
      });
    });
  });

  describe('Email Preview', () => {
    it('should show preview when "Show Preview" button is clicked', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const subjectInput = screen.getByLabelText('Subject *') as HTMLInputElement;
        fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
        
        const bodyInput = screen.getByLabelText('Email Body *') as HTMLTextAreaElement;
        fireEvent.change(bodyInput, { target: { value: '<p>Test Body</p>' } });
      });
      
      const previewButton = screen.getByText('Show Preview');
      fireEvent.click(previewButton);
      
      await waitFor(() => {
        expect(screen.getByText('Preview')).toBeInTheDocument();
        expect(screen.getByText('Test Subject')).toBeInTheDocument();
      });
    });

    it('should substitute variables in preview', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const subjectInput = screen.getByLabelText('Subject *') as HTMLInputElement;
        fireEvent.change(subjectInput, { target: { value: 'Hello {{guest_name}}' } });
        
        const bodyInput = screen.getByLabelText('Email Body *') as HTMLTextAreaElement;
        fireEvent.change(bodyInput, { target: { value: '<p>Event: {{event_name}}</p>' } });
      });
      
      const previewButton = screen.getByText('Show Preview');
      fireEvent.click(previewButton);
      
      await waitFor(() => {
        expect(screen.getByText('Hello John Doe')).toBeInTheDocument();
        expect(screen.getByText(/Event: Wedding Ceremony/)).toBeInTheDocument();
      });
    });

    it('should hide preview when "Hide Preview" button is clicked', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const previewButton = screen.getByText('Show Preview');
        fireEvent.click(previewButton);
      });
      
      await waitFor(() => {
        const hideButton = screen.getByText('Hide Preview');
        fireEvent.click(hideButton);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Preview')).not.toBeInTheDocument();
      });
    });
  });

  describe('Scheduling', () => {
    it('should show date and time inputs when scheduling is enabled', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const scheduleCheckbox = screen.getByLabelText('Schedule for later');
        fireEvent.click(scheduleCheckbox);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Date *')).toBeInTheDocument();
        expect(screen.getByLabelText('Time *')).toBeInTheDocument();
      });
    });

    it('should hide date and time inputs when scheduling is disabled', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const scheduleCheckbox = screen.getByLabelText('Schedule for later');
        fireEvent.click(scheduleCheckbox);
      });
      
      await waitFor(() => {
        fireEvent.click(scheduleCheckbox);
      });
      
      await waitFor(() => {
        expect(screen.queryByLabelText('Date *')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Time *')).not.toBeInTheDocument();
      });
    });

    it('should change button text when scheduling is enabled', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const scheduleCheckbox = screen.getByLabelText('Schedule for later');
        fireEvent.click(scheduleCheckbox);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Schedule Email')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error when no recipients are selected', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const subjectInput = screen.getByLabelText('Subject *') as HTMLInputElement;
        fireEvent.change(subjectInput, { target: { value: 'Test' } });
        
        const bodyInput = screen.getByLabelText('Email Body *') as HTMLTextAreaElement;
        fireEvent.change(bodyInput, { target: { value: 'Test body' } });
      });
      
      const sendButton = screen.getByText('Send Email');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please select at least one recipient')).toBeInTheDocument();
      });
    });

    it('should show error when subject is empty', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const allRadio = screen.getByLabelText('All Guests');
        fireEvent.click(allRadio);
        
        const bodyInput = screen.getByLabelText('Email Body *') as HTMLTextAreaElement;
        fireEvent.change(bodyInput, { target: { value: 'Test body' } });
      });
      
      const sendButton = screen.getByText('Send Email');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a subject')).toBeInTheDocument();
      });
    });

    it('should show error when body is empty', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const allRadio = screen.getByLabelText('All Guests');
        fireEvent.click(allRadio);
        
        const subjectInput = screen.getByLabelText('Subject *') as HTMLInputElement;
        fireEvent.change(subjectInput, { target: { value: 'Test' } });
      });
      
      const sendButton = screen.getByText('Send Email');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter email body')).toBeInTheDocument();
      });
    });

    it('should show error when scheduling without date/time', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const allRadio = screen.getByLabelText('All Guests');
        fireEvent.click(allRadio);
        
        const subjectInput = screen.getByLabelText('Subject *') as HTMLInputElement;
        fireEvent.change(subjectInput, { target: { value: 'Test' } });
        
        const bodyInput = screen.getByLabelText('Email Body *') as HTMLTextAreaElement;
        fireEvent.change(bodyInput, { target: { value: 'Test body' } });
        
        const scheduleCheckbox = screen.getByLabelText('Schedule for later');
        fireEvent.click(scheduleCheckbox);
      });
      
      const sendButton = screen.getByText('Schedule Email');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please select a date and time for scheduling')).toBeInTheDocument();
      });
    });
  });

  describe('Email Sending', () => {
    it('should send email successfully', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/admin/emails/send')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: mockGuests }),
        });
      });

      renderEmailComposer();
      
      await waitFor(() => {
        const allRadio = screen.getByLabelText('All Guests');
        fireEvent.click(allRadio);
        
        const subjectInput = screen.getByLabelText('Subject *') as HTMLInputElement;
        fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
        
        const bodyInput = screen.getByLabelText('Email Body *') as HTMLTextAreaElement;
        fireEvent.change(bodyInput, { target: { value: 'Test body' } });
      });
      
      const sendButton = screen.getByText('Send Email');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should schedule email successfully', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/admin/emails/schedule')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: mockGuests }),
        });
      });

      renderEmailComposer();
      
      await waitFor(() => {
        const allRadio = screen.getByLabelText('All Guests');
        fireEvent.click(allRadio);
        
        const subjectInput = screen.getByLabelText('Subject *') as HTMLInputElement;
        fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
        
        const bodyInput = screen.getByLabelText('Email Body *') as HTMLTextAreaElement;
        fireEvent.change(bodyInput, { target: { value: 'Test body' } });
        
        const scheduleCheckbox = screen.getByLabelText('Schedule for later');
        fireEvent.click(scheduleCheckbox);
        
        const dateInput = screen.getByLabelText('Date *') as HTMLInputElement;
        fireEvent.change(dateInput, { target: { value: '2024-12-31' } });
        
        const timeInput = screen.getByLabelText('Time *') as HTMLInputElement;
        fireEvent.change(timeInput, { target: { value: '10:00' } });
      });
      
      const sendButton = screen.getByText('Schedule Email');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle send error', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/admin/emails/send')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: false, error: { message: 'Send failed' } }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: mockGuests }),
        });
      });

      renderEmailComposer();
      
      await waitFor(() => {
        const allRadio = screen.getByLabelText('All Guests');
        fireEvent.click(allRadio);
        
        const subjectInput = screen.getByLabelText('Subject *') as HTMLInputElement;
        fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
        
        const bodyInput = screen.getByLabelText('Email Body *') as HTMLTextAreaElement;
        fireEvent.change(bodyInput, { target: { value: 'Test body' } });
      });
      
      const sendButton = screen.getByText('Send Email');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Send failed')).toBeInTheDocument();
      });
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when close button is clicked', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close');
        fireEvent.click(closeButton);
      });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when cancel button is clicked', async () => {
      renderEmailComposer();
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
      });
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
