/**
 * SessionTimeoutModal.jsx
 *
 * Warning modal dialog that notifies users when their session is about
 * to expire due to inactivity. Provides option to extend or log out.
 */

import React from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

export default function SessionTimeoutModal({
  isOpen,
  remainingSeconds = 120,
  onExtend,
  onLogout,
}) {
  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage (based on max warning window 120s)
  const totalWarningMs = 120;
  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / totalWarningMs) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-paper border border-rule rounded-xl shadow-2xl overflow-hidden text-ink"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-rule/50 flex items-start space-x-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-full shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3
              id="session-timeout-title"
              className="text-xl font-display font-bold text-ink"
            >
              Session Expiring Soon
            </h3>
            <p className="text-sm text-ink/70 mt-1">
              You have been inactive for a while. For your security, you will be automatically logged out soon.
            </p>
          </div>
        </div>

        {/* Body & Countdown Display */}
        <div className="p-6 text-center">
          <div className="inline-flex flex-col items-center justify-center bg-ground px-6 py-4 rounded-xl border border-rule mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-ink/50 mb-1">
              Time Remaining
            </span>
            <span className="text-4xl font-mono font-bold text-ink tracking-widest">
              {formattedTime}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-ground rounded-full h-2 overflow-hidden border border-rule/30 mb-2">
            <div
              className="bg-amber-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-ground/50 border-t border-rule/50 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-rule text-ink/80 hover:text-ink hover:bg-black/5 font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out Now
          </button>
          <button
            type="button"
            onClick={onExtend}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-black text-white hover:bg-neutral-800 font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
