'use client';

/**
 * Deletion Confirmation Dialog
 * 
 * Displays a warning with list of dependent records before deletion.
 * Requires explicit confirmation for cascade deletion.
 * Provides option to reassign references (future enhancement).
 */

import { useState } from 'react';
import type { DependentRecord } from '../../utils/referenceChecking';

interface DeletionConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (permanent: boolean) => void;
  entityType: 'content_page' | 'event' | 'activity';
  entityName: string;
  dependentRecords: DependentRecord[];
  totalCount: number;
}

export function DeletionConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  entityType,
  entityName,
  dependentRecords,
  totalCount,
}: DeletionConfirmDialogProps) {
  const [deletionType, setDeletionType] = useState<'soft' | 'permanent'>('soft');

  if (!isOpen) return null;

  const hasReferences = dependentRecords.length > 0;

  const entityTypeLabel = {
    content_page: 'Content Page',
    event: 'Event',
    activity: 'Activity',
  }[entityType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Confirm Deletion
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Warning Message */}
          <div className="mb-4">
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{entityName}</strong>?
            </p>
          </div>

          {/* Dependent Records Warning */}
          {hasReferences && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    This {entityTypeLabel.toLowerCase()} has dependent records
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    Deleting this {entityTypeLabel.toLowerCase()} will also affect{' '}
                    <strong>{totalCount}</strong> related record{totalCount !== 1 ? 's' : ''}:
                  </p>
                  <ul className="space-y-1">
                    {dependentRecords.map((record) => (
                      <li key={record.id} className="text-sm text-yellow-700">
                        • <strong>{record.count}</strong> {record.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Deletion Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Deletion Type
            </label>
            <div className="space-y-3">
              {/* Soft Delete Option */}
              <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="deletionType"
                  value="soft"
                  checked={deletionType === 'soft'}
                  onChange={() => setDeletionType('soft')}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    Soft Delete (Recommended)
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Hide this {entityTypeLabel.toLowerCase()} and its dependent records.
                    Can be restored later from the Deleted Items manager.
                  </div>
                </div>
              </label>

              {/* Permanent Delete Option */}
              <label className="flex items-start p-4 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50">
                <input
                  type="radio"
                  name="deletionType"
                  value="permanent"
                  checked={deletionType === 'permanent'}
                  onChange={() => setDeletionType('permanent')}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-red-900">
                    Permanent Delete
                  </div>
                  <div className="text-sm text-red-700 mt-1">
                    Permanently remove this {entityTypeLabel.toLowerCase()} and all dependent
                    records from the database. <strong>This cannot be undone.</strong>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Confirmation Checkbox for Permanent Delete */}
          {deletionType === 'permanent' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  id="confirmPermanent"
                  className="mt-1 mr-3"
                  required
                />
                <div className="text-sm text-red-800">
                  I understand that this action is permanent and cannot be undone.
                  All dependent records will be permanently deleted.
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (deletionType === 'permanent') {
                const checkbox = document.getElementById('confirmPermanent') as HTMLInputElement;
                if (!checkbox?.checked) {
                  alert('Please confirm that you understand this action is permanent.');
                  return;
                }
              }
              onConfirm(deletionType === 'permanent');
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              deletionType === 'permanent'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {deletionType === 'permanent' ? 'Permanently Delete' : 'Soft Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
