import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import MoveUpDownControls from './MoveUpDownControls';
import Button from './Button';
import Input from './Input';

/**
 * TagListEditor Component
 * Generic list editor for strings or objects (governance badges, risk tags, culture breakdown, series points).
 */
export function TagListEditor({ items = [], onChange, mode = 'string', label = 'List Editor' }) {
  const [newText, setNewText] = useState('');
  const [newVal, setNewVal] = useState('');

  const handleAdd = () => {
    if (mode === 'string') {
      if (!newText.trim()) return;
      onChange([...items, newText.trim()]);
      setNewText('');
    } else if (mode === 'badge') {
      if (!newText.trim()) return;
      onChange([...items, { label: newText.trim(), color: 'default', icon: '' }]);
      setNewText('');
    } else if (mode === 'culture') {
      if (!newText.trim()) return;
      onChange([...items, { group: newText.trim(), percentage: Number(newVal) || 0 }]);
      setNewText('');
      setNewVal('');
    } else if (mode === 'series') {
      onChange([...items, { label: newText.trim() || `P${items.length + 1}`, value: Number(newVal) || 0 }]);
      setNewText('');
      setNewVal('');
    }
  };

  const handleRemove = (index) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMove = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange(updated);
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    if (mode === 'string') {
      updated[index] = value;
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  return (
    <div className="space-y-3 bg-ground/50 p-4 rounded-lg border border-rule">
      <div className="text-xs font-mono font-bold uppercase text-ink/70">{label}</div>

      {/* Items List */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-paper p-2 rounded border border-rule">
            <MoveUpDownControls
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
              onMoveUp={() => handleMove(idx, -1)}
              onMoveDown={() => handleMove(idx, 1)}
            />

            {mode === 'string' && (
              <Input
                value={typeof item === 'string' ? item : item.label || ''}
                onChange={(e) => handleItemFieldChange(idx, null, e.target.value)}
                className="flex-1 text-xs"
              />
            )}

            {mode === 'badge' && (
              <div className="flex-1 flex gap-2">
                <Input
                  value={item.label || ''}
                  onChange={(e) => handleItemFieldChange(idx, 'label', e.target.value)}
                  placeholder="Badge Label"
                  className="flex-1 text-xs"
                />
                <select
                  value={item.color || 'default'}
                  onChange={(e) => handleItemFieldChange(idx, 'color', e.target.value)}
                  className="text-xs bg-paper border border-rule rounded px-2 py-1"
                >
                  <option value="default">Default</option>
                  <option value="red">Red/Danger</option>
                  <option value="blue">Blue/Info</option>
                  <option value="amber">Amber/Warning</option>
                </select>
              </div>
            )}

            {mode === 'culture' && (
              <div className="flex-1 flex gap-2">
                <Input
                  value={item.group || item.party || ''}
                  onChange={(e) => handleItemFieldChange(idx, 'group', e.target.value)}
                  placeholder="Group Name"
                  className="flex-1 text-xs"
                />
                <Input
                  type="number"
                  value={item.percentage !== undefined ? item.percentage : item.pct || 0}
                  onChange={(e) => handleItemFieldChange(idx, 'percentage', Number(e.target.value))}
                  placeholder="%"
                  className="w-20 text-xs"
                />
              </div>
            )}

            {mode === 'series' && (
              <div className="flex-1 flex gap-2">
                <Input
                  value={item.label || ''}
                  onChange={(e) => handleItemFieldChange(idx, 'label', e.target.value)}
                  placeholder="Label (e.g. Q1)"
                  className="w-28 text-xs"
                />
                <Input
                  type="number"
                  value={item.value !== undefined ? item.value : 0}
                  onChange={(e) => handleItemFieldChange(idx, 'value', Number(e.target.value))}
                  placeholder="Value"
                  className="flex-1 text-xs"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Row */}
      <div className="flex items-center gap-2 pt-2 border-t border-rule/50">
        <Input
          placeholder={mode === 'series' ? 'Point Label' : 'New Item Text'}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="flex-1 text-xs"
        />
        {(mode === 'culture' || mode === 'series') && (
          <Input
            type="number"
            placeholder={mode === 'culture' ? '%' : 'Value'}
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            className="w-24 text-xs"
          />
        )}
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

export default TagListEditor;
