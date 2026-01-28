'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { sanitizeRichText } from '@/utils/sanitization';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface SlashCommand {
  label: string;
  command: string;
  action: () => void;
  description: string;
}

/**
 * RichTextEditor component with formatting toolbar and slash commands
 * 
 * Features:
 * - Formatting toolbar (bold, italic, underline, links, lists)
 * - Slash commands (/heading, /list, /table, /image, /link, /divider)
 * - Table support with inline editing
 * - Content sanitization for security
 * - Keyboard shortcuts
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing or use / for commands...',
  className = '',
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Execute formatting command
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  // Handle content change
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    
    const html = editorRef.current.innerHTML;
    const sanitized = sanitizeRichText(html);
    onChange(sanitized);

    // Check for slash command
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textBeforeCursor = range.startContainer.textContent?.slice(0, range.startOffset) || '';
      
      // Check if last character is /
      if (textBeforeCursor.endsWith('/')) {
        const rect = range.getBoundingClientRect();
        setSlashMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
        setSlashFilter('');
        setShowSlashMenu(true);
        setSelectedCommandIndex(0);
      } else if (showSlashMenu) {
        // Update filter if slash menu is open
        const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
          const filter = textBeforeCursor.slice(lastSlashIndex + 1);
          setSlashFilter(filter.toLowerCase());
        } else {
          setShowSlashMenu(false);
        }
      }
    }
  }, [onChange, showSlashMenu]);

  // Insert heading
  const insertHeading = useCallback((level: 1 | 2 | 3) => {
    execCommand('formatBlock', `h${level}`);
    setShowSlashMenu(false);
  }, [execCommand]);

  // Insert list
  const insertList = useCallback((ordered: boolean) => {
    execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
    setShowSlashMenu(false);
  }, [execCommand]);

  // Insert table
  const insertTable = useCallback(() => {
    const table = `
      <table style="border-collapse: collapse; width: 100%; margin: 1em 0;">
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 1</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 2</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 3</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 4</td>
          </tr>
        </tbody>
      </table>
    `;
    execCommand('insertHTML', table);
    setShowSlashMenu(false);
  }, [execCommand]);

  // Insert divider
  const insertDivider = useCallback(() => {
    execCommand('insertHTML', '<hr style="margin: 1em 0; border: none; border-top: 2px solid #ddd;" />');
    setShowSlashMenu(false);
  }, [execCommand]);

  // Show link dialog
  const showLinkInput = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkText(selection.toString());
    }
    setShowLinkDialog(true);
    setShowSlashMenu(false);
  }, []);

  // Insert link
  const insertLink = useCallback(() => {
    if (!linkUrl) return;
    
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    
    if (linkText) {
      execCommand('insertHTML', `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`);
    } else {
      execCommand('createLink', url);
    }
    
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  }, [linkUrl, linkText, execCommand]);

  // Insert image
  const insertImage = useCallback(() => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertHTML', `<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" />`);
    }
    setShowSlashMenu(false);
  }, [execCommand]);

  // Slash commands
  const slashCommands: SlashCommand[] = [
    {
      label: 'Heading 1',
      command: '/heading1',
      action: () => insertHeading(1),
      description: 'Large heading',
    },
    {
      label: 'Heading 2',
      command: '/heading2',
      action: () => insertHeading(2),
      description: 'Medium heading',
    },
    {
      label: 'Heading 3',
      command: '/heading3',
      action: () => insertHeading(3),
      description: 'Small heading',
    },
    {
      label: 'Bullet List',
      command: '/list',
      action: () => insertList(false),
      description: 'Create a bullet list',
    },
    {
      label: 'Numbered List',
      command: '/numbered',
      action: () => insertList(true),
      description: 'Create a numbered list',
    },
    {
      label: 'Table',
      command: '/table',
      action: insertTable,
      description: 'Insert a 2x2 table',
    },
    {
      label: 'Link',
      command: '/link',
      action: showLinkInput,
      description: 'Insert a link',
    },
    {
      label: 'Image',
      command: '/image',
      action: insertImage,
      description: 'Insert an image',
    },
    {
      label: 'Divider',
      command: '/divider',
      action: insertDivider,
      description: 'Insert a horizontal divider',
    },
  ];

  // Filter slash commands
  const filteredCommands = slashCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(slashFilter) ||
    cmd.command.toLowerCase().includes(slashFilter)
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Slash menu navigation
      if (showSlashMenu) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedCommandIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedCommandIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands[selectedCommandIndex]) {
            // Remove the slash command text
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const textNode = range.startContainer;
              if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
                const lastSlashIndex = textNode.textContent.lastIndexOf('/');
                if (lastSlashIndex !== -1) {
                  const newRange = document.createRange();
                  newRange.setStart(textNode, lastSlashIndex);
                  newRange.setEnd(textNode, range.startOffset);
                  newRange.deleteContents();
                }
              }
            }
            filteredCommands[selectedCommandIndex].action();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setShowSlashMenu(false);
        }
        return;
      }

      // Keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            execCommand('bold');
            break;
          case 'i':
            e.preventDefault();
            execCommand('italic');
            break;
          case 'u':
            e.preventDefault();
            execCommand('underline');
            break;
          case 'k':
            e.preventDefault();
            showLinkInput();
            break;
        }
      }
    },
    [showSlashMenu, filteredCommands, selectedCommandIndex, execCommand, showLinkInput]
  );

  // Close slash menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showSlashMenu && editorRef.current && !editorRef.current.contains(e.target as Node)) {
        setShowSlashMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSlashMenu]);

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border border-gray-300 rounded-t-md bg-gray-50">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          disabled={disabled}
          className="p-2 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          disabled={disabled}
          className="p-2 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          disabled={disabled}
          className="p-2 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Underline (Ctrl+U)"
          aria-label="Underline"
        >
          <u>U</u>
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => insertList(false)}
          disabled={disabled}
          className="p-2 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Bullet List"
          aria-label="Bullet list"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => insertList(true)}
          disabled={disabled}
          className="p-2 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Numbered List"
          aria-label="Numbered list"
        >
          1.
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={showLinkInput}
          disabled={disabled}
          className="p-2 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Insert Link (Ctrl+K)"
          aria-label="Insert link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={insertTable}
          disabled={disabled}
          className="p-2 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Insert Table"
          aria-label="Insert table"
        >
          ⊞
        </button>
        <button
          type="button"
          onClick={insertDivider}
          disabled={disabled}
          className="p-2 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Insert Divider"
          aria-label="Insert divider"
        >
          ―
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={`min-h-[200px] p-4 border border-t-0 border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 prose prose-sm max-w-none ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        } ${!value && 'empty-editor'}`}
        data-placeholder={placeholder}
        aria-label="Rich text editor"
        role="textbox"
        aria-multiline="true"
      />

      {/* Slash command menu */}
      {showSlashMenu && filteredCommands.length > 0 && (
        <div
          className="absolute z-50 w-64 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto"
          style={{
            top: slashMenuPosition.top,
            left: slashMenuPosition.left,
          }}
          role="menu"
          aria-label="Slash commands"
        >
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.command}
              type="button"
              onClick={() => {
                // Remove the slash command text
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const textNode = range.startContainer;
                  if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
                    const lastSlashIndex = textNode.textContent.lastIndexOf('/');
                    if (lastSlashIndex !== -1) {
                      const newRange = document.createRange();
                      newRange.setStart(textNode, lastSlashIndex);
                      newRange.setEnd(textNode, range.startOffset);
                      newRange.deleteContents();
                    }
                  }
                }
                cmd.action();
              }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                index === selectedCommandIndex ? 'bg-blue-50' : ''
              }`}
              role="menuitem"
            >
              <div className="font-medium text-sm text-gray-900">{cmd.label}</div>
              <div className="text-xs text-gray-500">{cmd.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Link dialog */}
      {showLinkDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowLinkDialog(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="link-text" className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text
                </label>
                <input
                  id="link-text"
                  type="text"
                  value={linkText}
                  onChange={e => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter link text"
                />
              </div>
              <div>
                <label htmlFor="link-url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  id="link-url"
                  type="url"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkDialog(false);
                    setLinkUrl('');
                    setLinkText('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={insertLink}
                  disabled={!linkUrl}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
