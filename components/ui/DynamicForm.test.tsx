import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { DynamicForm, type FormField } from './DynamicForm';

// Mock Button component
jest.mock('./Button', () => ({
  Button: ({ children, onClick, type, loading, disabled, ...props }: any) => (
    <button onClick={onClick} type={type} disabled={disabled || loading} {...props}>
      {loading ? 'Loading...' : children}
    </button>
  ),
}));

describe('DynamicForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Text Input Fields', () => {
    it('should render text input field', () => {
      const fields: FormField[] = [
        { name: 'firstName', label: 'First Name', type: 'text', required: true },
      ];
      const schema = z.object({ firstName: z.string().min(1) });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name')).toHaveAttribute('type', 'text');
    });

    it('should show required asterisk for required fields', () => {
      const fields: FormField[] = [
        { name: 'email', label: 'Email', type: 'email', required: true },
      ];
      const schema = z.object({ email: z.string().email() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const label = screen.getByText('Email').closest('label');
      expect(label).toHaveClass('after:content-[\'*\']');
    });

    it('should display placeholder text', () => {
      const fields: FormField[] = [
        { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter username' },
      ];
      const schema = z.object({ username: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    });

    it('should display help text', () => {
      const fields: FormField[] = [
        { name: 'password', label: 'Password', type: 'text', helpText: 'Must be at least 8 characters' },
      ];
      const schema = z.object({ password: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      const fields: FormField[] = [
        { name: 'readOnly', label: 'Read Only', type: 'text', disabled: true },
      ];
      const schema = z.object({ readOnly: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('Read Only')).toBeDisabled();
    });
  });

  describe('Number Input Fields', () => {
    it('should render number input field', () => {
      const fields: FormField[] = [
        { name: 'age', label: 'Age', type: 'number' },
      ];
      const schema = z.object({ age: z.number() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('Age')).toHaveAttribute('type', 'number');
    });

    it('should convert number input to number type', async () => {
      const fields: FormField[] = [
        { name: 'quantity', label: 'Quantity', type: 'number' },
      ];
      const schema = z.object({ quantity: z.number() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText('Quantity');
      await userEvent.type(input, '42');

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({ quantity: 42 });
      });
    });
  });

  describe('Select Fields', () => {
    it('should render select field with options', () => {
      const fields: FormField[] = [
        {
          name: 'country',
          label: 'Country',
          type: 'select',
          options: [
            { label: 'USA', value: 'us' },
            { label: 'Canada', value: 'ca' },
          ],
        },
      ];
      const schema = z.object({ country: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('Country')).toBeInTheDocument();
      expect(screen.getByText('USA')).toBeInTheDocument();
      expect(screen.getByText('Canada')).toBeInTheDocument();
    });

    it('should show default "Select" option', () => {
      const fields: FormField[] = [
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [{ label: 'Active', value: 'active' }],
        },
      ];
      const schema = z.object({ status: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Select Status')).toBeInTheDocument();
    });
  });

  describe('Textarea Fields', () => {
    it('should render textarea field', () => {
      const fields: FormField[] = [
        { name: 'description', label: 'Description', type: 'textarea' },
      ];
      const schema = z.object({ description: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText('Description');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should respect rows attribute', () => {
      const fields: FormField[] = [
        { name: 'notes', label: 'Notes', type: 'textarea', rows: 10 },
      ];
      const schema = z.object({ notes: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('Notes')).toHaveAttribute('rows', '10');
    });
  });

  describe('Date Fields', () => {
    it('should render date input field', () => {
      const fields: FormField[] = [
        { name: 'birthDate', label: 'Birth Date', type: 'date' },
      ];
      const schema = z.object({ birthDate: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('Birth Date')).toHaveAttribute('type', 'date');
    });

    it('should render datetime-local input field', () => {
      const fields: FormField[] = [
        { name: 'appointmentTime', label: 'Appointment', type: 'datetime-local' },
      ];
      const schema = z.object({ appointmentTime: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('Appointment')).toHaveAttribute('type', 'datetime-local');
    });
  });

  describe('Checkbox Fields', () => {
    it('should render checkbox field', () => {
      const fields: FormField[] = [
        { name: 'agree', label: 'I agree to terms', type: 'checkbox' },
      ];
      const schema = z.object({ agree: z.boolean() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const checkbox = screen.getByLabelText('I agree to terms');
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('should handle checkbox state changes', async () => {
      const fields: FormField[] = [
        { name: 'subscribe', label: 'Subscribe', type: 'checkbox' },
      ];
      const schema = z.object({ subscribe: z.boolean() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const checkbox = screen.getByLabelText('Subscribe') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await userEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should show validation error on blur', async () => {
      const fields: FormField[] = [
        { name: 'email', label: 'Email', type: 'email', required: true },
      ];
      const schema = z.object({ email: z.string().email('Invalid email address') });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText('Email');
      await userEvent.type(input, 'invalid-email');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
    });

    it('should clear validation error when field becomes valid', async () => {
      const fields: FormField[] = [
        { name: 'email', label: 'Email', type: 'email' },
      ];
      const schema = z.object({ email: z.string().email('Invalid email') });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText('Email');
      
      // Enter invalid email
      await userEvent.type(input, 'invalid');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
      });

      // Fix the email
      await userEvent.clear(input);
      await userEvent.type(input, 'valid@example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
      });
    });

    it('should validate all fields on submit', async () => {
      const fields: FormField[] = [
        { name: 'firstName', label: 'First Name', type: 'text', required: true },
        { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      ];
      const schema = z.object({
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
      });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Check that validation errors are shown
        const errors = screen.getAllByRole('alert');
        expect(errors).toHaveLength(2);
        // The form shows "Required" for empty required fields
        expect(screen.getAllByText('Required')).toHaveLength(2);
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should hide help text when error is shown', async () => {
      const fields: FormField[] = [
        { name: 'username', label: 'Username', type: 'text', helpText: 'Choose a unique username' },
      ];
      const schema = z.object({ username: z.string().min(3, 'Too short') });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Choose a unique username')).toBeInTheDocument();

      const input = screen.getByLabelText('Username');
      await userEvent.type(input, 'ab');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Too short')).toBeInTheDocument();
        expect(screen.queryByText('Choose a unique username')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with valid data', async () => {
      const fields: FormField[] = [
        { name: 'name', label: 'Name', type: 'text' },
      ];
      const schema = z.object({ name: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText('Name');
      await userEvent.type(input, 'John Doe');

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
      });
    });

    it('should not call onSubmit with invalid data', async () => {
      const fields: FormField[] = [
        { name: 'age', label: 'Age', type: 'number' },
      ];
      const schema = z.object({ age: z.number().min(18, 'Must be 18 or older') });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText('Age');
      await userEvent.type(input, '15');

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Must be 18 or older')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const fields: FormField[] = [
        { name: 'data', label: 'Data', type: 'text' },
      ];
      const schema = z.object({ data: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={slowSubmit} />);

      const input = screen.getByLabelText('Data');
      await userEvent.type(input, 'test');

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('should disable submit button during submission', async () => {
      const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const fields: FormField[] = [
        { name: 'data', label: 'Data', type: 'text' },
      ];
      const schema = z.object({ data: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={slowSubmit} />);

      const input = screen.getByLabelText('Data');
      await userEvent.type(input, 'test');

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should use custom submit label', () => {
      const fields: FormField[] = [
        { name: 'data', label: 'Data', type: 'text' },
      ];
      const schema = z.object({ data: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} submitLabel="Save Changes" />);

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('should show cancel button when onCancel provided', () => {
      const fields: FormField[] = [
        { name: 'data', label: 'Data', type: 'text' },
      ];
      const schema = z.object({ data: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should not show cancel button when onCancel not provided', () => {
      const fields: FormField[] = [
        { name: 'data', label: 'Data', type: 'text' },
      ];
      const schema = z.object({ data: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('should call onCancel when cancel button clicked', () => {
      const fields: FormField[] = [
        { name: 'data', label: 'Data', type: 'text' },
      ];
      const schema = z.object({ data: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should use custom cancel label', () => {
      const fields: FormField[] = [
        { name: 'data', label: 'Data', type: 'text' },
      ];
      const schema = z.object({ data: z.string() });

      render(
        <DynamicForm
          fields={fields}
          schema={schema}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          cancelLabel="Discard"
        />
      );

      expect(screen.getByText('Discard')).toBeInTheDocument();
    });
  });

  describe('Initial Data', () => {
    it('should populate fields with initial data', () => {
      const fields: FormField[] = [
        { name: 'firstName', label: 'First Name', type: 'text' },
        { name: 'lastName', label: 'Last Name', type: 'text' },
      ];
      const schema = z.object({ firstName: z.string(), lastName: z.string() });
      const initialData = { firstName: 'John', lastName: 'Doe' };

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} initialData={initialData} />);

      expect(screen.getByLabelText('First Name')).toHaveValue('John');
      expect(screen.getByLabelText('Last Name')).toHaveValue('Doe');
    });

    it('should populate checkbox with initial data', () => {
      const fields: FormField[] = [
        { name: 'enabled', label: 'Enabled', type: 'checkbox' },
      ];
      const schema = z.object({ enabled: z.boolean() });
      const initialData = { enabled: true };

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} initialData={initialData} />);

      expect(screen.getByLabelText('Enabled')).toBeChecked();
    });
  });

  describe('Accessibility', () => {
    it('should associate labels with inputs', () => {
      const fields: FormField[] = [
        { name: 'username', label: 'Username', type: 'text' },
      ];
      const schema = z.object({ username: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText('Username');
      expect(input).toHaveAttribute('id', 'username');
    });

    it('should set aria-invalid when field has error', async () => {
      const fields: FormField[] = [
        { name: 'email', label: 'Email', type: 'email' },
      ];
      const schema = z.object({ email: z.string().email('Invalid email') });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText('Email');
      await userEvent.type(input, 'invalid');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should associate error message with input using aria-describedby', async () => {
      const fields: FormField[] = [
        { name: 'password', label: 'Password', type: 'text' },
      ];
      const schema = z.object({ password: z.string().min(8, 'Too short') });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText('Password');
      await userEvent.type(input, 'short');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-describedby', 'password-error');
        expect(screen.getByRole('alert')).toHaveAttribute('id', 'password-error');
      });
    });

    it('should associate help text with input using aria-describedby', () => {
      const fields: FormField[] = [
        { name: 'username', label: 'Username', type: 'text', helpText: 'Choose wisely' },
      ];
      const schema = z.object({ username: z.string() });

      render(<DynamicForm fields={fields} schema={schema} onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText('Username');
      expect(input).toHaveAttribute('aria-describedby', 'username-help');
    });
  });
});
