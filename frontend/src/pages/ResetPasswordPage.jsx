/**
 * ResetPasswordPage.jsx
 * 
 * Set a new password using a reset token or recovery session.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { resetPassword, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract access_token from query or hash fragment if present
    const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
    const queryParams = new URLSearchParams(location.search);

    const tokenFromUrl = hashParams.get('access_token') || queryParams.get('access_token') || session?.access_token;
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [location, session]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const effectiveToken = token || session?.access_token;

    const { error: resetError } = await resetPassword(password, effectiveToken);

    if (resetError) {
      setError(resetError);
      setLoading(false);
    } else {
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }

  return (
    <div className="min-h-screen bg-ground flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-paper rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-display font-bold text-ink mb-4">
          Set New Password
        </h1>
        <p className="text-sm text-ink/70 mb-6">
          Enter your new password below.
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
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-rule rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-rule rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Re-enter new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-medium py-2 px-4 rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating password...' : 'Update Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          <Link to="/login" className="text-ink hover:underline font-medium">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
