/**
 * AdminUserDetailPage.jsx
 *
 * Detailed view for an individual user account, displaying profile details,
 * subscription history, and security audit log events.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, User, ArrowLeft, CreditCard, History } from 'lucide-react';
import adminService from '../../services/admin.service';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  async function fetchUserDetail() {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getUserById(id);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to fetch user details.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to API.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-ink/50 animate-pulse">
        Loading user account details...
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/users"
          className="inline-flex items-center text-xs font-medium text-ink hover:underline gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Users
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error || 'User account not found.'}
        </div>
      </div>
    );
  }

  const { user, subscriptions, audit_logs } = data;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <Link
          to="/admin/users"
          className="inline-flex items-center text-xs font-medium text-ink/60 hover:text-ink hover:underline gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Users
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold text-ink">
            {user.display_name || 'Anonymous User'}
          </h1>
          {user.role === 'admin' ? (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30">
              <Shield className="w-3.5 h-3.5" />
              <span>ADMIN USER</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-ground text-ink/70 border border-rule">
              <User className="w-3.5 h-3.5" />
              <span>STANDARD USER</span>
            </span>
          )}
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-paper border border-rule rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-display font-bold text-ink mb-4">
          Profile Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-xs uppercase font-semibold text-ink/50 block mb-1">
              User ID
            </span>
            <span className="font-mono text-xs text-ink/80 select-all">
              {user.id}
            </span>
          </div>
          <div>
            <span className="text-xs uppercase font-semibold text-ink/50 block mb-1">
              Display Name
            </span>
            <span className="font-medium text-ink">
              {user.display_name || 'Not set'}
            </span>
          </div>
          <div>
            <span className="text-xs uppercase font-semibold text-ink/50 block mb-1">
              Age Gate Confirmed
            </span>
            <span className="text-xs text-ink/80">
              {user.age_confirmed_at
                ? new Date(user.age_confirmed_at).toLocaleString()
                : 'Not confirmed'}
            </span>
          </div>
          <div>
            <span className="text-xs uppercase font-semibold text-ink/50 block mb-1">
              Account Created
            </span>
            <span className="text-xs text-ink/80">
              {new Date(user.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Subscriptions History */}
      <div className="bg-paper border border-rule rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-black/5 text-ink rounded-lg">
            <CreditCard className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-display font-bold text-ink">
            Subscription Records
          </h2>
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-sm text-ink/50 py-4">
            No subscription records found for this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule bg-ground/40 text-xs uppercase tracking-wider text-ink/50">
                  <th className="py-3 px-4 font-semibold">Plan</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Current Period End</th>
                  <th className="py-3 px-4 font-semibold">Stripe Sub ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/50">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-black/5">
                    <td className="py-3 px-4 font-medium text-ink">
                      {sub.subscription_plans?.name || 'Founding Member'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-ink/70">
                      {sub.current_period_end
                        ? new Date(sub.current_period_end).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-ink/60">
                      {sub.stripe_subscription_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Log Activity */}
      <div className="bg-paper border border-rule rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-black/5 text-ink rounded-lg">
            <History className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-display font-bold text-ink">
            User Security & Activity Events
          </h2>
        </div>

        {audit_logs.length === 0 ? (
          <div className="text-sm text-ink/50 py-4">
            No audit log events found for this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule bg-ground/40 text-xs uppercase tracking-wider text-ink/50">
                  <th className="py-3 px-4 font-semibold">Event Type</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/50">
                {audit_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-black/5">
                    <td className="py-3 px-4 font-mono font-medium text-xs text-ink">
                      {log.event_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-ink/70">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </td>
                    <td className="py-3 px-4 text-xs text-ink/60">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
