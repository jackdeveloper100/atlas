import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * Reusable EmptyState Component
 * Empty state presentation card when no records match filter/search.
 */
export function EmptyState({
  title = 'No data found',
  description = 'There are no records matching your request or selection.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-paper border border-rule rounded-card ${className}`}>
      <div className="w-12 h-12 rounded-full bg-ground border border-rule flex items-center justify-center text-ink-muted mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="font-serif text-lg font-semibold text-ink">{title}</h4>
      <p className="text-sm text-ink-muted max-w-md mt-1 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
