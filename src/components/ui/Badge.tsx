import { cn } from "@/lib/cn";

/**
 * Статуси проєкту (CLAUDE.md / ProjectMarketConceptSummary):
 * Academic → Concept → For Sale → Sold/Licensed → Under Development → Built → Archived.
 * Кожен статус має свій колір-маркер — так само, як в оригінальній концепції.
 */
export type ProjectStatus =
  | "academic"
  | "concept"
  | "for_sale"
  | "sold"
  | "in_development"
  | "built"
  | "archived";

/** Експортовано — Етап 5 (src/lib/project-status.ts) переказує ці ж підписи
 * для фільтра "Статус проєкту", щоб не тримати переклад у двох місцях. */
export const STATUS_LABELS: Record<ProjectStatus, string> = {
  academic: "Навчальний",
  concept: "Концепт",
  for_sale: "На продаж",
  sold: "Продано",
  in_development: "У розробці",
  built: "Реалізовано",
  archived: "В архіві",
};

const STATUS_DOT_CLASSES: Record<ProjectStatus, string> = {
  academic: "bg-yellow-400",
  concept: "bg-blue-500",
  for_sale: "bg-accent",
  sold: "bg-green-500",
  in_development: "bg-orange-500",
  built: "bg-red-500",
  archived: "bg-neutral-500",
};

export interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-[3px] border-ink bg-paper px-3 py-1",
        "font-heading text-xs font-bold uppercase tracking-wide text-ink",
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", STATUS_DOT_CLASSES[status])} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}

export interface PriceBadgeProps {
  /** Ціна в гривнях; якщо не задана — показуємо "лише портфоліо". */
  priceUah?: number;
  className?: string;
}

export function PriceBadge({ priceUah, className }: PriceBadgeProps) {
  const label =
    priceUah === undefined
      ? "Лише портфоліо"
      : new Intl.NumberFormat("uk-UA", {
          style: "currency",
          currency: "UAH",
          maximumFractionDigits: 0,
        }).format(priceUah);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-[3px] border-ink px-3 py-1 font-heading text-sm font-extrabold text-ink",
        priceUah === undefined ? "bg-paper" : "bg-accent-2",
        className,
      )}
    >
      {label}
    </span>
  );
}
