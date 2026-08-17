/**
 * AdminLibraryPage.jsx
 *
 * Full CRUD administration CMS view for Audio & Video Library items (/admin/library).
 * Aligned with Figma reference designs & prompt specifications.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Radio,
  Plus,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  Clock,
  Video,
  Headphones,
  RefreshCw,
  Upload,
  Link2,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';

const CATEGORIES = ['Overview', 'Political', 'Economy', 'Health', 'Law'];

export default function AdminLibraryPage() {
  const { addToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Political');
  const [itemType, setItemType] = useState('audio');
  const [audioUrl, setAudioUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(300);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    fetchLibraryItems();
  }, []);

  async function fetchLibraryItems() {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getLibraryItems();
      if (res.success) {
        setItems(res.data.items || []);
      } else {
        setError(res.error || 'Failed to fetch library items.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to API.');
    } finally {
      setLoading(false);
    }
  }

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedStoragePath, setUploadedStoragePath] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setSubtitle('');
    setDescription('');
    setCategory('Political');
    setItemType('audio');
    setAudioUrl('');
    setCoverImageUrl('');
    setDurationSeconds(300);
    setIsPublished(false);
    setUploadedStoragePath('');
    setUploadedFileName('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    const meta = item.metadata || {};
    setEditingItem(item);
    setTitle(item.title || '');
    setSubtitle(meta.subtitle || '');
    setDescription(item.description || '');
    setCategory(meta.category || 'Political');
    setItemType(item.item_type || 'audio');
    setAudioUrl(meta.audio_url || '');
    setCoverImageUrl(meta.cover_image_url || '');
    setDurationSeconds(item.duration_seconds || 0);
    setIsPublished(item.is_published || false);
    setUploadedStoragePath(item.storage_path || '');
    // Only surface an "uploaded file" indicator when the item is actually
    // storage-driven (no URL override) — that mirrors what the backend's
    // stream-url resolver will actually serve to the frontend.
    setUploadedFileName(!meta.audio_url && item.storage_path ? item.storage_path.split('/').pop() : '');
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const expectedPrefix = `${itemType}/`;
    if (!file.type || !file.type.startsWith(expectedPrefix)) {
      addToast(`Please select a ${itemType} file that matches the selected Media Type.`, 'error');
      e.target.value = '';
      return;
    }

    try {
      setUploadingFile(true);
      addToast(`Uploading ${file.name} to media storage...`, 'info');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('item_type', itemType);

      const res = await adminService.uploadLibraryMedia(formData);
      if (res.success && res.data.storage_path) {
        setUploadedStoragePath(res.data.storage_path);
        setUploadedFileName(file.name);
        // Uploaded file and typed URL are mutually exclusive ("Or" in the
        // form) — the backend always prefers a non-empty audio_url, so a
        // stale URL left in this field would silently shadow the new upload.
        setAudioUrl('');
        addToast(`Uploaded ${file.name} to media storage!`, 'success');
      } else {
        addToast(res.error || 'Failed to upload media file.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'File upload failed.', 'error');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Title is required.', 'error');
      return;
    }

    const autoStoragePath = uploadedStoragePath || editingItem?.storage_path || `library/media-${Date.now()}.${itemType === 'video' ? 'mp4' : 'mp3'}`;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      item_type: itemType,
      storage_path: autoStoragePath,
      duration_seconds: durationSeconds ? Number(durationSeconds) : 0,
      is_published: isPublished,
      metadata: {
        category,
        subtitle: subtitle.trim(),
        cover_image_url: coverImageUrl.trim(),
        audio_url: audioUrl.trim(),
      },
    };

    try {
      setSubmitting(true);
      let res;
      if (editingItem) {
        res = await adminService.updateLibraryItem(editingItem.id, payload);
      } else {
        res = await adminService.createLibraryItem(payload);
      }

      if (res.success) {
        addToast(editingItem ? 'Track updated.' : 'Track created successfully.', 'success');
        setIsModalOpen(false);
        fetchLibraryItems();
      } else {
        addToast(res.error || 'Failed to save media item.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to save media item.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  async function handleTogglePublish(id) {
    try {
      setTogglingId(id);
      const res = await adminService.toggleLibraryPublish(id);
      if (res.success) {
        addToast('Publication status updated.', 'success');
        fetchLibraryItems();
      } else {
        addToast(res.error || 'Failed to update publish state.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to toggle publication state.', 'error');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDeleteItem() {
    if (!deleteId) return;
    try {
      const res = await adminService.deleteLibraryItem(deleteId);
      if (res.success) {
        addToast('Media item deleted.', 'success');
        fetchLibraryItems();
      } else {
        addToast(res.error || 'Delete failed.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Delete failed.', 'error');
    }
  }

  // Summary Metrics
  const stats = useMemo(() => {
    const total = items.length;
    const published = items.filter((i) => i.is_published).length;
    const drafts = items.filter((i) => !i.is_published).length;
    const videos = items.filter((i) => i.item_type === 'video').length;
    return { total, published, drafts, videos };
  }, [items]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const meta = item.metadata || {};
      const titleMatch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = titleMatch || descMatch;

      const itemCat = meta.category || 'Political';
      const matchesCategory = selectedCategory === 'all' || itemCat === selectedCategory;

      const isPub = item.is_published;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && isPub) ||
        (statusFilter === 'draft' && !isPub);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">Audio & Video Library CMS</h1>
          <p className="text-xs sm:text-sm text-ink/60 mt-1">
            Create, edit, and publish subscriber audio narratives and video recordings for ATLAS main subscribers.
          </p>
        </div>

        <Button onClick={openCreateModal} className="self-start md:self-auto shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Create Media Item
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-paper p-4 rounded-xl border border-rule shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-ground border border-rule flex items-center justify-center text-ink">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-ink/50 font-bold">Total Items</div>
            <div className="text-xl font-bold font-mono text-ink mt-0.5">{stats.total}</div>
          </div>
        </div>

        <div className="bg-paper p-4 rounded-xl border border-rule shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-ink/50 font-bold">Published</div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{stats.published}</div>
          </div>
        </div>

        <div className="bg-paper p-4 rounded-xl border border-rule shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-ink/50 font-bold">Drafts</div>
            <div className="text-xl font-bold font-mono text-amber-700 mt-0.5">{stats.drafts}</div>
          </div>
        </div>

        <div className="bg-paper p-4 rounded-xl border border-rule shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-700">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-ink/50 font-bold">Video Tracks</div>
            <div className="text-xl font-bold font-mono text-blue-700 mt-0.5">{stats.videos}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-paper p-3 rounded-xl border border-rule shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={Search}
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-ground text-ink/70 hover:bg-paper hover:text-ink border border-rule'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-black text-white shadow-2xs'
                  : 'bg-ground text-ink/70 hover:bg-paper hover:text-ink border border-rule'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">{error}</div>}

      {/* Data Table */}
      <div className="bg-paper border border-rule rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-ink/50 animate-pulse">Loading library items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink/50 space-y-3">
            <p>No media items match your search or filter.</p>
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-1" /> Create Media Item
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule bg-ground/50 text-[11px] font-mono uppercase tracking-wider text-ink/50">
                  <th className="py-3 px-4 font-bold">Item</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Duration</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/60">
                {filteredItems.map((item) => {
                  const meta = item.metadata || {};
                  const durationFmt = item.duration_seconds
                    ? `${Math.floor(item.duration_seconds / 60)}m ${item.duration_seconds % 60}s`
                    : '0m';

                  return (
                    <tr key={item.id} className="hover:bg-ground/40 transition-colors">
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-ground border border-rule flex items-center justify-center shrink-0 text-ink/70">
                            {meta.cover_image_url ? (
                              <img
                                src={meta.cover_image_url}
                                alt={item.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : item.item_type === 'video' ? (
                              <Video className="w-5 h-5 text-ink/60" />
                            ) : (
                              <Headphones className="w-5 h-5 text-ink/60" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-sans font-bold text-ink truncate">{item.title}</div>
                            {item.description && (
                              <div className="text-xs text-ink/60 line-clamp-1 mt-0.5">{item.description}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-ground border border-rule text-ink">
                          {meta.category || 'Political'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-black/5 text-ink border border-rule">
                          {item.item_type === 'video' ? 'VIDEO RECORD' : 'AUDIO RECORD'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-ink/70">{durationFmt}</td>

                      <td className="py-3.5 px-4">
                        {item.is_published ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-600 border border-gray-500/30">
                            <XCircle className="w-3 h-3" /> Draft
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button variant="secondary" size="sm" onClick={() => openEditModal(item)}>
                            <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>

                          <a
                            href={`/library/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-ground border border-rule text-ink/70 hover:text-ink transition-colors"
                            title="Preview Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={togglingId === item.id}
                            onClick={() => handleTogglePublish(item.id)}
                          >
                            {togglingId === item.id && <RefreshCw className="w-3 h-3 animate-spin mr-1" />}
                            {item.is_published ? 'Unpublish' : 'Publish'}
                          </Button>

                          <button
                            type="button"
                            onClick={() => setDeleteId(item.id)}
                            className="p-2 rounded-lg hover:bg-rose-50 border border-rule text-rose-600 hover:border-rose-300 transition-colors"
                            title="Delete Item"
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

      {/* CREATE / EDIT MODAL VIA PORTAL */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-paper border border-rule rounded-2xl shadow-2xl p-6 text-ink space-y-4 max-h-[90vh] overflow-y-auto">
              <div>
                <h3 className="text-xl font-display font-bold text-ink">
                  {editingItem ? 'Edit Media Item' : 'Create Media Item'}
                </h3>
                <p className="text-xs text-ink/60 mt-1">Configure metadata and media playback links for main subscribers.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Great Awakening (Year 100)" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs font-sans p-2.5 bg-paper border border-rule rounded-lg text-ink"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1">Media Type</label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 bg-paper border border-rule rounded-lg text-ink uppercase"
                    >
                      <option value="audio">Audio Record</option>
                      <option value="video">Video Record</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Provide an overview of cultural developments..."
                    className="w-full text-xs font-sans p-2.5 bg-paper border border-rule rounded-lg text-ink"
                  />
                </div>

                {/* Direct Media Stream URL or File Upload */}
                <div className="space-y-3 bg-ground/50 p-3 rounded-xl border border-rule">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-ink/70 mb-1 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-ink" /> Audio / Video Stream URL (or YouTube URL)
                    </label>
                    <Input
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="https://youtu.be/D0UnqGm_miA or audio stream URL"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-mono font-bold uppercase text-ink/70 mb-1 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-ink" /> Or Upload Media File
                      {uploadingFile && (
                        <span className="inline-flex items-center text-xs text-blue-600 font-normal ml-auto">
                          <RefreshCw className="w-3 h-3 animate-spin mr-1" /> Uploading to storage...
                        </span>
                      )}
                    </label>
                    <input
                      type="file"
                      accept={itemType === 'video' ? 'video/*' : 'audio/*'}
                      disabled={uploadingFile}
                      onChange={handleFileUpload}
                      className="w-full text-xs font-sans p-1.5 bg-paper border border-rule rounded-lg text-ink file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-neutral-800 cursor-pointer disabled:opacity-50"
                    />
                    {uploadedFileName && !audioUrl && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Using uploaded file: {uploadedFileName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1">Duration (Seconds)</label>
                    <Input
                      type="number"
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(e.target.value)}
                      placeholder="e.g. 0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1">Cover Artwork URL (Optional)</label>
                    <Input
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="p-3 bg-ground/60 border border-rule rounded-xl flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-ink/70">Publish Immediately</span>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded border-rule accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-rule">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || uploadingFile}>
                    {(submitting || uploadingFile) && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />}
                    {uploadingFile ? 'Uploading Media...' : editingItem ? 'Save Changes' : 'Create Media Item'}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteItem}
        title="Delete Media Item?"
        message="Are you sure you want to permanently delete this media item?"
        confirmText="Delete Item"
        variant="danger"
      />
    </div>
  );
}
