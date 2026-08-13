/**
 * AdminDashboardPage.jsx
 *
 * Overview dashboard displaying system stats, subscriber metrics,
 * content counts, and recent administrative audit activity.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CreditCard,
  FileClock,
  Radio,
  History,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import adminService from '../../services/admin.service';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);
      const res = await adminService.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      } else {
        setError(res.error || 'Failed to load system metrics.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to admin API.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-paper border border-rule rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-paper border border-rule rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users ?? 0,
      icon: Users,
      link: '/admin/users',
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      title: 'Active Subscribers',
      value: stats?.active_subscribers ?? 0,
      icon: CreditCard,
      link: '/admin/subscriptions',
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      title: 'Published Snapshots',
      value: stats?.published_snapshots ?? 0,
      icon: FileClock,
      link: '/admin/archive',
      color: 'bg-purple-500/10 text-purple-600',
    },
    {
      title: 'Library Audio Tracks',
      value: stats?.total_library_items ?? 0,
      icon: Radio,
      link: '/admin/library',
      color: 'bg-amber-500/10 text-amber-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-ink">
          Admin Dashboard
        </h1>
        <p className="text-sm text-ink/60 mt-1">
          System telemetry, subscriber stats, and administrative controls.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="bg-paper border border-rule rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-ink/50">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-lg ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-mono font-bold text-ink">
                  {card.value}
                </span>
                <ArrowRight className="w-4 h-4 text-ink/40 group-hover:text-ink transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Audit Activity */}
      <div className="bg-paper border border-rule rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-black/5 text-ink rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-ink">
                Recent Audit Events
              </h2>
              <p className="text-xs text-ink/60">
                Latest security and administration events
              </p>
            </div>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-ink hover:underline flex items-center gap-1"
          >
            View All Audit Logs →
          </Link>
        </div>

        {stats?.recent_audit_logs?.length === 0 ? (
          <div className="text-center py-8 text-sm text-ink/50">
            No audit events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule text-xs uppercase tracking-wider text-ink/50">
                  <th className="py-3 px-4 font-semibold">Event Type</th>
                  <th className="py-3 px-4 font-semibold">User ID</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/50">
                {stats?.recent_audit_logs?.map((log) => (
                  <tr key={log.id} className="hover:bg-black/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-xs text-ink">
                      {log.event_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-ink/70">
                      {log.user_id || 'System'}
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
