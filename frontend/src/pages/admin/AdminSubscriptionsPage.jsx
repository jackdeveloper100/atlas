/**
 * AdminSubscriptionsPage.jsx
 *
 * Subscription management and billing status inspection view.
 */

import React, { useEffect, useState } from 'react';
import { CreditCard, Filter } from 'lucide-react';
import adminService from '../../services/admin.service';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSubscriptions();
  }, [page, status]);

  async function fetchSubscriptions() {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getSubscriptions({ page, limit: 15, status });
      if (res.success) {
        setSubscriptions(res.data.subscriptions);
        setTotalPages(res.data.total_pages || 1);
      } else {
        setError(res.error || 'Failed to fetch subscriptions.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to API.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">
            Subscriptions Management
          </h1>
          <p className="text-sm text-ink/60 mt-1">
            Real database subscription statuses cross-referenced with Stripe.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-ink/50" />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-paper border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="canceled">Canceled</option>
            <option value="past_due">Past Due</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-paper border border-rule rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-ink/50 animate-pulse">
            Loading subscriptions...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink/50">
            No subscriptions found matching status filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule bg-ground/40 text-xs uppercase tracking-wider text-ink/50">
                  <th className="py-3.5 px-4 font-semibold">User</th>
                  <th className="py-3.5 px-4 font-semibold">Plan</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Current Period End</th>
                  <th className="py-3.5 px-4 font-semibold">Stripe Customer ID</th>
                  <th className="py-3.5 px-4 font-semibold">Stripe Sub ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/50">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-black/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-ink">
                        {sub.profiles?.display_name || 'User'}
                      </div>
                      <div className="text-xs font-mono text-ink/50">
                        {sub.user_id}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-ink">
                      {sub.subscription_plans?.name || 'Founding Member'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${
                          sub.status === 'active' || sub.status === 'trialing'
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-700 border-red-500/30'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink/70">
                      {sub.current_period_end
                        ? new Date(sub.current_period_end).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-ink/60">
                      {sub.stripe_customer_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-ink/60">
                      {sub.stripe_subscription_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-rule flex items-center justify-between text-xs">
            <span className="text-ink/60">
              Page {page} of {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded border border-rule disabled:opacity-40 hover:bg-black/5"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded border border-rule disabled:opacity-40 hover:bg-black/5"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
