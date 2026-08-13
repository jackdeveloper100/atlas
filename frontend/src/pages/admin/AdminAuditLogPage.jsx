/**
 * AdminAuditLogPage.jsx
 *
 * System audit event feed and security log inspection view.
 */

import React, { useEffect, useState } from 'react';
import { History, Filter, Search } from 'lucide-react';
import adminService from '../../services/admin.service';

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventType, setEventType] = useState('');
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAuditLogs();
  }, [page, eventType, userId]);

  async function fetchAuditLogs() {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getAuditLogs({ page, limit: 25, eventType, userId });
      if (res.success) {
        setLogs(res.data.audit_logs);
        setTotalPages(res.data.total_pages || 1);
      } else {
        setError(res.error || 'Failed to fetch audit logs.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to API.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">
            Audit Logs
          </h1>
          <p className="text-sm text-ink/60 mt-1">
            Append-only record of security and administrative actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-ink/50" />
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-paper border border-rule rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All Event Types</option>
              <option value="admin_role_change">admin_role_change</option>
              <option value="admin_snapshot_toggle">admin_snapshot_toggle</option>
              <option value="admin_library_toggle">admin_library_toggle</option>
              <option value="signup">signup</option>
              <option value="login">login</option>
              <option value="subscribe">subscribe</option>
              <option value="cancel">cancel</option>
              <option value="delete_account">delete_account</option>
            </select>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Filter by User UUID..."
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-paper border border-rule rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black w-56"
            />
            <Search className="w-3.5 h-3.5 text-ink/40 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-paper border border-rule rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-ink/50 animate-pulse">
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink/50">
            No audit log entries found matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule bg-ground/40 text-xs uppercase tracking-wider text-ink/50">
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Event Type</th>
                  <th className="py-3.5 px-4 font-semibold">User</th>
                  <th className="py-3.5 px-4 font-semibold">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/50">
                {logs.map((log) => {
                  const isAdminEvent = log.event_type.startsWith('admin_');

                  return (
                    <tr key={log.id} className="hover:bg-black/5 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-ink/60 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${
                            isAdminEvent
                              ? 'bg-amber-500/10 text-amber-800 border-amber-500/30'
                              : 'bg-ground text-ink/80 border-rule'
                          }`}
                        >
                          {log.event_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-xs text-ink">
                          {log.profiles?.display_name || 'System / Unset'}
                        </div>
                        {log.user_id && (
                          <div className="text-[10px] font-mono text-ink/50">
                            {log.user_id}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-ink/70 max-w-md truncate">
                        {log.metadata ? JSON.stringify(log.metadata) : '-'}
                      </td>
                    </tr>
                  );
                })}
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
