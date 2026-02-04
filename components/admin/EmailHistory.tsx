'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/ToastContext';
import type { EmailLog } from '@/schemas/emailSchemas';

interface EmailHistoryProps {
  onResend?: (emailId: string) => void;
}

export function EmailHistory({ onResend }: EmailHistoryProps) {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { addToast } = useToast();

  // Filter state
  const [recipientFilter, setRecipientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Fetch email history
  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (recipientFilter) params.append('recipient', recipientFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFromFilter) params.append('date_from', dateFromFilter);
      if (dateToFilter) params.append('date_to', dateToFilter);

      const response = await fetch(`/api/admin/emails/history?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setEmails(data.data || []);
      } else {
        addToast({
          type: 'error',
          message: 'Failed to load email history',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to load email history',
      });
    } finally {
      setLoading(false);
    }
  }, [recipientFilter, statusFilter, dateFromFilter, dateToFilter, addToast]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Handle resend
  const handleResend = useCallback(async (email: EmailLog) => {
    if (onResend) {
      onResend(email.id);
      return;
    }

    // Default resend implementation
    try {
      const response = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [email.recipient_email],
          subject: email.subject,
          html: '', // Would need to fetch original email body
          template_id: email.template_id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: 'Email resent successfully',
        });
        fetchEmails();
      } else {
        addToast({
          type: 'error',
          message: 'Failed to resend email',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to resend email',
      });
    }
  }, [onResend, addToast, fetchEmails]);

  // Handle view details
  const handleViewDetails = useCallback((email: EmailLog) => {
    setSelectedEmail(email);
    setShowDetailsModal(true);
  }, []);

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'bounced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // DataTable columns
  const columns = [
    {
      key: 'recipient_email',
      label: 'Recipient',
      sortable: true,
    },
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
    },
    {
      key: 'sent_at',
      label: 'Sent At',
      sortable: true,
      render: (value: string) => value ? new Date(value).toLocaleString() : 'Not sent',
    },
    {
      key: 'delivery_status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, email: EmailLog) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(email)}
          >
            View
          </Button>
          {(email.delivery_status === 'failed' || email.delivery_status === 'bounced') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleResend(email)}
            >
              Resend
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-sage-200">
        <h3 className="text-lg font-semibold text-sage-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="recipientFilter" className="block text-sm font-medium text-sage-700 mb-1">
              Recipient
            </label>
            <input
              type="text"
              id="recipientFilter"
              value={recipientFilter}
              onChange={(e) => setRecipientFilter(e.target.value)}
              placeholder="Search by email"
              className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500"
            />
          </div>

          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-sage-700 mb-1">
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500"
            >
              <option value="">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>

          <div>
            <label htmlFor="dateFromFilter" className="block text-sm font-medium text-sage-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="dateFromFilter"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500"
            />
          </div>

          <div>
            <label htmlFor="dateToFilter" className="block text-sm font-medium text-sage-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              id="dateToFilter"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="primary" onClick={fetchEmails}>
            Apply Filters
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setRecipientFilter('');
              setStatusFilter('');
              setDateFromFilter('');
              setDateToFilter('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white rounded-lg shadow-sm border border-sage-200">
        <DataTable
          data={emails}
          columns={columns}
          loading={loading}
        />
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-sage-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-sage-900">Email Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-sage-400 hover:text-sage-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Recipient</label>
                <p className="text-sage-900">{selectedEmail.recipient_email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Subject</label>
                <p className="text-sage-900">{selectedEmail.subject}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Status</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEmail.delivery_status)}`}>
                  {selectedEmail.delivery_status}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Sent At</label>
                <p className="text-sage-900">
                  {selectedEmail.sent_at ? new Date(selectedEmail.sent_at).toLocaleString() : 'Not sent'}
                </p>
              </div>

              {selectedEmail.delivered_at && (
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-1">Delivered At</label>
                  <p className="text-sage-900">{new Date(selectedEmail.delivered_at).toLocaleString()}</p>
                </div>
              )}

              {selectedEmail.error_message && (
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-1">Error Message</label>
                  <p className="text-red-600">{selectedEmail.error_message}</p>
                </div>
              )}

              {selectedEmail.template_id && (
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-1">Template ID</label>
                  <p className="text-sage-900 font-mono text-sm">{selectedEmail.template_id}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-sage-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              {(selectedEmail.delivery_status === 'failed' || selectedEmail.delivery_status === 'bounced') && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleResend(selectedEmail);
                    setShowDetailsModal(false);
                  }}
                >
                  Resend Email
                </Button>
              )}
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
