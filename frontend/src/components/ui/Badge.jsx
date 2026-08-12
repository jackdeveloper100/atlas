import React from 'react';

/**
 * Reusable Badge Component
 * Status indicators and pill labels matching DESIGN.md.
 */
export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const base = 'inline-flex items-center font-mono font-medium rounded-full uppercase tracking-wider select-none';

  const variants = {
    default: 'bg-ground text-ink-muted border border-rule',
    accent: 'bg-black text-white',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    ink: 'bg-ink text-white',
    alert: 'bg-rose-50 text-rose-600 border border-rose-400 font-sans normal-case tracking-normal',
    tag: 'bg-ground/60 text-ink-muted border border-rule font-sans normal-case tracking-normal',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-xs px-3 py-1.5',
  };

  return (
    <span className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
