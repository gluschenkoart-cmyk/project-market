import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
}

/**
 * Стилізований нативний <select> у тому ж "стікерному" стилі, що й Field —
 * для довгих переліків (11 типів об'єкта, 25 стилів архітектури), де
 * SelectableCard-сітка (як для ролі/напряму) була б надто громіздкою.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, placeholder, error, hint, id, className, defaultValue, ...props }, ref) => {
    const fieldId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="font-heading text-sm font-bold text-ink">
          {label}
        </label>
        <select
          ref={ref}
          id={fieldId}
          defaultValue={defaultValue ?? ""}
          className={cn(
            "rounded-xl border-[3px] border-ink bg-paper px-4 py-2.5 text-ink",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper",
            error && "border-accent",
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

SelectField.displayName = "SelectField";
