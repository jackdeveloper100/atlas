import React, { useState } from 'react';
import adminService from '../../../services/admin.service';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import MoveUpDownControls from '../../ui/MoveUpDownControls';
import { useToast } from '../../ui/Toast';

export function ArchiveTabsManager({ year, tabs = [], onUpdate }) {
  const { addToast } = useToast();
  const [tabsList, setTabsList] = useState(tabs || []);
  const [saving, setSaving] = useState(false);

  const handleMove = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= tabsList.length) return;
    const updated = [...tabsList];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setTabsList(updated);
  };

  const handleFieldChange = (idx, field, val) => {
    const updated = [...tabsList];
    updated[idx] = { ...updated[idx], [field]: val };
    setTabsList(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await adminService.updateTabs(year, tabsList);
      if (res.success) {
        addToast('Modal tabs updated.', 'success');
        if (onUpdate) onUpdate();
      } else {
        addToast(res.error || 'Failed to update tabs.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update tabs.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl bg-paper p-6 rounded-card border border-rule">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold font-display text-ink">Modal Category Tabs</h3>
          <p className="text-xs text-ink/60 mt-0.5">Customize inspector tabs for Year {year}.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>Save Tabs</Button>
      </div>

      <div className="space-y-2">
        {tabsList.map((t, idx) => (
          <div key={t.id || t.tabKey || idx} className="flex items-center gap-3 p-3 bg-ground/50 rounded border border-rule">
            <MoveUpDownControls
              isFirst={idx === 0}
              isLast={idx === tabsList.length - 1}
              onMoveUp={() => handleMove(idx, -1)}
              onMoveDown={() => handleMove(idx, 1)}
            />

            <Input
              value={t.tabKey || t.id}
              disabled
              className="w-28 text-xs font-mono bg-paper/50 opacity-70"
            />

            <Input
              value={t.label}
              onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
              placeholder="Tab Label"
              className="flex-1 text-xs"
            />

            <Input
              value={t.icon || ''}
              onChange={(e) => handleFieldChange(idx, 'icon', e.target.value)}
              placeholder="Lucide Icon"
              className="w-32 text-xs font-mono"
            />

            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={t.isVisible !== false && t.is_visible !== false}
                onChange={(e) => handleFieldChange(idx, 'isVisible', e.target.checked)}
                className="rounded border-rule"
              />
              Visible
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArchiveTabsManager;
