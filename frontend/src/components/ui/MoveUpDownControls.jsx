import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export function MoveUpDownControls({ onMoveUp, onMoveDown, isFirst = false, isLast = false, disabled = false }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={disabled || isFirst}
        className="p-1 rounded hover:bg-ground border border-rule disabled:opacity-30 disabled:pointer-events-none text-ink/70"
        title="Move Up"
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={disabled || isLast}
        className="p-1 rounded hover:bg-ground border border-rule disabled:opacity-30 disabled:pointer-events-none text-ink/70"
        title="Move Down"
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default MoveUpDownControls;
