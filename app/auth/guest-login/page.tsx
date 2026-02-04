'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Guest Login Page
 * 
 * Provides two authentication methods for guests:
 * 1. Email Matching - Direct login with registered email
 * 2. Magic Link - Passwordless login via email link
 * 
 * Requirements: 5.1, 5.7, 5.10
 * Task: 7.1
 */

type AuthMethod = 'email-matching' | 'magic-link';

interface FormState {
  email: string;
  loading: boolean;
  error: string | null;
  success: string | null;
}

export default function GuestLoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthMethod>('email-matching');
  const [formState, setFormState] = useState<FormState>({
    email: '',
    loading: false,
    error: null,
    success: null,
  });

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({
      ...prev,
      email: e.target.value,
      error: null,
      success: null,
    }));
  };

  const handleEmailMatchingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setFormState(prev => ({ ...prev, loading: true, error: null, success: null }));

    try {
      const response = await fetch('/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formState.email }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to guest dashboard
        router.push('/guest/dashboard');
      } else {
        setFormState(prev => ({
          ...prev,
          loading: false,
          error: data.error.message || 'Authentication failed',
        }));
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred. Please try again.',
      }));
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setFormState(prev => ({ ...prev, loading: true, error: null, success: null }));

    try {
      const response = await fetch('/api/auth/guest/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formState.email }),
      });

      const data = await response.json();

      if (data.success) {
        setFormState(prev => ({
          ...prev,
          loading: false,
          email: '',
          success: 'Check your email for a login link. It will expire in 15 minutes.',
        }));
      } else {
        setFormState(prev => ({
          ...prev,
          loading: false,
          error: data.error.message || 'Failed to send magic link',
        }));
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred. Please try again.',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-sunset-50 to-ocean-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-jungle-800 mb-2">
            Welcome to Our Wedding
          </h1>
          <p className="text-jungle-600">
            Log in to view your personalized wedding portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('email-matching');
                setFormState({ email: '', loading: false, error: null, success: null });
              }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'email-matching'
                  ? 'bg-emerald-600 text-white border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Email Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('magic-link');
                setFormState({ email: '', loading: false, error: null, success: null });
              }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'magic-link'
                  ? 'bg-emerald-600 text-white border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {/* Email Matching Form */}
            {activeTab === 'email-matching' && (
              <form onSubmit={handleEmailMatchingSubmit}>
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Enter the email address you used when you RSVP'd to log in instantly.
                  </p>
                  
                  <label htmlFor="email-matching-input" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email-matching-input"
                    type="email"
                    value={formState.email}
                    onChange={handleEmailChange}
                    placeholder="your.email@example.com"
                    required
                    disabled={formState.loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Error Message */}
                {formState.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{formState.error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={formState.loading || !formState.email}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {formState.loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    'Log In'
                  )}
                </button>
              </form>
            )}

            {/* Magic Link Form */}
            {activeTab === 'magic-link' && (
              <form onSubmit={handleMagicLinkSubmit}>
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    We'll send you a secure login link via email. The link will expire in 15 minutes.
                  </p>
                  
                  <label htmlFor="magic-link-input" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="magic-link-input"
                    type="email"
                    value={formState.email}
                    onChange={handleEmailChange}
                    placeholder="your.email@example.com"
                    required
                    disabled={formState.loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Error Message */}
                {formState.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{formState.error}</p>
                  </div>
                )}

                {/* Success Message */}
                {formState.success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">{formState.success}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={formState.loading || !formState.email}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {formState.loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending link...
                    </span>
                  ) : (
                    'Send Magic Link'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-jungle-600">
            Need help? Contact us at{' '}
            <a href="mailto:help@example.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
              help@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
