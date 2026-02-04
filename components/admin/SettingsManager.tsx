'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Save, X } from 'lucide-react';
import { AuthMethodSettings } from './AuthMethodSettings';

interface SettingRow {
  id: string;
  key: string;
  value: any;
  description: string | null;
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface SettingsManagerProps {
  initialSettings: SettingRow[];
}

export default function SettingsManager({ initialSettings }: SettingsManagerProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentAuthMethod, setCurrentAuthMethod] = useState<'email_matching' | 'magic_link'>('email_matching');
  const [loadingAuthMethod, setLoadingAuthMethod] = useState(true);

  // Fetch current auth method on mount
  useEffect(() => {
    const fetchAuthMethod = async () => {
      try {
        const response = await fetch('/api/admin/settings/auth-method');
        const result = await response.json();
        
        if (result.success) {
          setCurrentAuthMethod(result.data.defaultAuthMethod);
        }
      } catch (error) {
        console.error('Failed to fetch auth method:', error);
      } finally {
        setLoadingAuthMethod(false);
      }
    };

    fetchAuthMethod();
  }, []);

  // Group settings by category (exclude authentication category as it's handled separately)
  const settingsByCategory = settings
    .filter((s) => s.category !== 'authentication')
    .reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, SettingRow[]>);

  const startEdit = useCallback((setting: SettingRow) => {
    setEditingKey(setting.key);
    setEditValue(JSON.stringify(setting.value));
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingKey(null);
    setEditValue('');
  }, []);

  const saveSetting = useCallback(
    async (key: string) => {
      setLoading(true);
      setToast(null);

      try {
        let parsedValue;
        try {
          parsedValue = JSON.parse(editValue);
        } catch {
          // If not valid JSON, treat as string
          parsedValue = editValue;
        }

        const response = await fetch(`/api/admin/settings/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: parsedValue }),
        });

        const result = await response.json();

        if (result.success) {
          setToast({ type: 'success', message: 'Setting updated successfully' });
          setSettings((prev) =>
            prev.map((s) => (s.key === key ? { ...s, value: parsedValue } : s))
          );
          setEditingKey(null);
          setEditValue('');
          router.refresh();
        } else {
          setToast({
            type: 'error',
            message: result.error?.message || 'Failed to update setting',
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
    [editValue, router]
  );

  const formatValue = (value: any): string => {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  };

  const handleAuthMethodUpdate = useCallback(
    async (method: 'email_matching' | 'magic_link', updateExisting: boolean) => {
      setToast(null);

      try {
        const response = await fetch('/api/admin/settings/auth-method', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            defaultAuthMethod: method,
            updateExistingGuests: updateExisting,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setCurrentAuthMethod(method);
          setToast({
            type: 'success',
            message: updateExisting
              ? `Authentication method updated. ${result.data.updatedGuestsCount} guests updated.`
              : 'Authentication method updated successfully.',
          });
          router.refresh();
        } else {
          throw new Error(result.error?.message || 'Failed to update auth method');
        }
      } catch (error) {
        throw error; // Re-throw to be handled by AuthMethodSettings component
      }
    },
    [router]
  );

  return (
    <div className="max-w-6xl">
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

      {/* Authentication Settings Section */}
      <div className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-sage-50 px-6 py-4 border-b border-sage-200">
          <h2 className="text-xl font-semibold text-sage-900">Authentication</h2>
        </div>
        <div className="p-6">
          {loadingAuthMethod ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jungle-600"></div>
            </div>
          ) : (
            <AuthMethodSettings
              currentMethod={currentAuthMethod}
              onUpdate={handleAuthMethodUpdate}
            />
          )}
        </div>
      </div>

      {/* Settings by category */}
      <div className="space-y-6">
        {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
          <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-sage-50 px-6 py-4 border-b border-sage-200">
              <h2 className="text-xl font-semibold text-sage-900 capitalize">{category}</h2>
            </div>

            <div className="divide-y divide-sage-100">
              {categorySettings.map((setting) => (
                <div key={setting.key} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-sage-900">{setting.key}</h3>
                        {setting.is_public && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-ocean-100 text-ocean-800 rounded">
                            Public
                          </span>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-sm text-sage-600 mb-3">{setting.description}</p>
                      )}

                      {editingKey === setting.key ? (
                        <div className="space-y-3">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-transparent font-mono text-sm"
                            placeholder="Enter value (JSON format for objects/arrays)"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveSetting(setting.key)}
                              disabled={loading}
                              className="flex items-center gap-2 px-4 py-2 bg-jungle-500 text-white rounded-lg hover:bg-jungle-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={loading}
                              className="flex items-center gap-2 px-4 py-2 bg-sage-200 text-sage-700 rounded-lg hover:bg-sage-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <code className="px-3 py-2 bg-sage-50 border border-sage-200 rounded text-sm font-mono">
                            {formatValue(setting.value)}
                          </code>
                        </div>
                      )}
                    </div>

                    {editingKey !== setting.key && (
                      <button
                        onClick={() => startEdit(setting)}
                        className="flex items-center gap-2 px-3 py-2 text-sage-600 hover:text-jungle-600 hover:bg-jungle-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-sage-500">
                    Last updated: {new Date(setting.updated_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {settings.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-sage-600">No settings found. Default settings will be used.</p>
        </div>
      )}
    </div>
  );
}
