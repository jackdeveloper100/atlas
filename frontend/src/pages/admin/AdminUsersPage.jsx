/**
 * AdminUsersPage.jsx
 *
 * User account management view with search, subscription status badges,
 * role assignment, and detail inspection.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, User, ExternalLink, RefreshCw } from 'lucide-react';
import adminService from '../../services/admin.service';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Role Change Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetRole, setTargetRole] = useState('user');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [roleMessage, setRoleMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getUsers({ page, limit: 15, search });
      if (res.success) {
        setUsers(res.data.users);
        setTotalPages(res.data.total_pages || 1);
      } else {
        setError(res.error || 'Failed to fetch users.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to API.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  async function handleRoleUpdate(e) {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setUpdatingRole(true);
      setRoleMessage('');
      const res = await adminService.updateUserRole(selectedUser.id, targetRole);
      if (res.success) {
        setRoleMessage(`Role updated successfully to '${targetRole}'`);
        setTimeout(() => {
          setSelectedUser(null);
          fetchUsers();
        }, 1000);
      } else {
        setRoleMessage(`Error: ${res.error}`);
      }
    } catch (err) {
      setRoleMessage(`Error: ${err.message}`);
    } finally {
      setUpdatingRole(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">
            User Accounts
          </h1>
          <p className="text-sm text-ink/60 mt-1">
            Manage system users, view subscription statuses, and assign roles.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by display name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-paper border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <Search className="w-4 h-4 text-ink/40 absolute left-3 top-3" />
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-paper border border-rule rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-ink/50 animate-pulse">
            Loading user accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink/50">
            No user accounts found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule bg-ground/40 text-xs uppercase tracking-wider text-ink/50">
                  <th className="py-3.5 px-4 font-semibold">User</th>
                  <th className="py-3.5 px-4 font-semibold">Role</th>
                  <th className="py-3.5 px-4 font-semibold">Subscription Status</th>
                  <th className="py-3.5 px-4 font-semibold">Joined</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/50">
                {users.map((u) => {
                  const subStatus = u.subscription?.status;
                  const isSubscribed = subStatus === 'active' || subStatus === 'trialing';

                  return (
                    <tr key={u.id} className="hover:bg-black/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-ink">
                          {u.display_name || 'Anonymous User'}
                        </div>
                        <div className="text-xs font-mono text-ink/50 mt-0.5">
                          {u.id}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30">
                            <Shield className="w-3 h-3" />
                            <span>admin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-ground text-ink/70 border border-rule">
                            <User className="w-3 h-3" />
                            <span>user</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isSubscribed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                            {subStatus} ({u.subscription?.subscription_plans?.name || 'Pro'})
                          </span>
                        ) : subStatus ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-700 border border-red-500/30">
                            {subStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-ink/40 font-mono">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-ink/60">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          to={`/admin/users/${u.id}`}
                          className="inline-flex items-center text-xs font-medium text-ink hover:underline gap-1"
                        >
                          Details <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setTargetRole(u.role || 'user');
                            setRoleMessage('');
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded border border-rule hover:bg-black/5 text-ink transition-colors"
                        >
                          Change Role
                        </button>
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

      {/* Role Assignment Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-paper border border-rule rounded-xl shadow-2xl p-6 text-ink">
            <h3 className="text-xl font-display font-bold text-ink">
              Update User Role
            </h3>
            <p className="text-xs text-ink/60 mt-1">
              Target: <span className="font-mono">{selectedUser.display_name || selectedUser.id}</span>
            </p>

            {roleMessage && (
              <div className="mt-4 p-3 rounded text-xs bg-ground border border-rule">
                {roleMessage}
              </div>
            )}

            <form onSubmit={handleRoleUpdate} className="mt-6 space-y-4">
              <div>
                <label htmlFor="user-role-select" className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-2">
                  Select Role
                </label>
                <select
                  id="user-role-select"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-2 border border-rule rounded bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Admin (Full System Access)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-xs font-medium border border-rule rounded hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingRole}
                  className="px-4 py-2 text-xs font-medium bg-black text-white rounded hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {updatingRole && <RefreshCw className="w-3 h-3 animate-spin" />}
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
