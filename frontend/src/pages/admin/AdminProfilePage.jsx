/**
 * AdminProfilePage.jsx
 *
 * Administrator profile settings and password update view.
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Key, Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminProfilePage() {
  const { user, profile, updateProfile, updateSecurity } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setLoadingProfile(true);

    try {
      const { error } = await updateProfile({ displayName });
      if (error) {
        setProfileMessage({ type: 'error', text: error });
      } else {
        setProfileMessage({ type: 'success', text: 'Admin profile updated successfully.' });
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleSecuritySubmit(e) {
    e.preventDefault();
    setSecurityMessage({ type: '', text: '' });

    if (newPassword.length < 8) {
      setSecurityMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoadingSecurity(true);

    try {
      const { error } = await updateSecurity({ newPassword });
      if (error) {
        setSecurityMessage({ type: 'error', text: error });
      } else {
        setSecurityMessage({ type: 'success', text: 'Password updated successfully.' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setSecurityMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setLoadingSecurity(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-ink">
          Admin Profile & Security
        </h1>
        <p className="text-sm text-ink/60 mt-1">
          Manage your administrator identity, display credentials, and account password.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Profile Edit & Password Update */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Edit Card */}
          <div className="bg-paper border border-rule rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 bg-black/5 text-ink rounded-lg">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-ink">
                  Administrator Profile
                </h2>
                <p className="text-xs text-ink/60">
                  Update public display name for admin actions
                </p>
              </div>
            </div>

            {profileMessage.text && (
              <div
                className={`mb-6 p-4 rounded-lg text-sm flex items-center gap-2 border ${
                  profileMessage.type === 'error'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {profileMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink/60 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 bg-ground border border-rule rounded-lg text-sm font-mono text-ink/60 cursor-not-allowed"
                />
                <p className="text-[11px] text-ink/50 mt-1">
                  Email address is managed via authentication credentials.
                </p>
              </div>

              <div>
                <label htmlFor="displayName" className="block text-xs uppercase tracking-wider font-semibold text-ink/60 mb-1">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. System Administrator"
                  required
                  className="w-full px-4 py-2.5 bg-paper border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loadingProfile}
                  className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingProfile ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Password Update Card */}
          <div className="bg-paper border border-rule rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 bg-black/5 text-ink rounded-lg">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-ink">
                  Update Security Password
                </h2>
                <p className="text-xs text-ink/60">
                  Change administrator access password
                </p>
              </div>
            </div>

            {securityMessage.text && (
              <div
                className={`mb-6 p-4 rounded-lg text-sm flex items-center gap-2 border ${
                  securityMessage.type === 'error'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {securityMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{securityMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSecuritySubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-xs uppercase tracking-wider font-semibold text-ink/60 mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  required
                  className="w-full px-4 py-2.5 bg-paper border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-wider font-semibold text-ink/60 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  placeholder="Re-enter new password"
                  required
                  className="w-full px-4 py-2.5 bg-paper border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loadingSecurity}
                  className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingSecurity ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Admin Account Summary Badge */}
        <div className="space-y-6">
          <div className="bg-paper border border-rule rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 pb-4 border-b border-rule">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 font-display font-bold text-lg flex items-center justify-center">
                {(profile?.display_name || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-display font-bold text-ink">
                  {profile?.display_name || 'Admin User'}
                </div>
                <div className="text-xs text-ink/60 font-mono truncate max-w-[180px]">
                  {user?.email}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink/60">System Role:</span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ADMIN</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink/60">Account UUID:</span>
                <span className="font-mono text-ink/80 text-[11px] truncate max-w-[120px]" title={user?.id}>
                  {user?.id}
                </span>
              </div>

              {profile?.created_at && (
                <div className="flex items-center justify-between">
                  <span className="text-ink/60">Registered:</span>
                  <span className="text-ink/80">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
