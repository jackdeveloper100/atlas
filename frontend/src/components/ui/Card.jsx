import React from 'react';

/**
 * Reusable Card Component & Subcomponents
 * Styled per DESIGN.md (bg-paper, border-rule, rounded-card).
 */
export function Card({ children, className = '', padding = true, ...props }) {
  return (
    <div
      className={`bg-paper border border-rule rounded-card shadow-sm transition-all ${
        padding ? 'p-5 sm:p-6' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', title, subtitle, action }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-rule ${className}`}>
      <div>
        {title && <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>}
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`flex-1 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`pt-4 mt-4 border-t border-rule flex items-center justify-between text-xs text-ink-muted ${className}`}>{children}</div>;
}

export default Card;
