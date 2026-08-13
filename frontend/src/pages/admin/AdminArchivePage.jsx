/**
 * AdminArchivePage.jsx
 *
 * Archive simulation snapshots management, snapshot creation, ingestion,
 * and dynamic region details editor view.
 */

import React, { useEffect, useState } from 'react';
import { FileClock, CheckCircle, XCircle, RefreshCw, Settings2, Plus, DownloadCloud } from 'lucide-react';
import adminService from '../../services/admin.service';
import AdminArchiveEditModal from '../../components/admin/AdminArchiveEditModal';

export default function AdminArchivePage() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingYear, setTogglingYear] = useState(null);
  const [ingesting, setIngesting] = useState(false);

  // Create Snapshot Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [newIsPublished, setNewIsPublished] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState({ type: '', text: '' });

  // Edit Region Details Modal State
  const [editYear, setEditYear] = useState(null);
  const [editRegions, setEditRegions] = useState([]);
  const [editNations, setEditNations] = useState([]);
  const [loadingSnapshotData, setLoadingSnapshotData] = useState(false);

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

  async function handleOpenEditModal(year) {
    try {
      setLoadingSnapshotData(true);
      const res = await adminService.getSnapshotDataForAdmin(year);
      if (res.success && res.data) {
        setEditYear(year);
        setEditRegions(res.data.regions || []);
        setEditNations(res.data.nations || []);
      } else {
        alert(`Could not load region list for Year ${year}`);
      }
    } catch (err) {
      alert(`Failed to fetch snapshot data: ${err.message}`);
    } finally {
      setLoadingSnapshotData(false);
    }
  }

  async function handleIngestDefaults() {
    if (!window.confirm('Ingest all default simulation snapshot files from engine into database?')) return;

    try {
      setIngesting(true);
      const res = await adminService.ingestDefaultSnapshots();
      if (res.success) {
        alert(res.data.message || 'Ingestion completed successfully.');
        fetchSnapshots();
      } else {
        alert(`Ingestion failed: ${res.error}`);
      }
    } catch (err) {
      alert(`Ingestion error: ${err.message}`);
    } finally {
      setIngesting(false);
    }
  }

  async function handleCreateSnapshot(e) {
    e.preventDefault();
    setCreateMsg({ type: '', text: '' });
    setCreating(true);

    try {
      const yearNum = parseInt(newYear, 10);
      if (isNaN(yearNum) || yearNum < 0) {
        setCreateMsg({ type: 'error', text: 'Please enter a valid positive year number.' });
        setCreating(false);
        return;
      }

      const res = await adminService.createArchiveSnapshot({
        year: yearNum,
        is_published: newIsPublished,
      });

      if (res.success) {
        setCreateMsg({ type: 'success', text: res.data.message || 'Snapshot created!' });
        setTimeout(() => {
          setIsCreateOpen(false);
          setNewYear('');
          setNewIsPublished(false);
          setCreateMsg({ type: '', text: '' });
          fetchSnapshots();
        }, 1000);
      } else {
        setCreateMsg({ type: 'error', text: res.error || 'Failed to create snapshot.' });
      }
    } catch (err) {
      setCreateMsg({ type: 'error', text: err.message || 'Failed to create snapshot.' });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">
            Archive Snapshot Management
          </h1>
          <p className="text-sm text-ink/60 mt-1">
            Create, publish, and edit dynamic region details for simulation year snapshots.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={ingesting}
            onClick={handleIngestDefaults}
            className="w-full sm:w-auto px-4 py-2 bg-paper border border-rule text-ink text-xs font-semibold rounded-lg hover:bg-black/5 transition-colors flex items-center justify-center gap-2"
          >
            {ingesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
            <span>Ingest Engine Snapshots</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewYear('');
              setNewIsPublished(false);
              setCreateMsg({ type: '', text: '' });
              setIsCreateOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Snapshot</span>
          </button>
        </div>
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
          <div className="p-8 text-center text-sm text-ink/50 space-y-3">
            <p>No archive snapshots found in database.</p>
            <button
              type="button"
              onClick={handleIngestDefaults}
              className="px-4 py-2 bg-black text-white text-xs font-medium rounded-lg inline-flex items-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              Ingest Default Engine Snapshots
            </button>
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
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
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
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(snap.year)}
                          className="px-3 py-1 text-xs font-medium rounded border border-rule hover:bg-black/5 text-ink transition-colors flex items-center gap-1.5"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>Edit Region Details</span>
                        </button>

                        <button
                          type="button"
                          disabled={togglingYear === snap.year}
                          onClick={() => handleTogglePublish(snap.year)}
                          className={`px-3 py-1 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 ${
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE SNAPSHOT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-paper border border-rule rounded-xl shadow-2xl p-6 text-ink">
            <h3 className="text-xl font-display font-bold text-ink">
              Create Archive Snapshot
            </h3>
            <p className="text-xs text-ink/60 mt-1">
              Add a new simulation year snapshot record to the archive database.
            </p>

            {createMsg.text && (
              <div
                className={`mt-4 p-3 rounded text-xs border ${
                  createMsg.type === 'error'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {createMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateSnapshot} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
                  Simulation Year Number
                </label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="e.g. 1924"
                  required
                  min={0}
                  max={9999}
                  className="w-full px-4 py-2 border border-rule rounded bg-paper text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is-published-chk"
                  checked={newIsPublished}
                  onChange={(e) => setNewIsPublished(e.target.checked)}
                  className="rounded border-rule text-black focus:ring-black h-4 w-4"
                />
                <label htmlFor="is-published-chk" className="text-xs font-medium text-ink cursor-pointer">
                  Publish immediately (Visible to subscribers)
                </label>
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
                  Create Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Region Details Modal */}
      {editYear !== null && (
        <AdminArchiveEditModal
          isOpen={editYear !== null}
          onClose={() => setEditYear(null)}
          year={editYear}
          regions={editRegions}
          nations={editNations}
        />
      )}
    </div>
  );
}
