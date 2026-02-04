'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SystemSettings } from '@/schemas/settingsSchemas';

interface SettingsFormProps {
  initialSettings: SystemSettings | null;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [weddingDate, setWeddingDate] = useState(
    initialSettings?.wedding_date ? initialSettings.wedding_date.split('T')[0] : ''
  );
  const [venueName, setVenueName] = useState(initialSettings?.venue_name || '');
  const [coupleName1, setCoupleName1] = useState(initialSettings?.couple_name_1 || '');
  const [coupleName2, setCoupleName2] = useState(initialSettings?.couple_name_2 || '');
  const [timezone, setTimezone] = useState(initialSettings?.timezone || 'America/Costa_Rica');

  // Email notification preferences
  const [sendRsvpConfirmations, setSendRsvpConfirmations] = useState(
    initialSettings?.send_rsvp_confirmations ?? true
  );
  const [sendActivityReminders, setSendActivityReminders] = useState(
    initialSettings?.send_activity_reminders ?? true
  );
  const [sendDeadlineReminders, setSendDeadlineReminders] = useState(
    initialSettings?.send_deadline_reminders ?? true
  );
  const [reminderDaysBefore, setReminderDaysBefore] = useState(
    initialSettings?.reminder_days_before ?? 7
  );

  // Photo gallery settings
  const [requirePhotoModeration, setRequirePhotoModeration] = useState(
    initialSettings?.require_photo_moderation ?? true
  );
  const [maxPhotosPerGuest, setMaxPhotosPerGuest] = useState(
    initialSettings?.max_photos_per_guest ?? 20
  );

