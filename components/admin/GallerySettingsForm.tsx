'use client';

import { useState, useEffect } from 'react';

interface GallerySettings {
  display_mode: 'gallery' | 'carousel' | 'loop';
  photos_per_row?: number;
  show_captions?: boolean;
  autoplay_interval?: number;
  transition_effect?: string;
}

interface GallerySettingsFormProps {
  pageType: 'event' | 'activity' | 'accommodation' | 'room_type' | 'custom' | 'memory';
  pageId: string;
  onSave?: () => void;
}

/**
 * Gallery Settings Form Component
 * 
 * Allows admins to configure photo gallery display settings:
 * - Display mode (gallery grid, carousel, auto-loop)
 * - Photos per row (for gallery mode)
 * - Show/hide captions
 * - Autoplay interval (for carousel/loop)
 * - Transition effects
 */
export function GallerySettingsForm({ pageType, pageId, onSave }: GallerySettingsFormProps) {
  const [settings, setSettings] = useState<GallerySettings>({
    display_mode: 'gallery',
    photos_per_row: 3,
    show_captions: true,
    autoplay_interval: 4000,
    transition_effect: 'fade',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load existing settings
  useEffect(() => {
    loadSettings();
  }, [pageType, pageId]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/gallery-settings?page_type=${pageType}&page_id=${pageId}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        setSettings({
          display_mode: result.data.display_mode || 'gallery',
          photos_per_row: result.data.photos_per_row || 3,
          show_captions: result.data.show_captions ?? true,
          autoplay_interval: result.data.autoplay_interval || 4000,
          transition_effect: result.data.transition_effect || 'fade',
        });
      }
    } catch (err) {
      setError('Failed to load gallery settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/gallery-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_type: pageType,
          page_id: pageId,
          ...settings,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onSave?.();
      } else {
        setError(result.error?.message || 'Failed to save settings');
      }
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-sage-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-sage-200 rounded w-1/4"></div>
          <div className="h-10 bg-sage-200 rounded"></div>
          <div className="h-10 bg-sage-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-sage-200 p-6">
      <h3 className="text-lg font-semibold text-sage-900 mb-4">Gallery Display Settings</h3>

      {error && (
        <div className="mb-4 p-3 bg-volcano-50 border border-volcano-200 rounded-lg text-volcano-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-jungle-50 border border-jungle-200 rounded-lg text-jungle-800 text-sm">
          ✓ Settings saved successfully
        </div>
      )}

      <div className="space-y-4">
        {/* Display Mode */}
        <div>
          <label className="block text-sm font-medium text-sage-700 mb-2">
            Display Mode
          </label>
          <select
            value={settings.display_mode}
            onChange={(e) =>
              setSettings({ ...settings, display_mode: e.target.value as any })
            }
            className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
          >
            <option value="gallery">Gallery Grid</option>
            <option value="carousel">Carousel (manual)</option>
            <option value="loop">Auto-Loop</option>
          </select>
          <p className="mt-1 text-xs text-sage-600">
            {settings.display_mode === 'gallery' && 'Photos displayed in a responsive grid'}
            {settings.display_mode === 'carousel' && 'Photos in a carousel with navigation arrows'}
            {settings.display_mode === 'loop' && 'Photos automatically cycle through'}
          </p>
        </div>

        {/* Photos Per Row (Gallery mode only) */}
        {settings.display_mode === 'gallery' && (
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">
              Photos Per Row
            </label>
            <select
              value={settings.photos_per_row}
              onChange={(e) =>
                setSettings({ ...settings, photos_per_row: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
            >
              <option value="2">2 photos</option>
              <option value="3">3 photos</option>
              <option value="4">4 photos</option>
              <option value="5">5 photos</option>
            </select>
          </div>
        )}

        {/* Autoplay Interval (Carousel/Loop modes) */}
        {(settings.display_mode === 'carousel' || settings.display_mode === 'loop') && (
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">
              Autoplay Interval (seconds)
            </label>
            <input
              type="number"
              min="2"
              max="10"
              step="0.5"
              value={(settings.autoplay_interval || 4000) / 1000}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  autoplay_interval: parseFloat(e.target.value) * 1000,
                })
              }
              className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
            />
            <p className="mt-1 text-xs text-sage-600">
              Time between photo transitions (2-10 seconds)
            </p>
          </div>
        )}

        {/* Transition Effect */}
        {settings.display_mode !== 'gallery' && (
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">
              Transition Effect
            </label>
            <select
              value={settings.transition_effect}
              onChange={(e) =>
                setSettings({ ...settings, transition_effect: e.target.value })
              }
              className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
            >
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
              <option value="zoom">Zoom</option>
            </select>
          </div>
        )}

        {/* Show Captions */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="show-captions"
            checked={settings.show_captions}
            onChange={(e) =>
              setSettings({ ...settings, show_captions: e.target.checked })
            }
            className="w-4 h-4 text-jungle-600 border-sage-300 rounded focus:ring-jungle-500"
          />
          <label htmlFor="show-captions" className="ml-2 text-sm text-sage-700">
            Show photo captions
          </label>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-sage-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-4 py-2 bg-jungle-600 hover:bg-jungle-700 disabled:bg-sage-400 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Gallery Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
