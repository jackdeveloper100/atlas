import React, { forwardRef } from 'react';

/**
 * Reusable Input Component
 * Styled with DESIGN.md tokens (ground background, rule border, accent focus ring).
 */
export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    type = 'text',
    className = '',
    id,
    disabled = false,
    required = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    onRightIconClick,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3 text-ink-muted pointer-events-none">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          className={`w-full rounded-md border bg-paper px-3.5 py-2 text-sm text-ink placeholder-ink-muted/50 transition-colors focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 disabled:bg-ground ${
            LeftIcon ? 'pl-9' : ''
          } ${RightIcon ? 'pr-9' : ''} ${
            error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-rule'
          } ${className}`}
          {...props}
        />

        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            tabIndex={onRightIconClick ? 0 : -1}
            className={`absolute right-3 text-ink-muted hover:text-ink ${
              onRightIconClick ? 'cursor-pointer' : 'pointer-events-none'
            }`}
          >
            <RightIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs text-danger font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
