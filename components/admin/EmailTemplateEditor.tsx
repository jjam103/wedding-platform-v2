'use client';

/**
 * EmailTemplateEditor Component
 * 
 * Rich text editor for email templates with variable picker and preview
 * Requirements: 17.1, 17.2, 17.3
 */

import React, { useState, useCallback } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { sanitizeInput } from '@/utils/sanitization';

interface EmailTemplateEditorProps {
  value?: {
    name: string;
    subject: string;
    body_html: string;
    category?: string;
  };
  onChange: (template: {
    name: string;
    subject: string;
    body_html: string;
    category?: string;
  }) => void;
  onSave?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

// Available template variables
const TEMPLATE_VARIABLES = [
  { key: '{{guest_name}}', description: 'Guest full name' },
  { key: '{{guest_first_name}}', description: 'Guest first name' },
  { key: '{{guest_last_name}}', description: 'Guest last name' },
  { key: '{{guest_email}}', description: 'Guest email address' },
  { key: '{{event_name}}', description: 'Event name' },
  { key: '{{event_date}}', description: 'Event date' },
  { key: '{{event_time}}', description: 'Event time' },
  { key: '{{event_location}}', description: 'Event location' },
  { key: '{{activity_name}}', description: 'Activity name' },
  { key: '{{activity_date}}', description: 'Activity date' },
  { key: '{{activity_time}}', description: 'Activity time' },
  { key: '{{activity_location}}', description: 'Activity location' },
  { key: '{{rsvp_deadline}}', description: 'RSVP deadline date' },
  { key: '{{wedding_date}}', description: 'Wedding date' },
  { key: '{{venue_name}}', description: 'Venue name' },
  { key: '{{venue_address}}', description: 'Venue address' },
  { key: '{{login_link}}', description: 'Guest portal login link' },
  { key: '{{magic_link}}', description: 'Magic link for authentication' },
];

// Template categories
const TEMPLATE_CATEGORIES = [
  { value: 'invitation', label: 'Invitation' },
  { value: 'rsvp', label: 'RSVP' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'confirmation', label: 'Confirmation' },
  { value: 'update', label: 'Update' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'other', label: 'Other' },
];

// Sample data for preview
const SAMPLE_DATA = {
  guest_name: 'John Doe',
  guest_first_name: 'John',
  guest_last_name: 'Doe',
  guest_email: 'john.doe@example.com',
  event_name: 'Wedding Ceremony',
  event_date: 'June 15, 2024',
  event_time: '4:00 PM',
  event_location: 'Sunset Beach, Costa Rica',
  activity_name: 'Welcome Dinner',
  activity_date: 'June 14, 2024',
  activity_time: '7:00 PM',
  activity_location: 'Beachside Restaurant',
  rsvp_deadline: 'May 1, 2024',
  wedding_date: 'June 15, 2024',
  venue_name: 'Paradise Resort',
  venue_address: '123 Beach Road, Costa Rica',
  login_link: 'https://example.com/auth/guest-login',
  magic_link: 'https://example.com/auth/magic-link/verify?token=abc123',
};

export function EmailTemplateEditor({
  value,
  onChange,
  onSave,
  onCancel,
  disabled = false,
}: EmailTemplateEditorProps) {
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [subjectCursorPosition, setSubjectCursorPosition] = useState<number | null>(null);

  const template = value || {
    name: '',
    subject: '',
    body_html: '',
    category: 'other',
  };

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...template,
        name: sanitizeInput(e.target.value),
      });
    },
    [template, onChange]
  );

  const handleSubjectChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSubjectCursorPosition(e.target.selectionStart);
      onChange({
        ...template,
        subject: e.target.value, // Don't sanitize subject - allow variables
      });
    },
    [template, onChange]
  );

  const handleBodyChange = useCallback(
    (html: string) => {
      onChange({
        ...template,
        body_html: html,
      });
    },
    [template, onChange]
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({
        ...template,
        category: e.target.value,
      });
    },
    [template, onChange]
  );

  const insertVariable = useCallback(
    (variable: string, target: 'subject' | 'body') => {
      if (target === 'subject') {
        const position = subjectCursorPosition ?? template.subject.length;
        const newSubject =
          template.subject.slice(0, position) +
          variable +
          template.subject.slice(position);
        onChange({
          ...template,
          subject: newSubject,
        });
      } else {
        // For body, append variable at end (RichTextEditor handles cursor position)
        onChange({
          ...template,
          body_html: template.body_html + variable,
        });
      }
      setShowVariablePicker(false);
    },
    [template, onChange, subjectCursorPosition]
  );

  const replaceVariables = useCallback((text: string): string => {
    let result = text;
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  }, []);

  const previewSubject = replaceVariables(template.subject);
  const previewBody = replaceVariables(template.body_html);

  return (
    <div className="space-y-6">
      {/* Template Name */}
      <div>
        <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-2">
          Template Name *
        </label>
        <input
          id="template-name"
          type="text"
          value={template.name}
          onChange={handleNameChange}
          disabled={disabled}
          placeholder="e.g., RSVP Confirmation"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="template-category" className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          id="template-category"
          value={template.category}
          onChange={handleCategoryChange}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {TEMPLATE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Subject Line */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="template-subject" className="block text-sm font-medium text-gray-700">
            Subject Line *
          </label>
          <button
            type="button"
            onClick={() => setShowVariablePicker(!showVariablePicker)}
            disabled={disabled}
            className="text-sm text-emerald-600 hover:text-emerald-700 disabled:text-gray-400"
          >
            Insert Variable
          </button>
        </div>
        <input
          id="template-subject"
          type="text"
          value={template.subject}
          onChange={handleSubjectChange}
          disabled={disabled}
          placeholder="e.g., Your RSVP for {{event_name}}"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          required
        />
      </div>

      {/* Variable Picker */}
      {showVariablePicker && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Available Variables</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {TEMPLATE_VARIABLES.map((variable) => (
              <button
                key={variable.key}
                type="button"
                onClick={() => insertVariable(variable.key, 'subject')}
                disabled={disabled}
                className="text-left px-3 py-2 bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-mono text-sm text-emerald-600">{variable.key}</div>
                <div className="text-xs text-gray-500">{variable.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Email Body */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Email Body *</label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        {!showPreview ? (
          <div>
            <RichTextEditor
              value={template.body_html}
              onChange={handleBodyChange}
              disabled={disabled}
              placeholder="Write your email content here. Use the variable picker to insert dynamic content."
            />
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowVariablePicker(!showVariablePicker)}
                disabled={disabled}
                className="text-sm text-emerald-600 hover:text-emerald-700 disabled:text-gray-400"
              >
                Insert Variable in Body
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-lg p-6 bg-white">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Subject:</div>
              <div className="font-medium">{previewSubject}</div>
            </div>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: previewBody }}
            />
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              Preview with sample data
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(onSave || onCancel) && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={disabled}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={disabled || !template.name || !template.subject || !template.body_html}
              className="px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Template
            </button>
          )}
        </div>
      )}
    </div>
  );
}
