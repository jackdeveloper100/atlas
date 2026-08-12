import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * Reusable ErrorState Component
 * Error alert card with retry action matching DESIGN.md tokens.
 */
export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the ATLAS servers.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 border border-rose-200 rounded-card ${className}`}>
      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-danger mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h4 className="font-serif text-base font-semibold text-rose-900">{title}</h4>
      <p className="text-xs text-rose-700 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" leftIcon={RefreshCw} onClick={onRetry} className="border-rose-300 text-rose-800 hover:bg-rose-100">
          Try Again
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
