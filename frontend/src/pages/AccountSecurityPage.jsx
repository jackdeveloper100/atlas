/**
 * AccountSecurityPage.jsx
 * 
 * Account security management (/account/security).
 * Password changes and security settings.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AccountSecurityPage() {
  const { updateSecurity } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: securityErr } = await updateSecurity({ newPassword });

    if (securityErr) {
      setError(securityErr);
    } else {
      setSuccess('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-ground py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-ink">
              Security Settings
            </h1>
            <p className="text-sm text-ink/60 mt-1">
              Manage your password and authentication security credentials.
            </p>
          </div>
          <Link
            to="/account"
            className="text-sm font-medium text-ink hover:underline"
          >
            ← Back to Account
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-paper border border-rule rounded text-ink">
            {success}
          </div>
        )}

        {/* Change Password Form */}
        <div className="bg-paper rounded-lg shadow-lg p-6 mb-6 border border-rule">
          <h2 className="text-xl font-display font-bold text-ink mb-4">
            Change Password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-ink mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2 border border-rule rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
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
                placeholder="Re-enter new password"
                className="w-full px-4 py-2 border border-rule rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white font-medium py-2 px-6 rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Active Session Info */}
        <div className="bg-paper rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-display font-bold text-ink mb-2">
            Session Security
          </h2>
          <p className="text-sm text-ink/70">
            All authenticated API requests use secure server-side JWT verification. No credentials or service-role keys are exposed in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
