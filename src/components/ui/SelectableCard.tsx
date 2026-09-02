import { cn } from "@/lib/cn";

export interface SelectableCardProps {
  name: string;
  value: string;
  title: string;
  description: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  hint?: string;
}

/**
 * Велика клікабельна картка-перемикач (роль, напрям творчості) замість
 * випадаючого списку — рішення на кшталт цього визначає весь подальший
 * досвід людини на платформі, тож заслуговує на вагу, а не dropdown.
 *
 * Технічно — звичайний <input type="radio">, візуально прихований, і
 * <label>, стилізований через peer-checked — працює без жодного JS.
 */
export function SelectableCard({
  name,
  value,
  title,
  description,
  defaultChecked,
  disabled,
  hint,
}: SelectableCardProps) {
  const id = `${name}-${value}`;

  return (
    <div className="relative">
      <input
        type="radio"
        name={name}
        value={value}
        id={id}
        defaultChecked={defaultChecked}
        disabled={disabled}
        required
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer flex-col gap-1 rounded-2xl border-[3px] border-ink bg-paper p-5",
          "transition-transform duration-150",
          "peer-checked:bg-accent-2 peer-checked:shadow-[4px_4px_0_0_var(--color-ink)]",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className="font-heading text-lg font-bold text-ink">{title}</span>
        <span className="text-sm text-ink/70">{description}</span>
        {hint ? <span className="text-xs font-semibold text-ink/50">{hint}</span> : null}
      </label>
    </div>
  );
}
