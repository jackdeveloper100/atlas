import React from 'react';

/**
 * Reusable Skeleton Component
 * Loading state placeholder animation matching DESIGN.md tokens.
 */
export function Skeleton({ className = '', variant = 'text' }) {
  const base = 'animate-pulse bg-ground rounded';

  const variants = {
    text: 'h-4 w-full',
    circular: 'rounded-full h-10 w-10',
    rectangular: 'h-24 w-full rounded-card',
    tableRow: 'h-12 w-full rounded-none border-b border-rule',
  };

  return <div className={`${base} ${variants[variant] || variants.text} ${className}`} />;
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full border border-rule rounded-card bg-paper overflow-hidden">
      <div className="bg-ground h-10 w-full border-b border-rule animate-pulse" />
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 px-4 py-3.5 border-b border-rule/50 last:border-0">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton key={cIdx} className={`h-4 ${cIdx === 0 ? 'w-1/3' : 'w-1/6'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
