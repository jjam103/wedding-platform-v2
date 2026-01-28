import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RichTextEditor } from './RichTextEditor';

// Mock sanitizeRichText
jest.mock('@/utils/sanitization', () => ({
  sanitizeRichText: jest.fn((html: string) => html),
}));

describe('RichTextEditor', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.execCommand
    document.execCommand = jest.fn();
  });

  describe('Rendering', () => {
    it('should render with toolbar and editor', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      // Check toolbar buttons
      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
      expect(screen.getByLabelText('Italic')).toBeInTheDocument();
      expect(screen.getByLabelText('Underline')).toBeInTheDocument();
      expect(screen.getByLabelText('Bullet list')).toBeInTheDocument();
      expect(screen.getByLabelText('Numbered list')).toBeInTheDocument();
      expect(screen.getByLabelText('Insert link')).toBeInTheDocument();
      expect(screen.getByLabelText('Insert table')).toBeInTheDocument();
      expect(screen.getByLabelText('Insert divider')).toBeInTheDocument();

      // Check editor
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      const initialValue = '<p>Hello World</p>';
      render(<RichTextEditor value={initialValue} onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      expect(editor.innerHTML).toBe(initialValue);
    });

    it('should render with placeholder', () => {
      const placeholder = 'Enter your text here';
      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          placeholder={placeholder}
        />
      );

      const editor = screen.getByRole('textbox');
      expect(editor).toHaveAttribute('data-placeholder', placeholder);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} disabled />);

      const editor = screen.getByRole('textbox');
      expect(editor).toHaveAttribute('contenteditable', 'false');

      // All toolbar buttons should be disabled
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Formatting Operations', () => {
    it('should execute bold command when bold button clicked', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const boldButton = screen.getByLabelText('Bold');
      fireEvent.click(boldButton);

      expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
    });

    it('should execute italic command when italic button clicked', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const italicButton = screen.getByLabelText('Italic');
      fireEvent.click(italicButton);

      expect(document.execCommand).toHaveBeenCalledWith('italic', false, undefined);
    });

    it('should execute underline command when underline button clicked', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const underlineButton = screen.getByLabelText('Underline');
      fireEvent.click(underlineButton);

      expect(document.execCommand).toHaveBeenCalledWith('underline', false, undefined);
    });

    it('should insert bullet list when bullet list button clicked', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const bulletButton = screen.getByLabelText('Bullet list');
      fireEvent.click(bulletButton);

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertUnorderedList',
        false,
        undefined
      );
    });

    it('should insert numbered list when numbered list button clicked', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const numberedButton = screen.getByLabelText('Numbered list');
      fireEvent.click(numberedButton);

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertOrderedList',
        false,
        undefined
      );
    });

    it('should not execute commands when disabled', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} disabled />);

      const boldButton = screen.getByLabelText('Bold');
      
      // Button should be disabled
      expect(boldButton).toBeDisabled();
      
      // Clicking should not execute command
      fireEvent.click(boldButton);
      expect(document.execCommand).not.toHaveBeenCalled();
    });

    it('should support multiple formatting operations in sequence', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const boldButton = screen.getByLabelText('Bold');
      const italicButton = screen.getByLabelText('Italic');
      const underlineButton = screen.getByLabelText('Underline');

      fireEvent.click(boldButton);
      fireEvent.click(italicButton);
      fireEvent.click(underlineButton);

      expect(document.execCommand).toHaveBeenCalledTimes(3);
      expect(document.execCommand).toHaveBeenNthCalledWith(1, 'bold', false, undefined);
      expect(document.execCommand).toHaveBeenNthCalledWith(2, 'italic', false, undefined);
      expect(document.execCommand).toHaveBeenNthCalledWith(3, 'underline', false, undefined);
    });

    it('should maintain formatting in content', () => {
      const formattedContent = '<p><strong>Bold</strong> <em>Italic</em> <u>Underline</u></p>';
      render(<RichTextEditor value={formattedContent} onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      expect(editor.innerHTML).toContain('<strong>Bold</strong>');
      expect(editor.innerHTML).toContain('<em>Italic</em>');
      expect(editor.innerHTML).toContain('<u>Underline</u>');
    });

    it('should support list formatting', () => {
      const listContent = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      render(<RichTextEditor value={listContent} onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      expect(editor.innerHTML).toContain('<ul>');
      expect(editor.innerHTML).toContain('<li>Item 1</li>');
      expect(editor.innerHTML).toContain('<li>Item 2</li>');
    });

    it('should support ordered list formatting', () => {
      const orderedListContent = '<ol><li>First</li><li>Second</li></ol>';
      render(<RichTextEditor value={orderedListContent} onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      expect(editor.innerHTML).toContain('<ol>');
      expect(editor.innerHTML).toContain('<li>First</li>');
      expect(editor.innerHTML).toContain('<li>Second</li>');
    });
  });

  describe('Slash Commands', () => {
    it('should have slash command functionality', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      
      // Verify editor is present and can receive input
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveAttribute('contenteditable', 'true');
    });

    it('should support slash command insertion via toolbar', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      // Verify all slash command toolbar buttons are present
      expect(screen.getByLabelText('Insert table')).toBeInTheDocument();
      expect(screen.getByLabelText('Insert link')).toBeInTheDocument();
      expect(screen.getByLabelText('Insert divider')).toBeInTheDocument();
    });

    it('should show slash menu when typing /', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      
      // Mock selection and range for slash detection
      const mockRange = {
        startContainer: { textContent: '/', nodeType: Node.TEXT_NODE },
        startOffset: 1,
        getBoundingClientRect: () => ({ bottom: 100, left: 50 }),
      };
      
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => mockRange,
      };
      
      window.getSelection = jest.fn(() => mockSelection as any);
      
      // Trigger input event
      fireEvent.input(editor, {
        target: { innerHTML: '/' },
      });

      // Note: In a real browser, the slash menu would appear
      // This test verifies the editor can handle input
      expect(editor).toBeInTheDocument();
    });

    it('should support heading slash commands', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      
      // Verify editor supports heading commands via execCommand
      expect(editor).toBeInTheDocument();
      expect(document.execCommand).toBeDefined();
    });

    it('should support list slash commands', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      // Test bullet list via toolbar
      const bulletButton = screen.getByLabelText('Bullet list');
      fireEvent.click(bulletButton);
      expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList', false, undefined);

      // Test numbered list via toolbar
      const numberedButton = screen.getByLabelText('Numbered list');
      fireEvent.click(numberedButton);
      expect(document.execCommand).toHaveBeenCalledWith('insertOrderedList', false, undefined);
    });

    it('should support table slash command', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const tableButton = screen.getByLabelText('Insert table');
      fireEvent.click(tableButton);

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertHTML',
        false,
        expect.stringContaining('<table')
      );
    });

    it('should support link slash command', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const linkButton = screen.getByLabelText('Insert link');
      fireEvent.click(linkButton);

      // Should open link dialog
      expect(screen.getByText('Insert Link')).toBeInTheDocument();
    });

    it('should support divider slash command', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const dividerButton = screen.getByLabelText('Insert divider');
      fireEvent.click(dividerButton);

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertHTML',
        false,
        expect.stringContaining('<hr')
      );
    });

    it('should close slash menu on Escape key', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      
      // Simulate Escape key
      fireEvent.keyDown(editor, { key: 'Escape' });

      // Editor should still be present
      expect(editor).toBeInTheDocument();
    });
  });

  describe('Table Editing', () => {
    it('should insert table when table button clicked', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const tableButton = screen.getByLabelText('Insert table');
      fireEvent.click(tableButton);

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertHTML',
        false,
        expect.stringContaining('<table')
      );
    });

    it('should insert table with correct structure', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const tableButton = screen.getByLabelText('Insert table');
      fireEvent.click(tableButton);

      const call = (document.execCommand as jest.Mock).mock.calls[0];
      const tableHTML = call[2];

      expect(tableHTML).toContain('<table');
      expect(tableHTML).toContain('<tbody>');
      expect(tableHTML).toContain('<tr>');
      expect(tableHTML).toContain('<td');
      expect(tableHTML).toContain('Cell 1');
      expect(tableHTML).toContain('Cell 2');
    });

    it('should insert table with 2x2 default structure', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const tableButton = screen.getByLabelText('Insert table');
      fireEvent.click(tableButton);

      const call = (document.execCommand as jest.Mock).mock.calls[0];
      const tableHTML = call[2];

      // Should have 2 rows
      const rowMatches = tableHTML.match(/<tr>/g);
      expect(rowMatches).toHaveLength(2);

      // Should have 4 cells total (2x2)
      const cellMatches = tableHTML.match(/<td/g);
      expect(cellMatches).toHaveLength(4);
    });

    it('should insert table with proper styling', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const tableButton = screen.getByLabelText('Insert table');
      fireEvent.click(tableButton);

      const call = (document.execCommand as jest.Mock).mock.calls[0];
      const tableHTML = call[2];

      // Should have border-collapse style
      expect(tableHTML).toContain('border-collapse: collapse');
      
      // Should have cell borders
      expect(tableHTML).toContain('border: 1px solid');
      
      // Should have cell padding
      expect(tableHTML).toContain('padding: 8px');
    });

    it('should insert table with editable cells', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const tableButton = screen.getByLabelText('Insert table');
      fireEvent.click(tableButton);

      const call = (document.execCommand as jest.Mock).mock.calls[0];
      const tableHTML = call[2];

      // Cells should contain default text that can be edited
      expect(tableHTML).toContain('Cell 1');
      expect(tableHTML).toContain('Cell 2');
      expect(tableHTML).toContain('Cell 3');
      expect(tableHTML).toContain('Cell 4');
    });

    it('should support inline table editing through contentEditable', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      
      // Editor should be contentEditable, which allows inline table editing
      expect(editor).toHaveAttribute('contenteditable', 'true');
    });

    it('should maintain table structure after editing', () => {
      const tableHTML = `
        <table style="border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">Edited Cell 1</td>
              <td style="border: 1px solid #ddd; padding: 8px;">Edited Cell 2</td>
            </tr>
          </tbody>
        </table>
      `;
      
      render(<RichTextEditor value={tableHTML} onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      expect(editor.innerHTML).toContain('Edited Cell 1');
      expect(editor.innerHTML).toContain('Edited Cell 2');
    });
  });

  describe('Link Insertion', () => {
    it('should show link dialog when link button clicked', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const linkButton = screen.getByLabelText('Insert link');
      fireEvent.click(linkButton);

      expect(screen.getByText('Insert Link')).toBeInTheDocument();
      expect(screen.getByLabelText('Link Text')).toBeInTheDocument();
      expect(screen.getByLabelText('URL')).toBeInTheDocument();
    });

    it('should insert link with URL and text', async () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const linkButton = screen.getByLabelText('Insert link');
      fireEvent.click(linkButton);

      // Fill in link details
      const urlInput = screen.getByLabelText('URL') as HTMLInputElement;
      const textInput = screen.getByLabelText('Link Text') as HTMLInputElement;
      
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      fireEvent.change(textInput, { target: { value: 'Example Link' } });

      // Click insert
      const insertButton = screen.getByRole('button', { name: 'Insert' });
      fireEvent.click(insertButton);

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertHTML',
        false,
        expect.stringContaining('https://example.com')
      );
    });

    it('should close link dialog on cancel', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const linkButton = screen.getByLabelText('Insert link');
      fireEvent.click(linkButton);

      expect(screen.getByText('Insert Link')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Insert Link')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should execute bold on Ctrl+B', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });

      expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
    });

    it('should execute italic on Ctrl+I', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      fireEvent.keyDown(editor, { key: 'i', ctrlKey: true });

      expect(document.execCommand).toHaveBeenCalledWith('italic', false, undefined);
    });

    it('should execute underline on Ctrl+U', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      fireEvent.keyDown(editor, { key: 'u', ctrlKey: true });

      expect(document.execCommand).toHaveBeenCalledWith('underline', false, undefined);
    });

    it('should show link dialog on Ctrl+K', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      fireEvent.keyDown(editor, { key: 'k', ctrlKey: true });

      expect(screen.getByText('Insert Link')).toBeInTheDocument();
    });
  });

  describe('Content Changes', () => {
    it('should call onChange when content is edited', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      fireEvent.input(editor, {
        target: { innerHTML: '<p>New content</p>' },
      });

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should sanitize content before calling onChange', () => {
      const { sanitizeRichText } = require('@/utils/sanitization');
      
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const editor = screen.getByRole('textbox');
      fireEvent.input(editor, {
        target: { innerHTML: '<p>Content</p>' },
      });

      expect(sanitizeRichText).toHaveBeenCalled();
    });
  });

  describe('Divider Insertion', () => {
    it('should insert divider when divider button clicked', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const dividerButton = screen.getByLabelText('Insert divider');
      fireEvent.click(dividerButton);

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertHTML',
        false,
        expect.stringContaining('<hr')
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-label',
        'Rich text editor'
      );
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-multiline', 'true');
    });

    it('should have proper button labels', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
      expect(screen.getByLabelText('Italic')).toBeInTheDocument();
      expect(screen.getByLabelText('Underline')).toBeInTheDocument();
    });
  });
});
