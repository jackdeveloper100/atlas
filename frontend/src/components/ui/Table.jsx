import React from 'react';

/**
 * Reusable Table Components
 * Clean, structured tabular data presentation matching DESIGN.md typography and rules.
 */
export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-x-auto border border-rule rounded-card bg-paper shadow-sm">
      <table className={`w-full text-left text-sm text-ink ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return <thead className="bg-ground border-b border-rule text-xs font-mono uppercase tracking-wider text-ink-muted">{children}</thead>;
}

export function TableRow({ children, onClick, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-rule/60 last:border-0 hover:bg-ground/50 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}

export function TableCell({ children, className = '' }) {
  return <td className={`px-4 py-3 text-ink ${className}`}>{children}</td>;
}

export default Table;
