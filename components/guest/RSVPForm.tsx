/**
 * RSVP Form Component
 * 
 * Allows guests to submit or update their RSVP for activities.
 * Includes validation for deadlines, capacity, and guest counts.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10
 */

'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';
import type { RSVP } from '@/types';

// RSVP form schema
const rsvpFormSchema = z.object({
  status: z.enum(['attending', 'declined', 'maybe']),
  guestCount: z.number().int().positive('Guest count must be positive').optional(),
  dietaryRestrictions: z.string().max(500, 'Dietary restrictions must be 500 characters or less').optional(),
  plusOne: z.boolean().optional(),
});

type RSVPFormData = z.infer<typeof rsvpFormSchema>;

interface RSVPFormProps {
  activityId: string;
  currentRsvp?: RSVP;
  activityDetails?: {
    name: string;
    capacity: number | null;
    capacityRemaining: number | null;
    rsvpDeadline: string | null;
    allowsPlusOnes: boolean;
    isMeal: boolean;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function RSVPForm({
  activityId,
  currentRsvp,
  activityDetails,
  onSuccess,
  onCancel,
}: RSVPFormProps) {
  const [formData, setFormData] = useState<RSVPFormData>({
    status: currentRsvp?.status === 'pending' ? 'attending' : (currentRsvp?.status as any) || 'attending',
    guestCount: currentRsvp?.guest_count || 1,
    dietaryRestrictions: currentRsvp?.dietary_notes || '',
    plusOne: false, // This field doesn't exist on RSVP
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check if deadline has passed
  const isDeadlinePassed = activityDetails?.rsvpDeadline
    ? new Date(activityDetails.rsvpDeadline) < new Date()
    : false;

  // Check if capacity is full
  const isCapacityFull = activityDetails?.capacityRemaining !== null && activityDetails?.capacityRemaining !== undefined
    ? activityDetails.capacityRemaining <= 0
    : false;

  // Check if capacity is almost full (< 10% remaining)
  const isCapacityAlmostFull = activityDetails?.capacity && activityDetails?.capacityRemaining !== null && activityDetails?.capacityRemaining !== undefined
    ? (activityDetails.capacityRemaining / activityDetails.capacity) < 0.1
    : false;

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Deadline validation
    if (isDeadlinePassed) {
      newErrors.deadline = 'The RSVP deadline for this activity has passed. You can no longer submit or update your RSVP.';
      setErrors(newErrors);
      return false;
    }

    // Capacity validation (only for "attending" status)
    if (formData.status === 'attending') {
      if (isCapacityFull) {
        newErrors.capacity = 'This activity is at full capacity. You cannot RSVP as attending.';
        setErrors(newErrors);
        return false;
      }

      // Guest count validation
      if (!formData.guestCount || formData.guestCount < 1) {
        newErrors.guestCount = 'Guest count must be at least 1 when attending.';
      }

      // Check if guest count exceeds remaining capacity
      if (activityDetails?.capacityRemaining !== null && activityDetails?.capacityRemaining !== undefined) {
        const requestedCount = formData.guestCount || 1;
        if (requestedCount > activityDetails.capacityRemaining) {
          newErrors.guestCount = `Only ${activityDetails.capacityRemaining} spot(s) remaining. Please reduce your guest count.`;
        }
      }
    }

    // Zod validation
    const validation = rsvpFormSchema.safeParse(formData);
    if (!validation.success) {
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          newErrors[issue.path[0].toString()] = issue.message;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Sanitize input
      const sanitizedData = {
        ...formData,
        dietaryRestrictions: formData.dietaryRestrictions
          ? sanitizeInput(formData.dietaryRestrictions)
          : undefined,
      };

      // Determine API endpoint
      const url = currentRsvp
        ? `/api/guest/rsvps/${currentRsvp.id}`
        : `/api/guest/rsvps`;

      const method = currentRsvp ? 'PUT' : 'POST';

      const body = currentRsvp
        ? sanitizedData
        : {
            ...sanitizedData,
            activityId,
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to submit RSVP');
      }

      // Show success message (could use toast here)
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred while submitting your RSVP');
    } finally {
      setLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = (status: 'attending' | 'declined' | 'maybe') => {
    setFormData({ ...formData, status });
    setErrors({});
  };

  // Handle guest count change
  const handleGuestCountChange = (count: number) => {
    setFormData({ ...formData, guestCount: count });
    setErrors({ ...errors, guestCount: '' });
  };

  // Handle dietary restrictions change
  const handleDietaryRestrictionsChange = (value: string) => {
    setFormData({ ...formData, dietaryRestrictions: value });
    setErrors({ ...errors, dietaryRestrictions: '' });
  };

  // Handle plus-one change
  const handlePlusOneChange = (checked: boolean) => {
    setFormData({ ...formData, plusOne: checked });
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-6"
      aria-label="RSVP Form"
    >
      {/* Deadline Warning */}
      {isDeadlinePassed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ The RSVP deadline for this activity has passed. You can no longer submit or update your RSVP.
          </p>
        </div>
      )}

      {/* Capacity Warning */}
      {!isDeadlinePassed && isCapacityAlmostFull && !isCapacityFull && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4" role="alert">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ This activity is almost full! Only {activityDetails?.capacityRemaining} spot(s) remaining.
          </p>
        </div>
      )}

      {/* Status Selection */}
      <div role="group" aria-labelledby="rsvp-status-label">
        <label id="rsvp-status-label" className="block text-sm font-medium text-gray-700 mb-2">
          RSVP Status *
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleStatusChange('attending')}
            disabled={isDeadlinePassed || (isCapacityFull && formData.status !== 'attending')}
            aria-pressed={formData.status === 'attending'}
            aria-label="RSVP as attending"
            className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors min-h-[44px] ${
              formData.status === 'attending'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
            } ${
              (isDeadlinePassed || (isCapacityFull && formData.status !== 'attending'))
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            Attending
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange('maybe')}
            disabled={isDeadlinePassed}
            aria-pressed={formData.status === 'maybe'}
            aria-label="RSVP as maybe"
            className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors min-h-[44px] ${
              formData.status === 'maybe'
                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-yellow-300'
            } ${isDeadlinePassed ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Maybe
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange('declined')}
            disabled={isDeadlinePassed}
            aria-pressed={formData.status === 'declined'}
            aria-label="RSVP as declined"
            className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors min-h-[44px] ${
              formData.status === 'declined'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
            } ${isDeadlinePassed ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Declined
          </button>
        </div>
        {errors.capacity && (
          <p className="mt-2 text-sm text-red-600" role="alert" id="capacity-error">
            {errors.capacity}
          </p>
        )}
      </div>

      {/* Guest Count (only for attending) */}
      {formData.status === 'attending' && (
        <div>
          <label htmlFor="guestCount" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Guests *
          </label>
          <input
            type="number"
            id="guestCount"
            min="1"
            value={formData.guestCount || 1}
            onChange={(e) => handleGuestCountChange(parseInt(e.target.value, 10))}
            disabled={isDeadlinePassed}
            required
            aria-required="true"
            aria-invalid={!!errors.guestCount}
            aria-describedby={errors.guestCount ? 'guestCount-error' : undefined}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px] ${
              errors.guestCount ? 'border-red-500' : 'border-gray-300'
            } ${isDeadlinePassed ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {errors.guestCount && (
            <p className="mt-1 text-sm text-red-600" role="alert" id="guestCount-error">
              {errors.guestCount}
            </p>
          )}
          {activityDetails?.capacityRemaining !== null && activityDetails?.capacityRemaining !== undefined && (
            <p className="mt-1 text-sm text-gray-600" role="status">
              {activityDetails.capacityRemaining} spot(s) remaining
            </p>
          )}
        </div>
      )}

      {/* Dietary Restrictions (only for meals and attending) */}
      {formData.status === 'attending' && activityDetails?.isMeal && (
        <div>
          <label htmlFor="dietaryRestrictions" className="block text-sm font-medium text-gray-700 mb-2">
            Dietary Restrictions
          </label>
          <textarea
            id="dietaryRestrictions"
            rows={3}
            value={formData.dietaryRestrictions || ''}
            onChange={(e) => handleDietaryRestrictionsChange(e.target.value)}
            disabled={isDeadlinePassed}
            placeholder="Please let us know about any dietary restrictions or allergies..."
            aria-invalid={!!errors.dietaryRestrictions}
            aria-describedby={errors.dietaryRestrictions ? 'dietaryRestrictions-error' : undefined}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              errors.dietaryRestrictions ? 'border-red-500' : 'border-gray-300'
            } ${isDeadlinePassed ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {errors.dietaryRestrictions && (
            <p className="mt-1 text-sm text-red-600" role="alert" id="dietaryRestrictions-error">
              {errors.dietaryRestrictions}
            </p>
          )}
        </div>
      )}

      {/* Plus-One (if allowed and attending) */}
      {formData.status === 'attending' && activityDetails?.allowsPlusOnes && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="plusOne"
            checked={formData.plusOne || false}
            onChange={(e) => handlePlusOneChange(e.target.checked)}
            disabled={isDeadlinePassed}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
          />
          <label htmlFor="plusOne" className="ml-2 block text-sm text-gray-700">
            I will be bringing a plus-one
          </label>
        </div>
      )}

      {/* Submit Error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || isDeadlinePassed || Object.keys(errors).length > 0}
          className="px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading ? 'Submitting...' : currentRsvp ? 'Update RSVP' : 'Submit RSVP'}
        </button>
      </div>
    </form>
  );
}
