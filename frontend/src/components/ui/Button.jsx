import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button Component
 * Matches DESIGN.md token specifications (pill shape, smooth transitions, color variants).
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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-black text-white hover:bg-neutral-800 shadow-sm active:scale-[0.98]',
    secondary: 'bg-paper text-ink border border-rule hover:bg-ground hover:border-ink/20 shadow-sm',
    outline: 'bg-transparent text-ink border border-rule hover:bg-ground hover:border-black',
    ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-ground',
    danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5',
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
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
      {!isLoading && RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
    </button>
  );
}

export default Button;
