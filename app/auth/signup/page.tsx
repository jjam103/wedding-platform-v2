'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function SignupPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Create Supabase client using @supabase/ssr
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // User record is automatically created by database trigger
        setSuccess(true);
        
        // If email confirmation is disabled, redirect to admin
        if (data.session) {
          setTimeout(() => {
            router.push('/admin');
            router.refresh();
          }, 2000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-jungle-50 to-cloud-100">
      <div className="w-full max-w-md">
        <div className="card-mobile">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-jungle-600 mb-2">
              🌴 Create Account
            </h1>
            <p className="text-sage-600">
              Join your wedding dashboard
            </p>
          </div>

          {success ? (
            <div className="p-6 bg-jungle-50 border border-jungle-200 rounded-lg text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-jungle-700 mb-2">
                Account Created!
              </h2>
              <p className="text-sage-600 mb-4">
                Check your email to confirm your account, or if email confirmation is disabled, you'll be redirected shortly.
              </p>
              <a href="/auth/login" className="text-jungle-600 hover:text-jungle-700 font-medium">
                Go to login →
              </a>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">
              {error && (
                <div className="p-4 bg-volcano-50 border border-volcano-200 rounded-lg text-volcano-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-sage-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input-mobile w-full"
                  placeholder="your-email@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-sage-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="form-input-mobile w-full"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-sage-500">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-sage-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="form-input-mobile w-full"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary-mobile w-full"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {!success && (
            <>
              <div className="mt-6 text-center">
                <p className="text-sm text-sage-600">
                  Already have an account?{' '}
                  <a href="/auth/login" className="text-jungle-600 hover:text-jungle-700 font-medium">
                    Sign in
                  </a>
                </p>
              </div>

              <div className="mt-4 text-center">
                <a href="/" className="text-sm text-sage-500 hover:text-sage-700">
                  ← Back to home
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
