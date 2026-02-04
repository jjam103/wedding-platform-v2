'use client';

import { useState, useCallback } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface AuthMethodSettingsProps {
  currentMethod: 'email_matching' | 'magic_link';
  onUpdate: (method: 'email_matching' | 'magic_link', updateExisting: boolean) => Promise<void>;
}

/**
 * AuthMethodSettings Component
 * 
 * Allows admins to configure the default guest authentication method
 * and optionally update all existing guests to use the new method.
 */
export function AuthMethodSettings({ currentMethod, onUpdate }: AuthMethodSettingsProps) {
  const [selectedMethod, setSelectedMethod] = useState<'email_matching' | 'magic_link'>(currentMethod);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges = selectedMethod !== currentMethod;

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    setShowConfirmDialog(false);
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await onUpdate(selectedMethod, updateExisting);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update auth method');
    } finally {
      setSaving(false);
    }
  }, [selectedMethod, updateExisting, hasChanges, onUpdate]);

  const handleSaveClick = useCallback(() => {
    if (!hasChanges) return;
    setShowConfirmDialog(true);
  }, [hasChanges]);

  const handleCancel = useCallback(() => {
    setSelectedMethod(currentMethod);
    setUpdateExisting(false);
    setError(null);
    setSuccess(false);
  }, [currentMethod]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Guest Authentication Method
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose how guests will authenticate to access the guest portal.
        </p>
      </div>

      {/* Auth Method Selection */}
      <div className="space-y-4">
        <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="authMethod"
            value="email_matching"
            checked={selectedMethod === 'email_matching'}
            onChange={(e) => setSelectedMethod(e.target.value as 'email_matching')}
            className="mt-1 h-4 w-4 text-jungle-600 focus:ring-jungle-500"
            disabled={saving}
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Email Matching</div>
            <div className="text-sm text-gray-600 mt-1">
              Guests enter their email address and first/last name. The system matches these
              against the guest list to authenticate them. Simple and straightforward.
            </div>
          </div>
        </label>

        <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="authMethod"
            value="magic_link"
            checked={selectedMethod === 'magic_link'}
            onChange={(e) => setSelectedMethod(e.target.value as 'magic_link')}
            className="mt-1 h-4 w-4 text-jungle-600 focus:ring-jungle-500"
            disabled={saving}
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Magic Link</div>
            <div className="text-sm text-gray-600 mt-1">
              Guests enter their email address and receive a secure login link via email.
              More secure but requires guests to have email access during login.
            </div>
          </div>
        </label>
      </div>

      {/* Update Existing Guests Option */}
      {hasChanges && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="mt-1 h-4 w-4 text-jungle-600 focus:ring-jungle-500 rounded"
              disabled={saving}
            />
            <div className="flex-1">
              <div className="font-medium text-amber-900">
                Update all existing guests
              </div>
              <div className="text-sm text-amber-700 mt-1">
                Change the authentication method for all existing guests to match the new default.
                This will affect how all current guests log in to the portal.
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-red-600 mr-2">⚠️</span>
            <div className="flex-1">
              <div className="font-medium text-red-900">Error</div>
              <div className="text-sm text-red-700 mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <div className="flex-1">
              <div className="font-medium text-green-900">Success</div>
              <div className="text-sm text-green-700 mt-1">
                Authentication method updated successfully.
                {updateExisting && ' All existing guests have been updated.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={handleCancel}
          disabled={!hasChanges || saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jungle-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={!hasChanges || saving}
          className="px-4 py-2 text-sm font-medium text-white bg-jungle-600 border border-transparent rounded-md hover:bg-jungle-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jungle-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleSave}
        title="Confirm Authentication Method Change"
        message={
          updateExisting
            ? `Are you sure you want to change the default authentication method to ${
                selectedMethod === 'email_matching' ? 'Email Matching' : 'Magic Link'
              } and update all existing guests? This will affect how all guests log in to the portal.`
            : `Are you sure you want to change the default authentication method to ${
                selectedMethod === 'email_matching' ? 'Email Matching' : 'Magic Link'
              }? This will only affect new guests added after this change.`
        }
        confirmLabel="Yes, Update"
        cancelLabel="Cancel"
        variant="warning"
      />
    </div>
  );
}
