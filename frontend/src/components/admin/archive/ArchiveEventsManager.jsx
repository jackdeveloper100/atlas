import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import adminService from '../../../services/admin.service';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import MoveUpDownControls from '../../ui/MoveUpDownControls';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { useToast } from '../../ui/Toast';

export function ArchiveEventsManager({ year, events = [], nations = [], regions = [], onUpdate }) {
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('HISTORICAL_EVENT');
  const [badgeLabel, setBadgeLabel] = useState('Event');
  const [badgeColor, setBadgeColor] = useState('#3b82f6');
  const [quarter, setQuarter] = useState(1);
  const [selectedNationIds, setSelectedNationIds] = useState([]);
  const [selectedRegionIds, setSelectedRegionIds] = useState([]);

  const openCreate = () => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setEventType('HISTORICAL_EVENT');
    setBadgeLabel('Event');
    setBadgeColor('#3b82f6');
    setQuarter(1);
    setSelectedNationIds([]);
    setSelectedRegionIds([]);
    setIsModalOpen(true);
  };

  const openEdit = (e) => {
    setEditingEvent(e);
    setTitle(e.title || '');
    setDescription(e.description || '');
    setEventType(e.eventType || 'HISTORICAL_EVENT');
    setBadgeLabel(e.badgeLabel || 'Event');
    setBadgeColor(e.badgeColor || '#3b82f6');
    setQuarter(e.quarter || 1);
    setSelectedNationIds(e.nationIds || []);
    setSelectedRegionIds(e.regionIds || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const payload = {
      title,
      description,
      eventType,
      badgeLabel,
      badgeColor,
      quarter: Number(quarter),
      nationIds: selectedNationIds,
      regionIds: selectedRegionIds,
    };

    try {
      let res;
      if (editingEvent) {
        res = await adminService.updateEvent(year, editingEvent.id, payload);
      } else {
        res = await adminService.createEvent(year, payload);
      }

      if (res.success) {
        addToast(editingEvent ? 'Event updated.' : 'Event created.', 'success');
        setIsModalOpen(false);
        if (onUpdate) onUpdate();
      } else {
        addToast(res.error || 'Operation failed.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Operation failed.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await adminService.deleteEvent(year, deleteId);
      if (res.success) {
        addToast('Event deleted.', 'success');
        if (onUpdate) onUpdate();
      } else {
        addToast(res.error || 'Delete failed.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Delete failed.', 'error');
    }
  };

  const handleReorder = async (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= events.length) return;
    const reordered = [...events];
    const temp = reordered[idx];
    reordered[idx] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const ids = reordered.map((e) => e.id);
    await adminService.reorderEntities(year, 'events', ids);
    if (onUpdate) onUpdate();
  };

  const toggleNationSelect = (nid) => {
    setSelectedNationIds((prev) =>
      prev.includes(nid) ? prev.filter((id) => id !== nid) : [...prev, nid]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold font-display text-ink">Events ({events.length})</h3>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Add Event
        </Button>
      </div>

      <div className="bg-paper border border-rule rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-rule bg-ground/40 text-xs uppercase text-ink/50">
              <th className="py-3 px-4">Order</th>
              <th className="py-3 px-4">Badge</th>
              <th className="py-3 px-4">Title / Type</th>
              <th className="py-3 px-4">Quarter</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/50">
            {events.map((e, idx) => (
              <tr key={e.id} className="hover:bg-ground/30">
                <td className="py-3 px-4">
                  <MoveUpDownControls
                    isFirst={idx === 0}
                    isLast={idx === events.length - 1}
                    onMoveUp={() => handleReorder(idx, -1)}
                    onMoveDown={() => handleReorder(idx, 1)}
                  />
                </td>
                <td className="py-3 px-4">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold text-white uppercase"
                    style={{ backgroundColor: e.badgeColor || '#3b82f6' }}
                  >
                    {e.badgeLabel || e.eventType}
                  </span>
                </td>
                <td className="py-3 px-4 font-sans font-bold text-ink">
                  <div>{e.title}</div>
                  <div className="text-xs font-normal text-ink/60 line-clamp-1">{e.description}</div>
                </td>
                <td className="py-3 px-4 text-xs font-mono">Q{e.quarter}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(e)} className="p-1 hover:bg-ground rounded text-ink/70">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(e.id)} className="p-1 hover:bg-rose-50 rounded text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-paper border border-rule rounded-2xl p-6 text-ink shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold font-display">{editingEvent ? 'Edit Event' : 'Add Event'}</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full text-xs font-sans p-2 bg-paper border border-rule rounded"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Badge Label</label>
                    <Input value={badgeLabel} onChange={(e) => setBadgeLabel(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Badge Color (Hex)</label>
                    <Input value={badgeColor} onChange={(e) => setBadgeColor(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Quarter (1-4)</label>
                    <Input type="number" value={quarter} onChange={(e) => setQuarter(e.target.value)} min={1} max={4} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Related Nations (Multi-select)</label>
                  <div className="flex flex-wrap gap-2 p-2 bg-ground/50 rounded border border-rule max-h-28 overflow-y-auto">
                    {nations.map((n) => {
                      const isSel = selectedNationIds.includes(n.id);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => toggleNationSelect(n.id)}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            isSel ? 'bg-black text-white border-black' : 'bg-paper text-ink border-rule'
                          }`}
                        >
                          {n.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-rule">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Event</Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Event?"
        message="Are you sure you want to delete this event?"
      />
    </div>
  );
}

export default ArchiveEventsManager;
