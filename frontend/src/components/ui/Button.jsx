import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button Component
 * Crisp, modern layout with inline-flex icon + text alignment and smooth transitions.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap';

  const variants = {
    primary: 'bg-black text-white hover:bg-neutral-800 shadow-2xs active:scale-[0.98]',
    secondary: 'bg-paper text-ink border border-rule hover:bg-ground hover:border-ink/20 shadow-2xs',
    outline: 'bg-transparent text-ink border border-rule hover:bg-ground hover:border-black/40',
    ghost: 'bg-transparent text-ink/70 hover:text-ink hover:bg-ground',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-2xs',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : LeftIcon ? (
        <LeftIcon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      <span className="inline-flex items-center justify-center gap-1.5">{children}</span>
      {!isLoading && RightIcon && <RightIcon className="w-3.5 h-3.5 shrink-0" />}
    </button>
  );
}

export default Button;
