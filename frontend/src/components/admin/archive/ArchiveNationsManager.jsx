import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import adminService from '../../../services/admin.service';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import MoveUpDownControls from '../../ui/MoveUpDownControls';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { useToast } from '../../ui/Toast';

export function ArchiveNationsManager({ year, nations = [], onUpdate, onEditEntityDetails }) {
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNation, setEditingNation] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [population, setPopulation] = useState(0);
  const [governmentType, setGovernmentType] = useState('Monarchy');
  const [foundedYear, setFoundedYear] = useState(0);

  const openCreate = () => {
    setEditingNation(null);
    setName('');
    setShortName('');
    setColor('#3b82f6');
    setPopulation(0);
    setGovernmentType('Monarchy');
    setFoundedYear(0);
    setIsModalOpen(true);
  };

  const openEdit = (n) => {
    setEditingNation(n);
    setName(n.name || '');
    setShortName(n.shortName || n.name || '');
    setColor(n.color || '#3b82f6');
    setPopulation(n.population || 0);
    setGovernmentType(n.governmentType || 'Monarchy');
    setFoundedYear(n.foundedYear || 0);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      shortName,
      color,
      population: Number(population),
      governmentType,
      foundedYear: Number(foundedYear),
    };

    try {
      let res;
      if (editingNation) {
        res = await adminService.updateNation(year, editingNation.id, payload);
      } else {
        res = await adminService.createNation(year, payload);
      }

      if (res.success) {
        addToast(editingNation ? 'Nation updated.' : 'Nation created.', 'success');
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
      const res = await adminService.deleteNation(year, deleteId);
      if (res.success) {
        addToast('Nation deleted.', 'success');
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
    if (targetIdx < 0 || targetIdx >= nations.length) return;
    const reordered = [...nations];
    const temp = reordered[idx];
    reordered[idx] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const ids = reordered.map((n) => n.id);
    await adminService.reorderEntities(year, 'nations', ids);
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold font-display text-ink">Nations ({nations.length})</h3>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Add Nation
        </Button>
      </div>

      <div className="bg-paper border border-rule rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-rule bg-ground/40 text-xs uppercase text-ink/50">
              <th className="py-3 px-4">Order</th>
              <th className="py-3 px-4">Color</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Government</th>
              <th className="py-3 px-4 text-right">Population</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/50">
            {nations.map((n, idx) => (
              <tr key={n.id} className="hover:bg-ground/30">
                <td className="py-3 px-4">
                  <MoveUpDownControls
                    isFirst={idx === 0}
                    isLast={idx === nations.length - 1}
                    onMoveUp={() => handleReorder(idx, -1)}
                    onMoveDown={() => handleReorder(idx, 1)}
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="w-5 h-5 rounded border border-rule" style={{ backgroundColor: n.color }} />
                </td>
                <td className="py-3 px-4 font-serif font-bold text-ink">{n.name}</td>
                <td className="py-3 px-4 text-xs font-mono">{n.governmentType}</td>
                <td className="py-3 px-4 text-right font-mono">{n.population?.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEditEntityDetails && onEditEntityDetails('nation', n)}>
                      Metrics & Details
                    </Button>
                    <button onClick={() => openEdit(n)} className="p-1 hover:bg-ground rounded text-ink/70">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(n.id)} className="p-1 hover:bg-rose-50 rounded text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE/EDIT MODAL VIA PORTAL */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
            <div className="w-full max-w-md bg-paper border border-rule rounded-2xl p-6 text-ink shadow-2xl space-y-4">
              <h3 className="text-xl font-bold font-display">{editingNation ? 'Edit Nation' : 'Add Nation'}</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Short Name</label>
                  <Input value={shortName} onChange={(e) => setShortName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Color (Hex)</label>
                    <Input value={color} onChange={(e) => setColor(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Founded Year</label>
                    <Input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Government</label>
                    <Input value={governmentType} onChange={(e) => setGovernmentType(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Population</label>
                    <Input type="number" value={population} onChange={(e) => setPopulation(e.target.value)} />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-2 border-t border-rule">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Nation</Button>
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
        title="Delete Nation?"
        message="Are you sure you want to delete this nation?"
      />
    </div>
  );
}

export default ArchiveNationsManager;
