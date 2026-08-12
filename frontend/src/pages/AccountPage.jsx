/**
 * AccountPage.jsx
 * 
 * User account management, subscription status, and account deletion
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import api from '../api/client';

export default function AccountPage() {
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  const { user, subscription, signOut, deleteAccount, refreshSubscription } = useAuth();
  const sub = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    async function syncAndRefresh() {
      const searchParams = new URLSearchParams(window.location.search);
      const sessionId = searchParams.get('session_id');

      if (sessionId || !subscription) {
        try {
          await api.post('/subscriptions/verify-session', { session_id: sessionId });
        } catch (err) {
          // Non-fatal sync check
        }
        if (sessionId) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      refreshSubscription();
    }
    syncAndRefresh();
  }, []);

  async function handleManageSubscription() {
    setPortalLoading(true);
    setError('');

    try {
      const response = await api.post('/subscriptions/portal');

      if (response.success && response.data?.portal_url) {
        window.location.href = response.data.portal_url;
      } else {
        setError(response.error || 'Failed to open customer portal');
        setPortalLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to open portal');
      setPortalLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setLoading(true);
    const { error: deleteError } = await deleteAccount();

    if (deleteError) {
      setError(deleteError);
      setLoading(false);
    } else {
      navigate('/');
    }
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const formattedDate = sub.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : '';

  return (
    <div className="min-h-screen bg-ground py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-display font-bold text-ink">
            Account Settings
          </h1>
          {sub.loading ? (
            <Skeleton className="h-7 w-28 rounded-full" />
          ) : sub.isSubscribed ? (
            <Badge variant="accent" size="lg">PRO ACCOUNT</Badge>
          ) : (
            <Badge variant="default" size="lg">FREE ACCOUNT</Badge>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Account Sub-navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Link
            to="/account/profile"
            className="p-6 bg-paper rounded-lg shadow p-5 border border-rule hover:border-black transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-display font-bold text-ink text-lg">Profile Settings</h3>
              <p className="text-xs text-ink/60 mt-1">Manage display name & age verification declaration</p>
            </div>
            <span className="text-ink text-lg font-bold">→</span>
          </Link>
          <Link
            to="/account/security"
            className="p-6 bg-paper rounded-lg shadow p-5 border border-rule hover:border-black transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-display font-bold text-ink text-lg">Security & Password</h3>
              <p className="text-xs text-ink/60 mt-1">Update password and security credentials</p>
            </div>
            <span className="text-ink text-lg font-bold">→</span>
          </Link>
        </div>

        {/* User Info Section */}
        <div className="bg-paper rounded-lg shadow-lg p-6 mb-6 border border-rule">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold text-ink">
              Profile Summary
            </h2>
            <Link to="/account/profile" className="text-xs font-medium text-ink hover:underline">
              Edit Profile
            </Link>
          </div>
          <div className="space-y-2">
            <p className="text-ink">
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p className="text-ink">
              <span className="font-medium">Account Created:</span>{' '}
              {new Date(user.created_at || Date.now()).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-paper rounded-lg shadow-lg p-6 mb-6 border border-rule">
          <h2 className="text-2xl font-display font-bold text-ink mb-4">
            Subscription
          </h2>

          {sub.loading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : sub.isSubscribed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-ink">
                    {sub.cancelAtPeriodEnd ? `Active until ${formattedDate}` : 'Active Subscription'}
                  </p>
                  <p className="text-sm text-ink/70 font-medium mt-1">
                    Plan: {sub.planName}
                  </p>
                  {sub.cancelAtPeriodEnd ? (
                    <p className="text-sm text-amber-700 font-medium mt-1">
                      Your subscription will not renew after this date.
                    </p>
                  ) : formattedDate ? (
                    <p className="text-sm text-ink/60 mt-1">
                      Renews: {formattedDate}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-ink">
                    {sub.price}
                  </p>
                  <p className="text-sm text-ink/60">per {sub.interval}</p>
                </div>
              </div>

              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="w-full bg-black text-white font-medium py-2.5 px-4 rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {portalLoading ? 'Opening portal...' : 'Manage Subscription'}
              </button>

              <p className="text-xs text-ink/50 text-center">
                Update payment method, view invoices, or cancel subscription
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg font-bold text-ink mb-1">
                Free Account
              </p>
              <p className="text-sm text-ink/60 mb-6">
                No active subscription
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="bg-black text-white font-medium py-2.5 px-6 rounded hover:bg-neutral-800 transition-colors shadow-xs"
              >
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-paper rounded-lg shadow-lg p-6 border border-rule">
          <h2 className="text-2xl font-display font-bold text-ink mb-4">
            Danger Zone
          </h2>

          <div className="mb-4">
            <button
              onClick={signOut}
              className="w-full bg-neutral-100 text-ink font-medium py-2 px-4 rounded hover:bg-neutral-200 transition-colors mb-2 border border-rule"
            >
              Sign Out
            </button>
          </div>

          <div className="border-t border-rule pt-4">
            <h3 className="font-medium text-ink mb-2">Delete Account</h3>
            <p className="text-sm text-ink/60 mb-4">
              Permanently delete your account and all associated data.
              {subscription && ' Your subscription will be canceled immediately.'}
            </p>

            {!deleteConfirm ? (
              <button
                onClick={handleDeleteAccount}
                className="w-full bg-danger text-white font-medium py-2 px-4 rounded hover:bg-danger/90 transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-danger">
                  Are you absolutely sure? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="flex-1 bg-neutral-100 text-ink font-medium py-2 px-4 rounded hover:bg-neutral-200 transition-colors border border-rule"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex-1 bg-danger text-white font-medium py-2 px-4 rounded hover:bg-danger/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
