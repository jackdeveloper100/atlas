import React from 'react';

/**
 * Reusable Section Header Component
 * Provides clean title, optional description, and action button slot.
 */
export function SectionHeader({ title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold font-sans text-ink tracking-tight">{title}</h2>
        {description && <p className="text-sm text-ink-muted font-sans mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default SectionHeader;
