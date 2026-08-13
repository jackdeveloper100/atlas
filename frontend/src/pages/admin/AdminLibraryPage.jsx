/**
 * AdminLibraryPage.jsx
 *
 * Subscriber audio library content publication management view.
 */

import React, { useEffect, useState } from 'react';
import { Radio, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import adminService from '../../services/admin.service';

export default function AdminLibraryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchLibraryItems();
  }, []);

  async function fetchLibraryItems() {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getLibraryItems();
      if (res.success) {
        setItems(res.data.items);
      } else {
        setError(res.error || 'Failed to fetch library items.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to API.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePublish(id) {
    try {
      setTogglingId(id);
      const res = await adminService.toggleLibraryPublish(id);
      if (res.success) {
        fetchLibraryItems();
      } else {
        alert(`Failed to toggle item publication: ${res.error}`);
      }
    } catch (err) {
      alert(`Failed to toggle publication: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-ink">
          Audio Library Management
        </h1>
        <p className="text-sm text-ink/60 mt-1">
          Manage subscriber-only audio tracks and publication status.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Library Table */}
      <div className="bg-paper border border-rule rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-ink/50 animate-pulse">
            Loading audio library items...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink/50">
            No audio library tracks found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule bg-ground/40 text-xs uppercase tracking-wider text-ink/50">
                  <th className="py-3.5 px-4 font-semibold">Title & Description</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">Storage Path</th>
                  <th className="py-3.5 px-4 font-semibold">Duration</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/50">
                {items.map((item) => {
                  const durationFormatted = item.duration_seconds
                    ? `${Math.floor(item.duration_seconds / 60)}m ${item.duration_seconds % 60}s`
                    : 'N/A';

                  return (
                    <tr key={item.id} className="hover:bg-black/5 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-ink flex items-center gap-1.5">
                          <Radio className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>{item.title}</span>
                        </div>
                        {item.description && (
                          <div className="text-xs text-ink/60 truncate mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs uppercase text-ink/70">
                        {item.item_type}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-ink/70">
                        {item.storage_path}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-ink/70">
                        {durationFormatted}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.is_published ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            <span>Published</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-600 border border-gray-500/30">
                            <XCircle className="w-3 h-3" />
                            <span>Draft</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          disabled={togglingId === item.id}
                          onClick={() => handleTogglePublish(item.id)}
                          className={`px-3 py-1 text-xs font-medium rounded border transition-colors flex items-center justify-end gap-1.5 ml-auto ${
                            item.is_published
                              ? 'border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {togglingId === item.id && (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          )}
                          {item.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