  // Guest authentication settings
  const [defaultAuthMethod, setDefaultAuthMethod] = useState<'email_matching' | 'magic_link'>(
    initialSettings?.default_auth_method || 'email_matching'
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setToast(null);

      try {
        const response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wedding_date: weddingDate ? new Date(weddingDate).toISOString() : null,
            venue_name: venueName || null,
            couple_name_1: coupleName1 || null,
            couple_name_2: coupleName2 || null,
            timezone,
            send_rsvp_confirmations: sendRsvpConfirmations,
            send_activity_reminders: sendActivityReminders,
            send_deadline_reminders: sendDeadlineReminders,
            reminder_days_before: reminderDaysBefore,
            require_photo_moderation: requirePhotoModeration,
            max_photos_per_guest: maxPhotosPerGuest,
            allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
            default_auth_method: defaultAuthMethod,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setToast({ type: 'success', message: 'Settings saved successfully' });
          router.refresh();
        } else {
          setToast({
            type: 'error',
            message: result.error?.message || 'Failed to save settings',
          });
        }
      } catch (error) {
        setToast({
          type: 'error',
          message: 'An unexpected error occurred',
        });
      } finally {
        setLoading(false);
      }
    },
    [
      weddingDate,
      venueName,
      coupleName1,
      coupleName2,
      timezone,
      sendRsvpConfirmations,
      sendActivityReminders,
      sendDeadlineReminders,
      reminderDaysBefore,
      requirePhotoModeration,
      maxPhotosPerGuest,
      defaultAuthMethod,
      router,
    ]
  );

  return (
    <div className="max-w-4xl">
      {/* Toast notification */}
      {toast && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            toast.type === 'success'
              ? 'bg-jungle-50 text-jungle-800 border border-jungle-200'
              : 'bg-volcano-50 text-volcano-800 border border-volcano-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Wedding Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-sage-900 mb-4">Wedding Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="weddingDate" className="block text-sm font-medium text-sage-700 mb-2">
                Wedding Date
              </label>
              <input
                type="date"
                id="weddingDate"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="venueName" className="block text-sm font-medium text-sage-700 mb-2">
                Venue Name
              </label>
              <input
                type="text"
                id="venueName"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Dreams Las Mareas"
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="coupleName1" className="block text-sm font-medium text-sage-700 mb-2">
                Couple Name 1
              </label>
              <input
                type="text"
                id="coupleName1"
                value={coupleName1}
                onChange={(e) => setCoupleName1(e.target.value)}
                placeholder="First person's name"
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="coupleName2" className="block text-sm font-medium text-sage-700 mb-2">
                Couple Name 2
              </label>
              <input
                type="text"
                id="coupleName2"
                value={coupleName2}
                onChange={(e) => setCoupleName2(e.target.value)}
                placeholder="Second person's name"
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="timezone" className="block text-sm font-medium text-sage-700 mb-2">
                Timezone
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-transparent"
              >
                <option value="America/Costa_Rica">America/Costa Rica (CST)</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Denver">America/Denver (MST)</option>
                <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Email Notification Preferences */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-sage-900 mb-4">Email Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendRsvpConfirmations"
                checked={sendRsvpConfirmations}
                onChange={(e) => setSendRsvpConfirmations(e.target.checked)}
                className="w-4 h-4 text-jungle-600 border-sage-300 rounded focus:ring-jungle-500"
              />
              <label htmlFor="sendRsvpConfirmations" className="ml-3 text-sm text-sage-700">
                Send RSVP confirmation emails
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendActivityReminders"
                checked={sendActivityReminders}
                onChange={(e) => setSendActivityReminders(e.target.checked)}
                className="w-4 h-4 text-jungle-600 border-sage-300 rounded focus:ring-jungle-500"
              />
              <label htmlFor="sendActivityReminders" className="ml-3 text-sm text-sage-700">
                Send activity reminder emails
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendDeadlineReminders"
                checked={sendDeadlineReminders}
                onChange={(e) => setSendDeadlineReminders(e.target.checked)}
                className="w-4 h-4 text-jungle-600 border-sage-300 rounded focus:ring-jungle-500"
              />
              <label htmlFor="sendDeadlineReminders" className="ml-3 text-sm text-sage-700">
                Send deadline reminder emails
              </label>
            </div>

            <div>
              <label
                htmlFor="reminderDaysBefore"
                className="block text-sm font-medium text-sage-700 mb-2"
              >
                Send reminders (days before deadline)
              </label>
              <input
                type="number"
                id="reminderDaysBefore"
                value={reminderDaysBefore}
                onChange={(e) => setReminderDaysBefore(parseInt(e.target.value, 10))}
                min="1"
                max="30"
                className="w-32 px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Photo Gallery Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-sage-900 mb-4">Photo Gallery Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requirePhotoModeration"
                checked={requirePhotoModeration}
                onChange={(e) => setRequirePhotoModeration(e.target.checked)}
                className="w-4 h-4 text-jungle-600 border-sage-300 rounded focus:ring-jungle-500"
              />
              <label htmlFor="requirePhotoModeration" className="ml-3 text-sm text-sage-700">
                Require photo moderation before publishing
              </label>
            </div>

            <div>
              <label
                htmlFor="maxPhotosPerGuest"
                className="block text-sm font-medium text-sage-700 mb-2"
              >
                Maximum photos per guest
              </label>
              <input
                type="number"
                id="maxPhotosPerGuest"
                value={maxPhotosPerGuest}
                onChange={(e) => setMaxPhotosPerGuest(parseInt(e.target.value, 10))}
                min="1"
                max="100"
                className="w-32 px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-transparent"
              />
            </div>

            <div>
              <p className="text-sm text-sage-600">
                Allowed photo formats: JPG, JPEG, PNG, HEIC
              </p>
            </div>
          </div>
        </div>

        {/* Guest Authentication Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-sage-900 mb-4">Guest Authentication</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="defaultAuthMethod" className="block text-sm font-medium text-sage-700 mb-2">
                Default Authentication Method
              </label>
              <select
                id="defaultAuthMethod"
                value={defaultAuthMethod}
                onChange={(e) => setDefaultAuthMethod(e.target.value as 'email_matching' | 'magic_link')}
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-transparent"
              >
                <option value="email_matching">Email Matching</option>
                <option value="magic_link">Magic Link (Passwordless)</option>
              </select>
              <p className="mt-2 text-sm text-sage-600">
                {defaultAuthMethod === 'email_matching' 
                  ? 'Guests log in by entering their email address. The system matches it to their guest record.'
                  : 'Guests request a one-time login link sent to their email address.'}
              </p>
            </div>

            <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-ocean-900 mb-2">Authentication Methods</h3>
              <ul className="text-sm text-ocean-800 space-y-2">
                <li>
                  <strong>Email Matching:</strong> Simple and fast. Guests enter their email and are logged in immediately if it matches their guest record.
                </li>
                <li>
                  <strong>Magic Link:</strong> More secure. Guests request a login link sent to their email. The link expires after 15 minutes and can only be used once.
                </li>
              </ul>
              <p className="mt-3 text-sm text-ocean-700">
                You can override the authentication method for individual guests in the Guest List.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-jungle-500 text-white rounded-lg hover:bg-jungle-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
