import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HomePageEditorPage from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock components
jest.mock('@/components/admin/RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange, disabled }: any) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
}));

jest.mock('@/components/admin/SectionEditor', () => ({
  SectionEditor: ({ pageType, pageId, onSave }: any) => (
    <div data-testid="section-editor">
      <p>Section Editor: {pageType}/{pageId}</p>
      <button onClick={onSave}>Close</button>
    </div>
  ),
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

describe('HomePageEditorPage', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Loading State', () => {
    it('should display loading skeleton while fetching config', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
      
      const { container } = render(<HomePageEditorPage />);
      
      await waitFor(() => {
        const skeleton = container.querySelector('.animate-pulse');
        expect(skeleton).toBeInTheDocument();
      });
    });
  });

  describe('Form Rendering', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            title: 'Test Wedding',
            subtitle: 'June 2025',
            welcomeMessage: '<p>Welcome!</p>',
            heroImageUrl: 'https://example.com/hero.jpg',
          },
        }),
      });
    });

    it('should render all form fields with loaded data', async () => {
      render(<HomePageEditorPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Wedding')).toBeInTheDocument();
      });
      
      expect(screen.getByDisplayValue('June 2025')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com/hero.jpg')).toBeInTheDocument();
      expect(screen.getByDisplayValue('<p>Welcome!</p>')).toBeInTheDocument();
    });

    it('should display hero image preview when URL is provided', async () => {
      render(<HomePageEditorPage />);
      
      await waitFor(() => {
        const img = screen.getByAltText('Hero preview');
        expect(img).toHaveAttribute('src', 'https://example.com/hero.jpg');
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            data: {
              title: 'Test Wedding',
              subtitle: 'June 2025',
              welcomeMessage: '<p>Welcome!</p>',
              heroImageUrl: 'https://example.com/hero.jpg',
            },
          }),
        });
    });

    it('should save changes when Save Changes button is clicked', async () => {
      render(<HomePageEditorPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Wedding')).toBeInTheDocument();
      });
      
      // Change title
      const titleInput = screen.getByDisplayValue('Test Wedding');
      fireEvent.change(titleInput, { target: { value: 'Updated Wedding' } });
      
      // Mock save response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            title: 'Updated Wedding',
            subtitle: 'June 2025',
            welcomeMessage: '<p>Welcome!</p>',
            heroImageUrl: 'https://example.com/hero.jpg',
          },
        }),
      });
      
      // Click save
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/home-page',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('Updated Wedding'),
          })
        );
      });
    });

    it('should disable save button when no changes are made', async () => {
      render(<HomePageEditorPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Wedding')).toBeInTheDocument();
      });
      
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when changes are made', async () => {
      render(<HomePageEditorPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Wedding')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByDisplayValue('Test Wedding');
      fireEvent.change(titleInput, { target: { value: 'Updated Wedding' } });
      
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).not.toBeDisabled();
    });

    it('should display error message when save fails', async () => {
      render(<HomePageEditorPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Wedding')).toBeInTheDocument();
      });
      
      // Change title
      const titleInput = screen.getByDisplayValue('Test Wedding');
      fireEvent.change(titleInput, { target: { value: 'Updated Wedding' } });
      
      // Mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to save' },
        }),
      });
      
      // Click save
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to save')).toBeInTheDocument();
      });
    });
  });

  describe('Rich Text Editing', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            title: 'Test Wedding',
            subtitle: 'June 2025',
            welcomeMessage: '<p>Welcome!</p>',
            heroImageUrl: 'https://example.com/hero.jpg',
          },
        }),
      });
    });

    it('should update welcome message when rich text editor changes', async () => {
      render(<HomePageEditorPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      });
      
      const editor = screen.getByTestId('rich-text-editor');
      fireEvent.change(editor, { target: { value: '<p>Updated message</p>' } });
      
      expect(editor).toHaveValue('<p>Updated message</p>');
    });
  });

  describe('Section Editor Integration', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            title: 'Test Wedding',
            subtitle: 'June 2025',
            welcomeMessage: '<p>Welcome!</p>',
            heroImageUrl: 'https://example.com/hero.jpg',
          },
        }),
      });
    });

    it('should open section editor when Manage Sections button is clicked', async () => {
      render(<HomePageEditorPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Manage Sections')).toBeInTheDocument();
      });
      
      const manageSectionsButton = screen.getByText('Manage Sections');
      fireEvent.click(manageSectionsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('section-editor')).toBeInTheDocument();
        expect(screen.getByText('Section Editor: home/home')).toBeInTheDocument();
      });
    });

    it('should close section editor and return to home page editor', async () => {
      render(<HomePageEditorPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Manage Sections')).toBeInTheDocument();
      });
      
      // Open section editor
      const manageSectionsButton = screen.getByText('Manage Sections');
      fireEvent.click(manageSectionsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('section-editor')).toBeInTheDocument();
      });
      
      // Close section editor
      const closeButton = screen.getByText('Back to Home Page Editor');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('section-editor')).not.toBeInTheDocument();
        expect(screen.getByText('Manage Sections')).toBeInTheDocument();
      });
    });
  });

  describe('Preview Functionality', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            title: 'Test Wedding',
            subtitle: 'June 2025',
            welcomeMessage: '<p>Welcome!</p>',
            heroImageUrl: 'https://example.com/hero.jpg',
          },
        }),
      });
      
      // Mock window.open
      global.open = jest.fn();
    });

    it('should open preview in new tab when Preview button is clicked', async () => {
      render(<HomePageEditorPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Preview')).toBeInTheDocument();
      });
      
      const previewButton = screen.getByText('Preview');
      fireEvent.click(previewButton);
      
      expect(global.open).toHaveBeenCalledWith('/', '_blank');
    });
  });

  describe('Auto-save Functionality', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            data: {
              title: 'Test Wedding',
              subtitle: 'June 2025',
              welcomeMessage: '<p>Welcome!</p>',
              heroImageUrl: 'https://example.com/hero.jpg',
            },
          }),
        });
    });

    it('should auto-save after 30 seconds of inactivity', async () => {
      render(<HomePageEditorPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Wedding')).toBeInTheDocument();
      });
      
      // Change title
      const titleInput = screen.getByDisplayValue('Test Wedding');
      fireEvent.change(titleInput, { target: { value: 'Updated Wedding' } });
      
      // Mock auto-save response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            title: 'Updated Wedding',
            subtitle: 'June 2025',
            welcomeMessage: '<p>Welcome!</p>',
            heroImageUrl: 'https://example.com/hero.jpg',
          },
        }),
      });
      
      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/home-page',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should display unsaved changes warning', async () => {
      render(<HomePageEditorPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Wedding')).toBeInTheDocument();
      });
      
      // Change title
      const titleInput = screen.getByDisplayValue('Test Wedding');
      fireEvent.change(titleInput, { target: { value: 'Updated Wedding' } });
      
      await waitFor(() => {
        expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument();
      });
    });
  });
});
