import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Reusable Modal Component
 * Accessible dialog popup portaled to document.body for full viewport coverage.
 */
export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-xl', className = '', variant = 'default', hideHeader = false }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDossier = variant === 'dossier';

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 top-0 left-0 w-full h-full transition-opacity animate-in fade-in duration-200 ${
          isDossier ? 'bg-stone-900/60 backdrop-blur-xs' : 'bg-black/65 backdrop-blur-xs'
        }`}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${maxWidth} ${
          isDossier
            ? 'bg-[#FAF7F2] border border-[#E6E0D6] rounded-3xl shadow-2xl'
            : 'bg-paper border border-rule rounded-2xl shadow-2xl'
        } overflow-hidden z-10 animate-in zoom-in-95 duration-200 ${className}`}
      >
        {/* Close button for dossier variant or when header is hidden */}
        {(isDossier || hideHeader) && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 sm:top-6 sm:right-6 p-2 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-200/50 transition-colors z-20 focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Standard Header (only if not dossier and not hideHeader) */}
        {!isDossier && !hideHeader && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-rule bg-ground/50">
            {title && <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>}
            <button
              onClick={onClose}
              className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-ground transition-colors focus:outline-none"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div
          className={
            isDossier
              ? 'p-5 sm:p-6 max-h-[88vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-300/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-stone-400'
              : 'p-6 max-h-[80vh] overflow-y-auto'
          }
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
