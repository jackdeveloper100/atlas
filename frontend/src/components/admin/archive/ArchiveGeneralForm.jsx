import React, { useState } from 'react';
import adminService from '../../../services/admin.service';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { useToast } from '../../ui/Toast';

export function ArchiveGeneralForm({ year, yearData, onUpdate }) {
  const { addToast } = useToast();
  const [title, setTitle] = useState(yearData?.year?.title || `Year ${year}`);
  const [subtitle, setSubtitle] = useState(yearData?.year?.subtitle || '');
  const [description, setDescription] = useState(yearData?.year?.description || '');
  const [status, setStatus] = useState(yearData?.year?.status || 'draft');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await adminService.updateArchiveYear(year, {
        title,
        subtitle,
        description,
        status,
      });

      if (res.success) {
        addToast('Year general settings updated.', 'success');
        if (onUpdate) onUpdate();
      } else {
        addToast(res.error || 'Failed to update settings.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl bg-paper p-6 rounded-card border border-rule">
      <h3 className="text-lg font-bold font-display text-ink">General Metadata</h3>

      <div>
        <label className="block text-xs font-semibold uppercase text-ink/60 mb-1">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-ink/60 mb-1">Subtitle</label>
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. The Second Expansion" />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-ink/60 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full text-xs font-sans p-2 bg-paper border border-rule rounded focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-ink/60 mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full text-xs font-mono p-2 bg-paper border border-rule rounded"
        >
          <option value="draft">Draft (Admin Preview only)</option>
          <option value="published">Published (Live to Subscribers)</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={saving}>
          Save General Settings
        </Button>
      </div>
    </form>
  );
}

export default ArchiveGeneralForm;
