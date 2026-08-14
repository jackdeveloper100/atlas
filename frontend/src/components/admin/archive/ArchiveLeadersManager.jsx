import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import adminService from '../../../services/admin.service';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import MoveUpDownControls from '../../ui/MoveUpDownControls';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { useToast } from '../../ui/Toast';

export function ArchiveLeadersManager({ year, leaders = [], nations = [], onUpdate, onEditEntityDetails }) {
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [nationId, setNationId] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [biography, setBiography] = useState('');

  const nationMap = React.useMemo(() => {
    const map = {};
    nations.forEach((n) => { map[n.id] = n.name; });
    return map;
  }, [nations]);

  const openCreate = () => {
    setEditingLeader(null);
    setName('');
    setTitle('Monarch');
    setNationId(nations[0]?.id || '');
    setBirthYear('');
    setBiography('');
    setIsModalOpen(true);
  };

  const openEdit = (l) => {
    setEditingLeader(l);
    setName(l.name || '');
    setTitle(l.title || '');
    setNationId(l.nationId || '');
    setBirthYear(l.birthYear || '');
    setBiography(l.biography || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      title,
      nationId: nationId || null,
      birthYear: birthYear ? Number(birthYear) : null,
      biography: biography || null,
    };

    try {
      let res;
      if (editingLeader) {
        res = await adminService.updateLeader(year, editingLeader.id, payload);
      } else {
        res = await adminService.createLeader(year, payload);
      }

      if (res.success) {
        addToast(editingLeader ? 'Leader updated.' : 'Leader created.', 'success');
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
      const res = await adminService.deleteLeader(year, deleteId);
      if (res.success) {
        addToast('Leader deleted.', 'success');
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
    if (targetIdx < 0 || targetIdx >= leaders.length) return;
    const reordered = [...leaders];
    const temp = reordered[idx];
    reordered[idx] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const ids = reordered.map((l) => l.id);
    await adminService.reorderEntities(year, 'leaders', ids);
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold font-display text-ink">Leaders ({leaders.length})</h3>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Add Leader
        </Button>
      </div>

      <div className="bg-paper border border-rule rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-rule bg-ground/40 text-xs uppercase text-ink/50">
              <th className="py-3 px-4">Order</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Nation</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/50">
            {leaders.map((l, idx) => (
              <tr key={l.id} className="hover:bg-ground/30">
                <td className="py-3 px-4">
                  <MoveUpDownControls
                    isFirst={idx === 0}
                    isLast={idx === leaders.length - 1}
                    onMoveUp={() => handleReorder(idx, -1)}
                    onMoveDown={() => handleReorder(idx, 1)}
                  />
                </td>
                <td className="py-3 px-4 font-serif font-bold text-ink">{l.name}</td>
                <td className="py-3 px-4 text-xs font-mono">{l.title}</td>
                <td className="py-3 px-4 text-xs font-mono">{nationMap[l.nationId] || 'Sovereign'}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEditEntityDetails && onEditEntityDetails('leader', l)}>
                      Metrics & Details
                    </Button>
                    <button onClick={() => openEdit(l)} className="p-1 hover:bg-ground rounded text-ink/70">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(l.id)} className="p-1 hover:bg-rose-50 rounded text-rose-600">
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
            <div className="w-full max-w-md bg-paper border border-rule rounded-2xl p-6 text-ink shadow-2xl space-y-4">
              <h3 className="text-xl font-bold font-display">{editingLeader ? 'Edit Leader' : 'Add Leader'}</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Leader Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Title / Office</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sovereign Emperor" />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Nation</label>
                  <select
                    value={nationId}
                    onChange={(e) => setNationId(e.target.value)}
                    className="w-full text-xs font-sans p-2 bg-paper border border-rule rounded"
                  >
                    <option value="">(Independent Sovereign)</option>
                    {nations.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Birth Year</label>
                  <Input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Biography</label>
                  <textarea
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    rows={3}
                    className="w-full text-xs font-sans p-2 bg-paper border border-rule rounded"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-2 border-t border-rule">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Leader</Button>
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
        title="Delete Leader?"
        message="Are you sure you want to delete this leader?"
      />
    </div>
  );
}

export default ArchiveLeadersManager;
