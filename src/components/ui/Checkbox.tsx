import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const fieldId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="flex items-start gap-3 text-sm text-ink">
          <input
            ref={ref}
            id={fieldId}
            type="checkbox"
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0 rounded border-[3px] border-ink accent-accent",
              className,
            )}
            aria-invalid={Boolean(error)}
            {...props}
          />
          <span>{label}</span>
        </label>
        {error ? <p className="ml-8 text-xs font-semibold text-accent">{error}</p> : null}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
