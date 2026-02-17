'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Guest Registration Page
 * 
 * Allows new guests to register with first name, last name, and email.
 * After successful registration, redirects to guest dashboard.
 */

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  loading: boolean;
  error: string | null;
}

export default function GuestRegisterPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    loading: false,
    error: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value,
      error: null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formState.firstName.trim() || !formState.lastName.trim() || !formState.email.trim()) {
      setFormState(prev => ({
        ...prev,
        error: 'All fields are required',
      }));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.email)) {
      setFormState(prev => ({
        ...prev,
        error: 'Please enter a valid email address',
      }));
      return;
    }

    setFormState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/auth/guest/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formState.firstName.trim(),
          lastName: formState.lastName.trim(),
          email: formState.email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to guest dashboard
        router.push('/guest/dashboard');
      } else {
        setFormState(prev => ({
          ...prev,
          loading: false,
          error: data.error?.message || 'Registration failed',
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
            Join Our Wedding
          </h1>
          <p className="text-jungle-600">
            Register to access your personalized wedding portal
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {/* First Name */}
              <div className="mb-4">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formState.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  required
                  disabled={formState.loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  aria-label="First Name"
                />
              </div>

              {/* Last Name */}
              <div className="mb-4">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formState.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  required
                  disabled={formState.loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  aria-label="Last Name"
                />
              </div>

              {/* Email */}
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                  disabled={formState.loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  aria-label="Email Address"
                />
              </div>

              {/* Error Message */}
              {formState.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                  <p className="text-sm text-red-800">{formState.error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={formState.loading}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                aria-label="Register"
              >
                {formState.loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </span>
                ) : (
                  'Register'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-jungle-600">
            Already registered?{' '}
            <a href="/auth/guest-login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Log in here
            </a>
          </p>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-center">
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
