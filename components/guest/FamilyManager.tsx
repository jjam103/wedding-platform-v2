'use client';

import { useState } from 'react';
import type { Guest } from '@/types';

interface FamilyManagerProps {
  currentGuest: Guest;
  familyMembers: Guest[];
}

/**
 * Family Manager Component
 * 
 * Manages family group information with role-based access:
 * - Adults can view and edit all family members
 * - Children can only view and edit their own information
 * 
 * Requirements: 13.2, 13.3, 13.4
 */
export function FamilyManager({ currentGuest, familyMembers }: FamilyManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Guest>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdult = currentGuest.age_type === 'adult';
  const canEdit = (member: Guest) => {
    // Adults can edit all family members, children can only edit themselves
    return isAdult || member.id === currentGuest.id;
  };

  const startEditing = (member: Guest) => {
    if (!canEdit(member)) return;
    
    setEditingId(member.id);
    setEditForm({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone,
      dietary_restrictions: member.dietary_restrictions,
    });
    setError(null);
    setSuccess(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
    setError(null);
  };

  const saveChanges = async (memberId: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/guest/family/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || 'Failed to update family member');
        return;
      }

      setSuccess('Family member updated successfully!');
      setEditingId(null);
      setEditForm({});
      
      // Reload page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const getAgeTypeLabel = (ageType: string) => {
    switch (ageType) {
      case 'adult':
        return '👤 Adult';
      case 'child':
        return '👶 Child';
      case 'senior':
        return '👴 Senior';
      default:
        return ageType;
    }
  };

  const getGuestTypeLabel = (guestType: string) => {
    switch (guestType) {
      case 'wedding_party':
        return '💍 Wedding Party';
      case 'wedding_guest':
        return '🎉 Wedding Guest';
      case 'prewedding_only':
        return '🎊 Pre-Wedding Only';
      case 'postwedding_only':
        return '🎈 Post-Wedding Only';
      default:
        return guestType;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-ocean-50 to-sunset-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-sage-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-jungle-700">Family Information</h1>
              <p className="text-sage-600 mt-1">
                {isAdult
                  ? 'Manage your family group information'
                  : 'View your information'}
              </p>
            </div>
            <a
              href="/guest/dashboard"
              className="text-ocean-600 hover:text-ocean-700 font-medium"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Access Control Notice */}
        {!isAdult && (
          <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-4 mb-6">
            <p className="text-ocean-800">
              ℹ️ You can view and edit your own information. For changes to other family
              members, please ask an adult in your family.
            </p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-jungle-50 border border-jungle-200 rounded-lg p-4 mb-6">
            <p className="text-jungle-800">✓ {success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-volcano-50 border border-volcano-200 rounded-lg p-4 mb-6">
            <p className="text-volcano-800">✗ {error}</p>
          </div>
        )}

        {/* Family Members List */}
        <div className="space-y-4">
          {familyMembers.map((member) => {
            const isEditing = editingId === member.id;
            const canEditMember = canEdit(member);

            return (
              <div
                key={member.id}
                className="bg-white rounded-lg shadow-md border border-sage-200 overflow-hidden"
              >
                <div className="p-6">
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-jungle-700 mb-4">
                        Editing: {member.first_name} {member.last_name}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-sage-700 mb-1">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={editForm.first_name || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, first_name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-sage-700 mb-1">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={editForm.last_name || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, last_name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-sage-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={editForm.email || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, email: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-sage-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={editForm.phone || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, phone: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-sage-700 mb-1">
                            Dietary Restrictions
                          </label>
                          <textarea
                            value={editForm.dietary_restrictions || ''}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                dietary_restrictions: e.target.value,
                              })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                            placeholder="Any dietary restrictions or allergies..."
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 pt-4">
                        <button
                          onClick={() => saveChanges(member.id)}
                          disabled={saving}
                          className="bg-jungle-600 hover:bg-jungle-700 disabled:bg-sage-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={saving}
                          className="bg-sage-200 hover:bg-sage-300 disabled:bg-sage-100 text-sage-700 font-medium py-2 px-6 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-jungle-700">
                            {member.first_name} {member.last_name}
                            {member.id === currentGuest.id && (
                              <span className="ml-2 text-sm font-normal text-ocean-600">
                                (You)
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="text-sm text-sage-600">
                              {getAgeTypeLabel(member.age_type)}
                            </span>
                            <span className="text-sage-400">•</span>
                            <span className="text-sm text-sage-600">
                              {getGuestTypeLabel(member.guest_type)}
                            </span>
                          </div>
                        </div>
                        {canEditMember && (
                          <button
                            onClick={() => startEditing(member)}
                            className="bg-ocean-600 hover:bg-ocean-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-sage-700">Email:</span>
                          <span className="ml-2 text-sage-600">
                            {member.email || 'Not provided'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-sage-700">Phone:</span>
                          <span className="ml-2 text-sage-600">
                            {member.phone || 'Not provided'}
                          </span>
                        </div>
                        {member.dietary_restrictions && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-sage-700">
                              Dietary Restrictions:
                            </span>
                            <p className="mt-1 text-sage-600">{member.dietary_restrictions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {familyMembers.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-sage-600">No family members found.</p>
          </div>
        )}
      </main>
    </div>
  );
}
