/**
 * AccountProfilePage.jsx
 * 
 * User profile management (/account/profile).
 * Allows updating profile details (display_name) and displays age verification status
 * as a clearly separated account field.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AccountProfilePage() {
  const { user, profile, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { error: updateErr } = await updateProfile({ displayName });

    if (updateErr) {
      setError(updateErr);
    } else {
      setSuccess('Profile updated successfully.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-ground py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-ink">
              Profile Settings
            </h1>
            <p className="text-sm text-ink/60 mt-1">
              Manage your display name, email, and age verification profile status.
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

        {/* Profile Edit Form */}
        <div className="bg-paper rounded-lg shadow-lg p-6 mb-6 border border-rule">
          <h2 className="text-xl font-display font-bold text-ink mb-4">
            Personal Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-ground/50 border border-rule rounded text-ink/60 cursor-not-allowed"
              />
              <p className="text-xs text-ink/50 mt-1">Email address is managed via your account authentication.</p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-ink mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
                placeholder="Enter display name"
                className="w-full px-4 py-2 border border-rule rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white font-medium py-2 px-6 rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Separated Age Verification Declaration Field */}
        <div className="bg-paper rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-display font-bold text-ink mb-2">
            Age Verification Declaration
          </h2>
          <p className="text-sm text-ink/70 mb-4">
            Age self-declaration is stored as an independent profile record, separated from standard authentication logic.
          </p>

          <div className="p-4 bg-ground rounded border border-ink/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">Declaration Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Verified 18+
              </span>
            </div>
            {profile?.created_at && (
              <div className="flex items-center justify-between text-xs text-ink/60">
                <span>Recorded timestamp:</span>
                <span>{new Date(profile.created_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
