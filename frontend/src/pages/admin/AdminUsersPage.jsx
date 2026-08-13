/**
 * AdminUsersPage.jsx
 *
 * Full User CRUD administration view (Create, Read, Update, Delete) with search,
 * subscription status indicators, and role management.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, User, ExternalLink, RefreshCw, UserPlus, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import adminService from '../../services/admin.service';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);

  // Create User Form State
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user',
  });
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState({ type: '', text: '' });

  // Edit User Form State
  const [editForm, setEditForm] = useState({
    displayName: '',
    role: 'user',
    password: '',
  });
  const [updating, setUpdating] = useState(false);
  const [editMessage, setEditMessage] = useState({ type: '', text: '' });

  // Delete User State
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState({ type: '', text: '' });

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

  // Create User Handler
  async function handleCreateUser(e) {
    e.preventDefault();
    setCreateMessage({ type: '', text: '' });
    setCreating(true);

    try {
      const res = await adminService.createUser({
        email: createForm.email,
        password: createForm.password,
        displayName: createForm.displayName,
        role: createForm.role,
      });

      if (res.success) {
        setCreateMessage({ type: 'success', text: 'User account created successfully.' });
        setTimeout(() => {
          setIsCreateOpen(false);
          setCreateForm({ email: '', password: '', displayName: '', role: 'user' });
          setCreateMessage({ type: '', text: '' });
          fetchUsers();
        }, 1000);
      } else {
        setCreateMessage({ type: 'error', text: res.error || 'Failed to create user.' });
      }
    } catch (err) {
      setCreateMessage({ type: 'error', text: err.message || 'Failed to create user.' });
    } finally {
      setCreating(false);
    }
  }

  // Edit User Handler
  async function handleEditUser(e) {
    e.preventDefault();
    if (!editUser) return;

    setEditMessage({ type: '', text: '' });
    setUpdating(true);

    try {
      const res = await adminService.updateUser(editUser.id, {
        displayName: editForm.displayName,
        role: editForm.role,
        password: editForm.password || undefined,
      });

      if (res.success) {
        setEditMessage({ type: 'success', text: 'User account updated successfully.' });
        setTimeout(() => {
          setEditUser(null);
          setEditMessage({ type: '', text: '' });
          fetchUsers();
        }, 1000);
      } else {
        setEditMessage({ type: 'error', text: res.error || 'Failed to update user.' });
      }
    } catch (err) {
      setEditMessage({ type: 'error', text: err.message || 'Failed to update user.' });
    } finally {
      setUpdating(false);
    }
  }

  // Delete User Handler
  async function handleDeleteUser() {
    if (!deleteUserTarget) return;

    setDeleteMessage({ type: '', text: '' });
    setDeleting(true);

    try {
      const res = await adminService.deleteUser(deleteUserTarget.id);
      if (res.success) {
        setDeleteMessage({ type: 'success', text: 'User account deleted successfully.' });
        setTimeout(() => {
          setDeleteUserTarget(null);
          setDeleteMessage({ type: '', text: '' });
          fetchUsers();
        }, 1000);
      } else {
        setDeleteMessage({ type: 'error', text: res.error || 'Failed to delete user.' });
      }
    } catch (err) {
      setDeleteMessage({ type: 'error', text: err.message || 'Failed to delete user.' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header & Search + Create Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">
            User Accounts
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by display name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-paper border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <Search className="w-4 h-4 text-ink/40 absolute left-3 top-3" />
          </form>

          <button
            type="button"
            onClick={() => {
              setCreateForm({ email: '', password: '', displayName: '', role: 'user' });
              setCreateMessage({ type: '', text: '' });
              setIsCreateOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>
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
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="p-1.5 text-ink/70 hover:text-ink hover:bg-black/5 rounded transition-colors"
                            title="View User Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setEditUser(u);
                              setEditForm({
                                displayName: u.display_name || '',
                                role: u.role || 'user',
                                password: '',
                              });
                              setEditMessage({ type: '', text: '' });
                            }}
                            className="p-1.5 text-ink/70 hover:text-ink hover:bg-black/5 rounded transition-colors"
                            title="Edit User Account"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteUserTarget(u);
                              setDeleteMessage({ type: '', text: '' });
                            }}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-paper border border-rule rounded-xl shadow-2xl p-6 text-ink">
            <h3 className="text-xl font-display font-bold text-ink">
              Create New User
            </h3>
            <p className="text-xs text-ink/60 mt-1">
              Add a new user account to the system.
            </p>

            {createMessage.text && (
              <div
                className={`mt-4 p-3 rounded text-xs border ${createMessage.type === 'error'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
              >
                {createMessage.text}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 border border-rule rounded bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-2 border border-rule rounded bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2 border border-rule rounded bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
                  Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-4 py-2 border border-rule rounded bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Admin (Full System Access)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium border border-rule rounded hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-medium bg-black text-white rounded hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {creating && <RefreshCw className="w-3 h-3 animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-paper border border-rule rounded-xl shadow-2xl p-6 text-ink">
            <h3 className="text-xl font-display font-bold text-ink">
              Edit User Account
            </h3>
            <p className="text-xs text-ink/60 mt-1">
              Target ID: <span className="font-mono">{editUser.id}</span>
            </p>

            {editMessage.text && (
              <div
                className={`mt-4 p-3 rounded text-xs border ${editMessage.type === 'error'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
              >
                {editMessage.text}
              </div>
            )}

            <form onSubmit={handleEditUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full px-4 py-2 border border-rule rounded bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-2 border border-rule rounded bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Admin (Full System Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
                  New Password (Optional Reset)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-4 py-2 border border-rule rounded bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 text-xs font-medium border border-rule rounded hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 text-xs font-medium bg-black text-white rounded hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {updating && <RefreshCw className="w-3 h-3 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deleteUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-paper border border-rule rounded-xl shadow-2xl p-6 text-ink">
            <div className="flex items-center space-x-3 text-red-600 mb-2">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-xl font-display font-bold">
                Delete User Account?
              </h3>
            </div>
            <p className="text-xs text-ink/70 mt-2">
              Are you sure you want to permanently delete user{' '}
              <strong className="font-semibold text-ink">{deleteUserTarget.display_name || deleteUserTarget.id}</strong>?
              This action will remove their profile and authentication credentials.
            </p>

            {deleteMessage.text && (
              <div
                className={`mt-4 p-3 rounded text-xs border ${deleteMessage.type === 'error'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
              >
                {deleteMessage.text}
              </div>
            )}

            <div className="pt-6 flex justify-end space-x-2 border-t border-rule mt-6">
              <button
                type="button"
                onClick={() => setDeleteUserTarget(null)}
                className="px-4 py-2 text-xs font-medium border border-rule rounded hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteUser}
                className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <RefreshCw className="w-3 h-3 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
