/**
 * AdminArchivePage.jsx
 *
 * Archive simulation snapshots publication management view.
 */

import React, { useEffect, useState } from 'react';
import { FileClock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import adminService from '../../services/admin.service';

export default function AdminArchivePage() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingYear, setTogglingYear] = useState(null);

  useEffect(() => {
    fetchSnapshots();
  }, []);

  async function fetchSnapshots() {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getSnapshots();
      if (res.success) {
        setSnapshots(res.data.snapshots);
      } else {
        setError(res.error || 'Failed to fetch snapshot records.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to API.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePublish(year) {
    try {
      setTogglingYear(year);
      const res = await adminService.toggleSnapshotPublish(year);
      if (res.success) {
        fetchSnapshots();
      } else {
        alert(`Failed to toggle snapshot publication: ${res.error}`);
      }
    } catch (err) {
      alert(`Failed to toggle publication: ${err.message}`);
    } finally {
      setTogglingYear(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-ink">
          Archive Snapshot Management
        </h1>
        <p className="text-sm text-ink/60 mt-1">
          Control publication visibility of ingested yearly world snapshots.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Snapshots List Table */}
      <div className="bg-paper border border-rule rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-ink/50 animate-pulse">
            Loading snapshots...
          </div>
        ) : snapshots.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink/50">
            No ingested snapshots found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule bg-ground/40 text-xs uppercase tracking-wider text-ink/50">
                  <th className="py-3.5 px-4 font-semibold">Simulated Year</th>
                  <th className="py-3.5 px-4 font-semibold">Storage Key</th>
                  <th className="py-3.5 px-4 font-semibold">Schema Version</th>
                  <th className="py-3.5 px-4 font-semibold">Publication Status</th>
                  <th className="py-3.5 px-4 font-semibold">Published Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/50">
                {snapshots.map((snap) => (
                  <tr key={snap.year} className="hover:bg-black/5 transition-colors">
                    <td className="py-3.5 px-4 font-display font-bold text-base text-ink">
                      Year {snap.year}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-ink/70">
                      {snap.snapshot_key}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-ink/60">
                      {snap.schema_version}
                    </td>
                    <td className="py-3.5 px-4">
                      {snap.is_published ? (
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
                    <td className="py-3.5 px-4 text-xs text-ink/60">
                      {snap.published_at
                        ? new Date(snap.published_at).toLocaleString()
                        : 'Not published'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        disabled={togglingYear === snap.year}
                        onClick={() => handleTogglePublish(snap.year)}
                        className={`px-3 py-1 text-xs font-medium rounded border transition-colors flex items-center justify-end gap-1.5 ml-auto ${
                          snap.is_published
                            ? 'border-red-200 text-red-700 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {togglingYear === snap.year && (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        )}
                        {snap.is_published ? 'Unpublish' : 'Publish'}
                      </button>
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
