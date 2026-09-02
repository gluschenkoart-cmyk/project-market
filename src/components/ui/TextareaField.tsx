import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const fieldId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="font-heading text-sm font-bold text-ink">
          {label}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            "min-h-32 rounded-xl border-[3px] border-ink bg-paper px-4 py-2.5 text-ink placeholder:text-ink/40",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper",
            error && "border-accent",
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        />
        {hint && !error ? <p className="text-xs text-ink/50">{hint}</p> : null}
        {error ? (
          <p id={`${fieldId}-error`} className="text-xs font-semibold text-accent">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

TextareaField.displayName = "TextareaField";
