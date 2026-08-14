import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import adminService from '../../../services/admin.service';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import MoveUpDownControls from '../../ui/MoveUpDownControls';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { useToast } from '../../ui/Toast';

export function ArchiveRegionsManager({ year, regions = [], nations = [], onUpdate, onEditEntityDetails }) {
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [nationId, setNationId] = useState('');
  const [population, setPopulation] = useState(0);
  const [area, setArea] = useState(1000);
  const [mapPath, setMapPath] = useState('');
  const [mapColor, setMapColor] = useState('');

  const nationMap = React.useMemo(() => {
    const map = {};
    nations.forEach((n) => { map[n.id] = n.name; });
    return map;
  }, [nations]);

  const openCreate = () => {
    setEditingRegion(null);
    setName('');
    setNationId(nations[0]?.id || '');
    setPopulation(0);
    setArea(1000);
    setMapPath('');
    setMapColor('');
    setIsModalOpen(true);
  };

  const openEdit = (r) => {
    setEditingRegion(r);
    setName(r.name || '');
    setNationId(r.nationId || '');
    setPopulation(r.population || 0);
    setArea(r.area || 1000);
    setMapPath(r.mapPath || '');
    setMapColor(r.mapColor || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      nationId: nationId || null,
      population: Number(population),
      area: Number(area),
      mapPath: mapPath || null,
      mapColor: mapColor || null,
    };

    try {
      let res;
      if (editingRegion) {
        res = await adminService.updateRegion(year, editingRegion.id, payload);
      } else {
        res = await adminService.createRegion(year, payload);
      }

      if (res.success) {
        addToast(editingRegion ? 'Region updated.' : 'Region created.', 'success');
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
      const res = await adminService.deleteRegion(year, deleteId);
      if (res.success) {
        addToast('Region deleted.', 'success');
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
    if (targetIdx < 0 || targetIdx >= regions.length) return;
    const reordered = [...regions];
    const temp = reordered[idx];
    reordered[idx] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const ids = reordered.map((r) => r.id);
    await adminService.reorderEntities(year, 'regions', ids);
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold font-display text-ink">Regions ({regions.length})</h3>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Add Region
        </Button>
      </div>

      <div className="bg-paper border border-rule rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-rule bg-ground/40 text-xs uppercase text-ink/50">
              <th className="py-3 px-4">Order</th>
              <th className="py-3 px-4">Region Name</th>
              <th className="py-3 px-4">Nation</th>
              <th className="py-3 px-4 text-right">Population</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/50">
            {regions.map((r, idx) => (
              <tr key={r.id} className="hover:bg-ground/30">
                <td className="py-3 px-4">
                  <MoveUpDownControls
                    isFirst={idx === 0}
                    isLast={idx === regions.length - 1}
                    onMoveUp={() => handleReorder(idx, -1)}
                    onMoveDown={() => handleReorder(idx, 1)}
                  />
                </td>
                <td className="py-3 px-4 font-serif font-bold text-ink">{r.name}</td>
                <td className="py-3 px-4 text-xs font-mono">{nationMap[r.nationId] || 'Unclaimed'}</td>
                <td className="py-3 px-4 text-right font-mono">{r.population?.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEditEntityDetails && onEditEntityDetails('region', r)}>
                      Metrics & Details
                    </Button>
                    <button onClick={() => openEdit(r)} className="p-1 hover:bg-ground rounded text-ink/70">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(r.id)} className="p-1 hover:bg-rose-50 rounded text-rose-600">
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
              <h3 className="text-xl font-bold font-display">{editingRegion ? 'Edit Region' : 'Add Region'}</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Region Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Controlling Nation</label>
                  <select
                    value={nationId}
                    onChange={(e) => setNationId(e.target.value)}
                    className="w-full text-xs font-sans p-2 bg-paper border border-rule rounded"
                  >
                    <option value="">(Unclaimed Territory)</option>
                    {nations.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Population</label>
                    <Input type="number" value={population} onChange={(e) => setPopulation(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Area (sq km)</label>
                    <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">SVG Map Path (Optional)</label>
                  <textarea
                    value={mapPath}
                    onChange={(e) => setMapPath(e.target.value)}
                    rows={2}
                    placeholder="M 10 10 h 100 v 100..."
                    className="w-full text-xs font-mono p-2 bg-paper border border-rule rounded"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-2 border-t border-rule">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Region</Button>
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
        title="Delete Region?"
        message="Are you sure you want to delete this region?"
      />
    </div>
  );
}

export default ArchiveRegionsManager;
