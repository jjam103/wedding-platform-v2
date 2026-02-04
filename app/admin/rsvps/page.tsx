'use client';

export const dynamic = 'force-dynamic';

import { RSVPManager } from '@/components/admin/RSVPManager';
import { ComponentErrorBoundary } from '@/components/ui/ErrorBoundary';

/**
 * RSVP Management Page
 * 
 * Provides comprehensive RSVP management interface for admins.
 * 
 * Features:
 * - View all RSVPs across events and activities
 * - Multi-level filtering (event, activity, status, guest)
 * - Search by guest name or email
 * - Bulk status updates
 * - CSV export
 * - Real-time statistics dashboard
 * - Inline RSVP editing
 * 
 * **Validates: Requirements 6.1, 6.6**
 */
export default function RSVPsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sage-900">RSVP Management</h1>
          <p className="text-sage-600 mt-1">
            View and manage all RSVPs across events and activities
          </p>
        </div>
      </div>

      {/* RSVP Manager Component with Error Boundary */}
      <ComponentErrorBoundary componentName="RSVP Manager">
        <RSVPManager />
      </ComponentErrorBoundary>
    </div>
  );
}
