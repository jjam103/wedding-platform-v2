'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { DataTableWithSuspense as DataTable, type ColumnDef } from '@/components/ui/DataTableWithSuspense';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { EmailComposer } from '@/components/admin/EmailComposer';
import type { EmailLog } from '@/schemas/emailSchemas';

interface EmailsPageProps {}

export default function EmailsPage({}: EmailsPageProps) {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const { addToast } = useToast();

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/emails');
      const result = await response.json();

      if (result.success) {
        setEmails(result.data);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to load emails',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to load emails',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const columns: ColumnDef<EmailLog>[] = [
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
      filterable: false,
    },
    {
      key: 'recipient_email',
      label: 'Recipient',
      sortable: true,
      filterable: false,
    },
    {
      key: 'sent_at',
      label: 'Sent Date',
      sortable: true,
      filterable: false,
      render: (value) => {
        if (!value) return 'Not sent';
        return new Date(value as string).toLocaleString();
      },
    },
    {
      key: 'delivery_status',
      label: 'Delivery Status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Queued', value: 'queued' },
        { label: 'Sent', value: 'sent' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Failed', value: 'failed' },
        { label: 'Bounced', value: 'bounced' },
      ],
      render: (value) => {
        const status = value as string;
        const colors: Record<string, string> = {
          queued: 'bg-sage-200 text-sage-800',
          sent: 'bg-ocean-200 text-ocean-800',
          delivered: 'bg-jungle-200 text-jungle-800',
          failed: 'bg-volcano-200 text-volcano-800',
          bounced: 'bg-sunset-200 text-sunset-800',
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              colors[status] || 'bg-sage-200 text-sage-800'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sage-900">Email Management</h1>
          <p className="text-sage-600 mt-1">
            View sent emails and compose new messages
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowComposer(true)}
          data-action="add-new"
        >
          Compose Email
        </Button>
      </div>

      <DataTable
        data={emails}
        columns={columns}
        loading={loading}
        onSort={() => {}}
        onFilter={() => {}}
        onSearch={() => {}}
        onPageChange={() => {}}
        totalCount={emails.length}
        currentPage={1}
        pageSize={50}
      />

      {/* Email composer */}
      <EmailComposer
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        onSuccess={fetchEmails}
      />
    </div>
  );
}
