/**
 * ForgotPasswordPage.jsx
 * 
 * Request a password reset link via email.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { forgotPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { data, error: resetError } = await forgotPassword(email);

    if (resetError) {
      setError(resetError);
    } else {
      setMessage(data?.data?.message || 'Password reset link sent to your email.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-ground flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-paper rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-display font-bold text-ink mb-4">
          Reset Password
        </h1>
        <p className="text-sm text-ink/70 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-paper border border-rule rounded text-ink text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-rule rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-medium py-2 px-4 rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          Remember your password?{' '}
          <Link to="/login" className="text-ink hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
