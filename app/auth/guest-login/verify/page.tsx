'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Magic Link Verification Page
 * 
 * Handles magic link token verification and redirects to guest dashboard.
 * Shows appropriate error messages for expired, used, or invalid tokens.
 * 
 * Requirements: 5.3, 5.9
 * Task: 7.2
 */

type VerificationState = 
  | { status: 'verifying' }
  | { status: 'success' }
  | { status: 'error'; errorType: 'expired' | 'used' | 'invalid' | 'missing' | 'unknown'; message: string };

function MagicLinkVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>({ status: 'verifying' });

  useEffect(() => {
    // Check for error in URL params first
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    if (errorParam && messageParam) {
      // Map error codes to error types
      let errorType: 'expired' | 'used' | 'invalid' | 'missing' | 'unknown' = 'unknown';
      
      // Map API error codes to display error types (case-insensitive)
      const errorCode = errorParam.toUpperCase();
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'EXPIRED') {
        errorType = 'expired';
      } else if (errorCode === 'TOKEN_USED' || errorCode === 'USED' || errorCode === 'ALREADY_USED') {
        errorType = 'used';
      } else if (errorCode === 'INVALID_TOKEN' || errorCode === 'INVALID' || errorCode === 'NOT_FOUND') {
        errorType = 'invalid';
      } else if (errorCode === 'MISSING_TOKEN' || errorCode === 'MISSING') {
        errorType = 'missing';
      }

      setState({
        status: 'error',
        errorType,
        message: messageParam,
      });
      return;
    }

    const verifyToken = async () => {
      // Get token from URL
      const token = searchParams.get('token');

      // Check if token is missing
      if (!token) {
        setState({
          status: 'error',
          errorType: 'missing',
          message: 'No verification token was provided',
        });
        return;
      }

      // Validate token format
      if (!/^[a-f0-9]{64}$/.test(token)) {
        setState({
          status: 'error',
          errorType: 'invalid',
          message: 'The verification token has an invalid format',
        });
        return;
      }

      // Submit form programmatically
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/guest-auth/magic-link/verify';
      
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token';
      tokenInput.value = token;
      form.appendChild(tokenInput);
      
      document.body.appendChild(form);
      form.submit();
    };

    verifyToken();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-sunset-50 to-ocean-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Verifying State */}
          {state.status === 'verifying' && (
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="animate-spin h-12 w-12 text-emerald-600 mx-auto"
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
          {state.status === 'success' && (
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="h-12 w-12 text-green-600 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-jungle-800 mb-2">
                Verification Successful!
              </h1>
              <p className="text-gray-600">
                Redirecting you to your wedding portal...
              </p>
            </div>
          )}

          {/* Error States */}
          {state.status === 'error' && (
            <>
              {/* Missing Token */}
              {state.errorType === 'missing' && (
                <div className="text-center">
                  <div className="mb-6">
                    <svg
                      className="h-12 w-12 text-red-600 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-red-800 mb-2">
                    Missing Token
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {state.message}
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/auth/guest-login')}
                      className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Request New Magic Link
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Go to Home Page
                    </button>
                  </div>
                </div>
              )}

              {/* Expired Token */}
              {state.errorType === 'expired' && (
                <div className="text-center">
                  <div className="mb-6">
                    <svg
                      className="h-12 w-12 text-orange-600 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-orange-800 mb-2">
                    Link Expired
                  </h1>
                  <p className="text-gray-600 mb-2">
                    This magic link has expired.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Magic links are valid for 15 minutes for security reasons.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/auth/guest-login')}
                      className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Request New Magic Link
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Go to Home Page
                    </button>
                  </div>
                </div>
              )}

              {/* Used Token */}
              {state.errorType === 'used' && (
                <div className="text-center">
                  <div className="mb-6">
                    <svg
                      className="h-12 w-12 text-red-600 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-red-800 mb-2">
                    Link Already Used
                  </h1>
                  <p className="text-gray-600 mb-2">
                    This magic link has already been used.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Each link can only be used once for security reasons.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/auth/guest-login')}
                      className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Request New Magic Link
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Go to Home Page
                    </button>
                  </div>
                </div>
              )}

              {/* Invalid Token */}
              {state.errorType === 'invalid' && (
                <div className="text-center">
                  <div className="mb-6">
                    <svg
                      className="h-12 w-12 text-red-600 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-red-800 mb-2">
                    Invalid Link
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {state.message}
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/auth/guest-login')}
                      className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Request New Magic Link
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Go to Home Page
                    </button>
                  </div>
                </div>
              )}

              {/* Unknown Error */}
              {state.errorType === 'unknown' && (
                <div className="text-center">
                  <div className="mb-6">
                    <svg
                      className="h-12 w-12 text-red-600 mx-auto"
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
                    Verification Failed
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {state.message}
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/auth/guest-login')}
                      className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Go to Home Page
                    </button>
                  </div>
                </div>
              )}
            </>
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
      <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-sunset-50 to-ocean-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-jungle-600">Loading...</p>
        </div>
      </div>
    }>
      <MagicLinkVerifyContent />
    </Suspense>
  );
}
