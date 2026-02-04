'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Magic Link Verification Page
 * 
 * Handles token verification for magic link authentication.
 * Displays loading state during verification and handles errors
 * (expired, invalid, or already used tokens).
 * 
 * Requirements: 5.9, 5.10
 * Task: 7.2
 */

type VerificationState = 'verifying' | 'success' | 'error';

interface ErrorDetails {
  code: string;
  message: string;
}

function VerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>('verifying');
  const [error, setError] = useState<ErrorDetails | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');

      // Validate token presence
      if (!token) {
        setState('error');
        setError({
          code: 'MISSING_TOKEN',
          message: 'No verification token provided',
        });
        return;
      }

      // Validate token format (64 hex characters)
      if (token.length !== 64 || !/^[0-9a-f]{64}$/i.test(token)) {
        setState('error');
        setError({
          code: 'INVALID_TOKEN',
          message: 'Invalid token format',
        });
        return;
      }

      try {
        // Call verification API
        const response = await fetch(`/api/auth/guest/magic-link/verify?token=${token}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (data.success) {
          setState('success');
          // Redirect to guest dashboard after 1 second
          setTimeout(() => {
            router.push('/guest/dashboard');
          }, 1000);
        } else {
          setState('error');
          setError({
            code: data.error.code,
            message: data.error.message,
          });
        }
      } catch (err) {
        setState('error');
        setError({
          code: 'NETWORK_ERROR',
          message: 'Failed to verify magic link. Please try again.',
        });
      }
    };

    verifyToken();
  }, [searchParams, router]);

  const getErrorTitle = (code: string): string => {
    switch (code) {
      case 'TOKEN_EXPIRED':
        return 'Link Expired';
      case 'TOKEN_USED':
        return 'Link Already Used';
      case 'NOT_FOUND':
      case 'INVALID_TOKEN':
        return 'Invalid Link';
      case 'MISSING_TOKEN':
        return 'Missing Token';
      default:
        return 'Verification Failed';
    }
  };

  const getErrorDescription = (code: string): string => {
    switch (code) {
      case 'TOKEN_EXPIRED':
        return 'This magic link has expired. Magic links are valid for 15 minutes. Please request a new one.';
      case 'TOKEN_USED':
        return 'This magic link has already been used. Each link can only be used once. Please request a new one if you need to log in again.';
      case 'NOT_FOUND':
      case 'INVALID_TOKEN':
        return 'This magic link is invalid or has been revoked. Please request a new one.';
      case 'MISSING_TOKEN':
        return 'No verification token was provided in the URL. Please use the complete link from your email.';
      default:
        return 'We couldn\'t verify your magic link. Please try again or request a new one.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-sunset-50 to-ocean-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Verifying State */}
          {state === 'verifying' && (
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="animate-spin h-16 w-16 text-emerald-600 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-jungle-800 mb-2">
                Verifying Your Link
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your magic link...
              </p>
            </div>
          )}

          {/* Success State */}
          {state === 'success' && (
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="h-16 w-16 text-green-600 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-jungle-800 mb-2">
                Login Successful!
              </h1>
              <p className="text-gray-600">
                Redirecting you to your dashboard...
              </p>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && error && (
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="h-16 w-16 text-red-600 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-800 mb-2">
                {getErrorTitle(error.code)}
              </h1>
              <p className="text-gray-600 mb-6">
                {getErrorDescription(error.code)}
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/auth/guest-login')}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
                >
                  Request New Magic Link
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Go to Home Page
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-jungle-600">
            Need help? Contact us at{' '}
            <a
              href="mailto:help@example.com"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              help@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MagicLinkVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-sunset-50 to-ocean-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="animate-spin h-16 w-16 text-emerald-600 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-jungle-800 mb-2">
                Loading...
              </h1>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerificationContent />
    </Suspense>
  );
}
