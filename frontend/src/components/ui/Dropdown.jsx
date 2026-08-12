import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable Dropdown Select Component
 * Filter select dropdown matching DESIGN.md styling.
 */
export function Dropdown({
  label,
  options = [],
  value,
  onChange,
  className = '',
  placeholder = 'Select option...',
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</label>}
      <div className="relative flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-md border border-rule bg-paper px-3.5 py-2 pr-9 text-sm text-ink transition-colors focus:border-black focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 w-4 h-4 text-ink-muted pointer-events-none" />
      </div>
    </div>
  );
}

export default Dropdown;
