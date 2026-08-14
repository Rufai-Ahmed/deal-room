import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react';
import clsx from 'clsx';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  error?: string | null;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, error, className, ...props }, ref) => {
    const id = useId();

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={id}
          className="block text-[0.8125rem] font-medium text-ink-soft"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          className={clsx(
            'h-10 w-full rounded-lg border bg-paper-raised px-3 text-sm text-ink',
            'placeholder:text-ink-faint',
            'focus:outline-2 focus:outline-offset-[-1px] focus:outline-brand',
            error ? 'border-danger' : 'border-rule-strong',
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-[0.8125rem] text-danger">{error}</p>
        ) : hint ? (
          <p className="text-[0.8125rem] text-ink-faint">{hint}</p>
        ) : null}
      </div>
    );
  },
);

Field.displayName = 'Field';
