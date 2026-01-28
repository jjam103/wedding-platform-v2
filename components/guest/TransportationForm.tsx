'use client';

import { useState } from 'react';
import type { Guest } from '@/types';

interface TransportationFormProps {
  guest: Guest;
}

/**
 * Transportation Form Component
 * 
 * Allows guests to enter and update their flight information:
 * - Airport selection (SJO, LIR, Other)
 * - Flight number and airline
 * - Arrival and departure dates/times
 * 
 * Requirements: 13.7, 10.1
 */
export function TransportationForm({ guest }: TransportationFormProps) {
  const [formData, setFormData] = useState({
    airport_code: guest.airport_code || 'SJO',
    flight_number: guest.flight_number || '',
    arrival_date: guest.arrival_date || '',
    departure_date: guest.departure_date || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/guest/transportation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || 'Failed to update transportation information');
        return;
      }

      setSuccess('Transportation information updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-ocean-50 to-sunset-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-sage-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-jungle-700">Transportation Information</h1>
              <p className="text-sage-600 mt-1">Manage your flight details</p>
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Information Card */}
        <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-ocean-800 mb-2">✈️ Costa Rica Airports</h2>
          <ul className="text-sm text-ocean-700 space-y-1">
            <li>
              <strong>SJO</strong> - Juan Santamaría International Airport (San José) - Main
              international airport
            </li>
            <li>
              <strong>LIR</strong> - Daniel Oduber Quirós International Airport (Liberia) -
              Serves Guanacaste region
            </li>
            <li>
              <strong>Other</strong> - For domestic flights or alternative arrangements
            </li>
          </ul>
        </div>

        {/* Transportation Form */}
        <div className="bg-white rounded-lg shadow-md border border-sage-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Airport Selection */}
            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">
                Arrival Airport <span className="text-volcano-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, airport_code: 'SJO' })}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors border-2 ${
                    formData.airport_code === 'SJO'
                      ? 'bg-jungle-600 text-white border-jungle-600'
                      : 'bg-white text-sage-700 border-sage-300 hover:border-jungle-400'
                  }`}
                >
                  <div className="text-lg font-bold">SJO</div>
                  <div className="text-xs mt-1">San José</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, airport_code: 'LIR' })}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors border-2 ${
                    formData.airport_code === 'LIR'
                      ? 'bg-jungle-600 text-white border-jungle-600'
                      : 'bg-white text-sage-700 border-sage-300 hover:border-jungle-400'
                  }`}
                >
                  <div className="text-lg font-bold">LIR</div>
                  <div className="text-xs mt-1">Liberia</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, airport_code: 'Other' })}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors border-2 ${
                    formData.airport_code === 'Other'
                      ? 'bg-jungle-600 text-white border-jungle-600'
                      : 'bg-white text-sage-700 border-sage-300 hover:border-jungle-400'
                  }`}
                >
                  <div className="text-lg font-bold">Other</div>
                  <div className="text-xs mt-1">Domestic</div>
                </button>
              </div>
            </div>

            {/* Flight Number */}
            <div>
              <label htmlFor="flight_number" className="block text-sm font-medium text-sage-700 mb-1">
                Flight Number
              </label>
              <input
                type="text"
                id="flight_number"
                value={formData.flight_number}
                onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                placeholder="e.g., AA1234, UA567"
              />
              <p className="text-xs text-sage-500 mt-1">
                Optional - helps us coordinate airport pickups
              </p>
            </div>

            {/* Arrival Date */}
            <div>
              <label htmlFor="arrival_date" className="block text-sm font-medium text-sage-700 mb-1">
                Arrival Date & Time
              </label>
              <input
                type="datetime-local"
                id="arrival_date"
                value={formData.arrival_date}
                onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
              />
              <p className="text-xs text-sage-500 mt-1">
                When do you arrive in Costa Rica?
              </p>
            </div>

            {/* Departure Date */}
            <div>
              <label htmlFor="departure_date" className="block text-sm font-medium text-sage-700 mb-1">
                Departure Date & Time
              </label>
              <input
                type="datetime-local"
                id="departure_date"
                value={formData.departure_date}
                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
              />
              <p className="text-xs text-sage-500 mt-1">
                When do you depart from Costa Rica?
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-jungle-600 hover:bg-jungle-700 disabled:bg-sage-400 text-white font-medium py-3 px-8 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Transportation Info'}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-sage-50 border border-sage-200 rounded-lg p-4">
          <h3 className="font-semibold text-sage-800 mb-2">Need Help?</h3>
          <p className="text-sm text-sage-700">
            This information helps us coordinate airport shuttles and transportation logistics.
            If you're not sure about your flight details yet, you can update this information
            later. Contact the wedding hosts if you have any questions.
          </p>
        </div>
      </main>
    </div>
  );
}
