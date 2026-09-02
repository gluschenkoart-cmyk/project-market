import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Текстове поле в тому ж "стікерному" стилі, що й решта компонентів:
 * товстий контур замість тонкої сірої рамки.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const fieldId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="font-heading text-sm font-bold text-ink">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={cn(
            "rounded-xl border-[3px] border-ink bg-paper px-4 py-2.5 text-ink placeholder:text-ink/40",
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

Field.displayName = "Field";
