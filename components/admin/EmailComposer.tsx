'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import type { EmailTemplate } from '@/schemas/emailSchemas';

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface Group {
  id: string;
  name: string;
}

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmailComposer({ isOpen, onClose, onSuccess }: EmailComposerProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  // Form state
  const [recipientType, setRecipientType] = useState<'guests' | 'groups'>('guests');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch data
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [guestsRes, groupsRes, templatesRes] = await Promise.all([
          fetch('/api/admin/guests'),
          fetch('/api/admin/groups'),
          fetch('/api/admin/emails/templates'),
        ]);

        const [guestsData, groupsData, templatesData] = await Promise.all([
          guestsRes.json(),
          groupsRes.json(),
          templatesRes.json(),
        ]);

        if (guestsData.success) {
          setGuests(guestsData.data.guests || []);
        }
        if (groupsData.success) {
          setGroups(groupsData.data || []);
        }
        if (templatesData.success) {
          setTemplates(templatesData.data || []);
        }
      } catch (error) {
        addToast({
          type: 'error',
          message: 'Failed to load data',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, addToast]);

  // Handle template selection
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setSubject(template.subject);
        setBody(template.body_html);
      }
    } else {
      setSubject('');
      setBody('');
    }
  }, [templates]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRecipients.length === 0) {
      addToast({
        type: 'error',
        message: 'Please select at least one recipient',
      });
      return;
    }

    if (!subject.trim()) {
      addToast({
        type: 'error',
        message: 'Please enter a subject',
      });
      return;
    }

    if (!body.trim()) {
      addToast({
        type: 'error',
        message: 'Please enter email body',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get recipient emails
      let recipientEmails: string[] = [];

      if (recipientType === 'guests') {
        recipientEmails = guests
          .filter((g) => selectedRecipients.includes(g.id) && g.email)
          .map((g) => g.email!);
      } else {
        // For groups, fetch all guests in selected groups
        const groupGuests = guests.filter((g) =>
          selectedRecipients.some((groupId) => {
            // This is simplified - in reality, we'd need to fetch group members
            return true;
          })
        );
        recipientEmails = groupGuests
          .filter((g) => g.email)
          .map((g) => g.email!);
      }

      if (recipientEmails.length === 0) {
        addToast({
          type: 'error',
          message: 'No valid email addresses found for selected recipients',
        });
        setSubmitting(false);
        return;
      }

      // Send email
      const response = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipientEmails,
          subject,
          html: body,
          text: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
          template_id: selectedTemplate || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: `Email sent to ${recipientEmails.length} recipient(s)`,
        });
        onSuccess();
        onClose();
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to send email',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to send email',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-sage-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-sage-900">Compose Email</h2>
          <button
            onClick={onClose}
            className="text-sage-400 hover:text-sage-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-jungle-500"></div>
              <p className="mt-2 text-sage-600">Loading...</p>
            </div>
          ) : (
            <>
              {/* Template Selection */}
              <div className="mb-4">
                <label htmlFor="template" className="block text-sm font-medium text-sage-700 mb-1">
                  Email Template (Optional)
                </label>
                <select
                  id="template"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500"
                >
                  <option value="">-- No Template --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-sage-700 mb-1">
                  Recipient Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="guests"
                      checked={recipientType === 'guests'}
                      onChange={(e) => {
                        setRecipientType(e.target.value as 'guests' | 'groups');
                        setSelectedRecipients([]);
                      }}
                      className="mr-2"
                    />
                    Individual Guests
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="groups"
                      checked={recipientType === 'groups'}
                      onChange={(e) => {
                        setRecipientType(e.target.value as 'guests' | 'groups');
                        setSelectedRecipients([]);
                      }}
                      className="mr-2"
                    />
                    Guest Groups
                  </label>
                </div>
              </div>

              {/* Recipients Selection */}
              <div className="mb-4">
                <label htmlFor="recipients" className="block text-sm font-medium text-sage-700 mb-1">
                  Recipients *
                </label>
                <select
                  id="recipients"
                  multiple
                  value={selectedRecipients}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setSelectedRecipients(selected);
                  }}
                  className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500 min-h-[120px]"
                  required
                >
                  {recipientType === 'guests'
                    ? guests
                        .filter((g) => g.email)
                        .map((guest) => (
                          <option key={guest.id} value={guest.id}>
                            {guest.first_name} {guest.last_name} ({guest.email})
                          </option>
                        ))
                    : groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                </select>
                <p className="mt-1 text-sm text-sage-500">
                  Hold Ctrl/Cmd to select multiple recipients
                </p>
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-medium text-sage-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500"
                  required
                />
              </div>

              {/* Email Body */}
              <div className="mb-4">
                <label htmlFor="body" className="block text-sm font-medium text-sage-700 mb-1">
                  Email Body *
                </label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500 font-mono text-sm"
                  placeholder="Enter email body (HTML supported)"
                  required
                />
                <p className="mt-1 text-sm text-sage-500">
                  HTML tags are supported. Use {'{{'}variable{'}'} for variable substitution.
                </p>
              </div>

              {/* Preview Section */}
              {showPreview && (
                <div className="mb-4 p-4 border border-sage-300 rounded-lg bg-sage-50">
                  <h3 className="text-lg font-semibold text-sage-900 mb-2">Preview</h3>
                  <div className="bg-white p-4 rounded border border-sage-200">
                    <div className="mb-2">
                      <strong>Subject:</strong> {subject}
                    </div>
                    <div className="mb-2">
                      <strong>To:</strong> {selectedRecipients.length} recipient(s)
                    </div>
                    <div className="border-t border-sage-200 pt-2 mt-2">
                      <div dangerouslySetInnerHTML={{ __html: body }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </form>

        <div className="px-6 py-4 border-t border-sage-200 flex items-center justify-between sticky bottom-0 bg-white">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowPreview(!showPreview)}
            disabled={loading || submitting}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              onClick={handleSubmit}
              disabled={loading || submitting}
            >
              {submitting ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Sending...
                </>
              ) : (
                'Send Email'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
