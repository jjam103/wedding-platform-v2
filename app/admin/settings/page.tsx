export const dynamic = 'force-dynamic';

import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import * as settingsService from '@/services/settingsService';
import SettingsManager from '@/components/admin/SettingsManager';

/**
 * Settings Page
 * 
 * Displays system configuration form including:
 * - Wedding date, venue name, couple names, timezone
 * - Email notification preferences
 * - Photo gallery settings
 * 
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5
 */
export default async function SettingsPage() {
  const supabase = await createAuthenticatedClient();

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Fetch current settings
  const settingsResult = await settingsService.getSettings();
  const settings = settingsResult.success ? settingsResult.data : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-sage-900">System Settings</h1>
        <p className="text-sage-600 mt-2">
          Configure system settings, notifications, and preferences
        </p>
      </div>

      <SettingsManager initialSettings={settings} />
    </div>
  );
}
