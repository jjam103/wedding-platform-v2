'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

function GuestLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AuthMethod>('email-matching');
  const [formState, setFormState] = useState<FormState>({
    email: '',
    loading: false,
    error: null,
    success: null,
  });

  // Check for success or error in URL params (from form POST redirect)
  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const message = searchParams.get('message');
    
    if (success && message) {
      setFormState(prev => ({
        ...prev,
        success: message,
        error: null,
        loading: false,
      }));
      
      // Clear URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    } else if (error && message) {
      setFormState(prev => ({
        ...prev,
        error: message,
        success: null,
        loading: false,
      }));
      
      // Clear URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

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
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const email = formData.get('email') as string;

      const response = await fetch('/api/guest-auth/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include', // Include cookies in request/response
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success - navigate to dashboard
        // CRITICAL: Wait for cookie to be set with retry logic
        // This prevents race condition where middleware checks before session is ready
        let cookieSet = false;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!cookieSet && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300));
          cookieSet = document.cookie.includes('guest_session');
          attempts++;
          
          if (!cookieSet) {
            console.log(`[Auth] Cookie not set yet, attempt ${attempts}/${maxAttempts}`);
          }
        }
        
        if (!cookieSet) {
          console.error('[Auth] Cookie was never set after', maxAttempts, 'attempts');
          setFormState(prev => ({
            ...prev,
            loading: false,
            error: 'Authentication succeeded but session cookie was not set. Please try again.',
          }));
          return;
        }
        
        console.log('[Auth] Cookie verified, navigating to dashboard');
        
        // Use window.location.href for full page navigation (ensures cookies are sent)
        window.location.href = '/guest/dashboard';
      } else {
        // Error - show message
        setFormState(prev => ({
          ...prev,
          loading: false,
          error: data.error?.message || 'Login failed',
        }));
      }
    } catch (error) {
      console.error('Email matching error:', error);
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
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const email = formData.get('email') as string;

      const response = await fetch('/api/guest-auth/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include', // Include cookies in request/response
      });

      const data = await response.json();

      if (data.success) {
        // Clear the form input by resetting the form
        form.reset();
        
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
          <div className="flex border-b border-gray-200" role="tablist">
            <button
              type="button"
              id="email-matching-tab"
              role="tab"
              aria-selected={activeTab === 'email-matching'}
              aria-controls="email-matching-panel"
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
              id="magic-link-tab"
              role="tab"
              aria-selected={activeTab === 'magic-link'}
              aria-controls="magic-link-panel"
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
            <div 
              role="tabpanel" 
              id="email-matching-panel" 
              aria-labelledby="email-matching-tab"
              hidden={activeTab !== 'email-matching'}
            >
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
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    aria-required="true"
                    aria-invalid={!!formState.error}
                    aria-describedby={formState.error ? "email-matching-error" : undefined}
                    disabled={formState.loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Error Message */}
                {formState.error && activeTab === 'email-matching' && (
                  <div id="email-matching-error" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                    <p className="text-sm text-red-800">{formState.error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={formState.loading}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-[44px]"
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
            </div>

            {/* Magic Link Form */}
            <div 
              role="tabpanel" 
              id="magic-link-panel" 
              aria-labelledby="magic-link-tab"
              hidden={activeTab !== 'magic-link'}
            >
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
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    aria-required="true"
                    aria-invalid={!!formState.error}
                    aria-describedby={formState.error ? "magic-link-error" : formState.success ? "magic-link-success" : undefined}
                    disabled={formState.loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Error Message */}
                {formState.error && activeTab === 'magic-link' && (
                  <div id="magic-link-error" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                    <p className="text-sm text-red-800">{formState.error}</p>
                  </div>
                )}

                {/* Success Message */}
                {formState.success && activeTab === 'magic-link' && (
                  <div id="magic-link-success" className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg" role="status">
                    <p className="text-sm text-green-800">{formState.success}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={formState.loading}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-[44px]"
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
            </div>
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

export default function GuestLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-sunset-50 to-ocean-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-jungle-600">Loading...</p>
        </div>
      </div>
    }>
      <GuestLoginForm />
    </Suspense>
  );
}
