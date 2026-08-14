/**
 * AdminArchiveYearsPage.jsx
 *
 * Premium Admin CMS view for simulation archive years.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Settings,
  Trash2,
  Archive,
  RefreshCw,
  Search,
  Layers,
  Globe2,
  Clock,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';

export default function AdminArchiveYearsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Duplicate Modal State
  const [dupSourceYear, setDupSourceYear] = useState(null);
  const [dupTargetYear, setDupTargetYear] = useState('');
  const [duplicating, setDuplicating] = useState(false);

  // Delete Confirm State
  const [deleteYear, setDeleteYear] = useState(null);

  useEffect(() => {
    fetchYears();
  }, []);

  async function fetchYears() {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.listArchiveYears();
      if (res.success) {
        setYears(res.data.years || []);
      } else {
        setError(res.error || 'Failed to fetch archive years.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to API.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateYear(e) {
    e.preventDefault();
    const yearNum = parseInt(newYear, 10);
    if (isNaN(yearNum) || yearNum < 0) {
      addToast('Please enter a valid positive year number.', 'error');
      return;
    }

    try {
      setCreating(true);
      const res = await adminService.createArchiveYear({
        year: yearNum,
        title: newTitle.trim() || `Year ${yearNum}`,
        is_published: false,
      });

      if (res.success) {
        addToast(`Year ${yearNum} created successfully.`, 'success');
        setIsCreateOpen(false);
        setNewYear('');
        setNewTitle('');
        fetchYears();
      } else {
        addToast(res.error || 'Failed to create year.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to create year.', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDuplicateYear() {
    const target = parseInt(dupTargetYear, 10);
    if (isNaN(target) || target < 0) {
      addToast('Enter a valid target year number.', 'error');
      return;
    }

    try {
      setDuplicating(true);
      const res = await adminService.duplicateArchiveYear(dupSourceYear, target);
      if (res.success) {
        addToast(`Duplicated Year ${dupSourceYear} to Year ${target}.`, 'success');
        setDupSourceYear(null);
        setDupTargetYear('');
        fetchYears();
      } else {
        addToast(res.error || 'Failed to duplicate year.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to duplicate year.', 'error');
    } finally {
      setDuplicating(false);
    }
  }

  async function handleStatusChange(year, action) {
    try {
      let res;
      if (action === 'publish') res = await adminService.publishArchiveYear(year);
      else if (action === 'unpublish') res = await adminService.unpublishArchiveYear(year);
      else if (action === 'archive') res = await adminService.archiveArchiveYear(year);

      if (res.success) {
        addToast(`Year ${year} set to ${action}ed.`, 'success');
        fetchYears();
      } else {
        addToast(res.error || `Failed to ${action} year.`, 'error');
      }
    } catch (err) {
      addToast(err.message || `Failed to ${action} year.`, 'error');
    }
  }

  async function handleDeleteYear() {
    if (!deleteYear) return;
    try {
      const res = await adminService.deleteArchiveYear(deleteYear);
      if (res.success) {
        addToast(`Year ${deleteYear} deleted.`, 'success');
        fetchYears();
      } else {
        addToast(res.error || 'Failed to delete year.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete year.', 'error');
    }
  }

  // Summary Metrics
  const stats = useMemo(() => {
    const total = years.length;
    const published = years.filter((y) => y.status === 'published' || y.is_published).length;
    const drafts = years.filter((y) => (y.status || 'draft') === 'draft' && !y.is_published).length;
    return { total, published, drafts };
  }, [years]);

  // Filtered Years
  const filteredYears = useMemo(() => {
    return years.filter((y) => {
      const titleMatch = (y.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const yearMatch = String(y.year).includes(searchQuery);
      const matchesSearch = titleMatch || yearMatch;

      const st = y.status || (y.is_published ? 'published' : 'draft');
      const matchesStatus = statusFilter === 'all' || st === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [years, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">Archive Years CMS</h1>
          <p className="text-xs sm:text-sm text-ink/60 mt-1">
            Build and manage full relational simulation years, nations, regions, leaders, events, and custom metrics.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="self-start md:self-auto shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Create Archive Year
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-paper p-4 rounded-xl border border-rule shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-ground border border-rule flex items-center justify-center text-ink">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-ink/50 font-bold">Total Configured Years</div>
            <div className="text-xl font-bold font-mono text-ink mt-0.5">{stats.total}</div>
          </div>
        </div>

        <div className="bg-paper p-4 rounded-xl border border-rule shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-ink/50 font-bold">Published Timelines</div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{stats.published}</div>
          </div>
        </div>

        <div className="bg-paper p-4 rounded-xl border border-rule shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-ink/50 font-bold">Drafts in Progress</div>
            <div className="text-xl font-bold font-mono text-amber-700 mt-0.5">{stats.drafts}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-paper p-3 rounded-xl border border-rule shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search year or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={Search}
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'published', 'draft', 'archived'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-black text-white shadow-2xs'
                  : 'bg-ground text-ink/70 hover:bg-paper hover:text-ink border border-rule'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">{error}</div>}

      {/* Table Container */}
      <div className="bg-paper border border-rule rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-ink/50 animate-pulse">Loading archive years...</div>
        ) : filteredYears.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink/50 space-y-3">
            <p>No matching archive years found.</p>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create Year
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule bg-ground/50 text-[11px] font-mono uppercase tracking-wider text-ink/50">
                  <th className="py-3 px-4 font-bold">Year</th>
                  <th className="py-3 px-4 font-bold">Title</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Published Date</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/60">
                {filteredYears.map((y) => {
                  const status = y.status || (y.is_published ? 'published' : 'draft');
                  return (
                    <tr key={y.year} className="hover:bg-ground/40 transition-colors group">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-sm font-bold bg-ground border border-rule px-2.5 py-1 rounded-md text-ink">
                          Year {y.year}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-ink">
                        {y.title || `Year ${y.year}`}
                      </td>
                      <td className="py-3.5 px-4">
                        {status === 'published' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </span>
                        ) : status === 'archived' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/30">
                            <Archive className="w-3 h-3" /> Archived
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-600 border border-gray-500/30">
                            <XCircle className="w-3 h-3" /> Draft
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-ink/60">
                        {y.published_at ? new Date(y.published_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/admin/archive/years/${y.year}`)}
                          >
                            <Settings className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>

                          <a
                            href={`/archive/${y.year}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-ground border border-rule text-ink/70 hover:text-ink transition-colors"
                            title="Preview Public Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setDupSourceYear(y.year);
                              setDupTargetYear(String(y.year + 1));
                            }}
                            className="p-2 rounded-lg hover:bg-ground border border-rule text-ink/70 hover:text-ink transition-colors"
                            title="Duplicate Year"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {status === 'published' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(y.year, 'unpublish')}
                            >
                              Unpublish
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(y.year, 'publish')}
                            >
                              Publish
                            </Button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteYear(y.year)}
                            className="p-2 rounded-lg hover:bg-rose-50 border border-rule text-rose-600 hover:border-rose-300 transition-colors"
                            title="Delete Year"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* CREATE YEAR MODAL VIA PORTAL */}
      {isCreateOpen &&
        createPortal(
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
            <div className="w-full max-w-md bg-paper border border-rule rounded-2xl shadow-2xl p-6 text-ink space-y-4">
              <div>
                <h3 className="text-xl font-display font-bold text-ink">Create Archive Year</h3>
                <p className="text-xs text-ink/60 mt-1">Configure a new simulation year for relational timeline scrubbers.</p>
              </div>

              <form onSubmit={handleCreateYear} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1">Year Number</label>
                  <Input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="e.g. 1924"
                    required
                    min={0}
                    max={9999}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1">Title</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Year 12 — The Age of Concord"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-rule">
                  <Button variant="ghost" type="button" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />}
                    Create Year
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* DUPLICATE MODAL VIA PORTAL */}
      {dupSourceYear !== null &&
        createPortal(
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
            <div className="w-full max-w-md bg-paper border border-rule rounded-2xl shadow-2xl p-6 text-ink space-y-4">
              <div>
                <h3 className="text-xl font-display font-bold text-ink">Duplicate Year {dupSourceYear}</h3>
                <p className="text-xs text-ink/60 mt-1">
                  Copies all nations, regions, leaders, events, modal tabs, entity details, and metrics into a new year.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1">Target Year Number</label>
                  <Input
                    type="number"
                    value={dupTargetYear}
                    onChange={(e) => setDupTargetYear(e.target.value)}
                    placeholder="e.g. 13"
                    min={0}
                    max={9999}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-rule">
                  <Button variant="ghost" onClick={() => setDupSourceYear(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleDuplicateYear} disabled={duplicating}>
                    {duplicating && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />}
                    Duplicate Year
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        isOpen={deleteYear !== null}
        onClose={() => setDeleteYear(null)}
        onConfirm={handleDeleteYear}
        title={`Delete Year ${deleteYear}?`}
        message="Are you sure you want to permanently delete this archive year and all associated nations, regions, leaders, events, and metrics?"
        confirmText="Delete Year"
        variant="danger"
      />
    </div>
  );
}
