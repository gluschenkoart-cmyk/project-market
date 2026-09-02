"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Field } from "@/components/ui/Field";
import {
  ACADEMIC_TYPES,
  ACADEMIC_TYPE_LABELS,
  ARCHITECTURE_STYLES,
  ARCHITECTURE_TYPOLOGIES,
  STYLE_LABELS,
  TYPOLOGY_LABELS,
} from "@/lib/validation/architecture-dna";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_VALUES } from "@/lib/project-status";
import {
  SORT_LABELS,
  SORT_OPTIONS,
  buildFilterQueryString,
  type ProjectFilters,
  type ProjectSortOption,
} from "@/lib/validation/project-filters";

interface FeedControlsProps {
  initialFilters: ProjectFilters;
  isAuthenticated: boolean;
  isReceiver: boolean;
}

/** Форма фільтрів тримає значення у вигляді рядків (навіть числові поля) —
 * бо це те, що людина буквально бачить у полях вводу; у ProjectFilters
 * (project-filters.ts) вони вже типізовані числами/переліками — сюди й
 * назад конвертують filtersToDraft/draftToFilters нижче. */
interface DraftFilters {
  q: string;
  sort: ProjectSortOption;
  typology: string[];
  style: string[];
  academicType: string[];
  status: string[];
  priceMin: string;
  priceMax: string;
  areaMin: string;
  areaMax: string;
  floorsMin: string;
  floorsMax: string;
  yearMin: string;
  yearMax: string;
  software: string;
}

const EMPTY_FILTERS: ProjectFilters = {
  q: "",
  sort: "newest",
  typology: [],
  style: [],
  academicType: [],
  status: [],
  software: "",
};

function filtersToDraft(filters: ProjectFilters): DraftFilters {
  return {
    q: filters.q,
    sort: filters.sort,
    typology: filters.typology,
    style: filters.style,
    academicType: filters.academicType,
    status: filters.status,
    priceMin: filters.priceMin?.toString() ?? "",
    priceMax: filters.priceMax?.toString() ?? "",
    areaMin: filters.areaMin?.toString() ?? "",
    areaMax: filters.areaMax?.toString() ?? "",
    floorsMin: filters.floorsMin?.toString() ?? "",
    floorsMax: filters.floorsMax?.toString() ?? "",
    yearMin: filters.yearMin?.toString() ?? "",
    yearMax: filters.yearMax?.toString() ?? "",
    software: filters.software,
  };
}

function draftToFilters(draft: DraftFilters): ProjectFilters {
  const toNumber = (value: string): number | undefined => {
    if (value.trim() === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    q: draft.q.trim(),
    sort: draft.sort,
    typology: draft.typology as ProjectFilters["typology"],
    style: draft.style as ProjectFilters["style"],
    academicType: draft.academicType as ProjectFilters["academicType"],
    status: draft.status as ProjectFilters["status"],
    priceMin: toNumber(draft.priceMin),
    priceMax: toNumber(draft.priceMax),
    areaMin: toNumber(draft.areaMin),
    areaMax: toNumber(draft.areaMax),
    floorsMin: toNumber(draft.floorsMin),
    floorsMax: toNumber(draft.floorsMax),
    yearMin: toNumber(draft.yearMin),
    yearMax: toNumber(draft.yearMax),
    software: draft.software.trim(),
  };
}

type MultiSelectKey = "typology" | "style" | "academicType" | "status";

/**
 * Пошук, сортування й панель фільтрів стрічки (Етап 5). Джерело істини для
 * того, що показано, — сама адреса сторінки (searchParams), а не
 * внутрішній React-стан: тому фільтри можна зберегти в закладки, надіслати
 * посиланням чи відкрити кнопкою "Назад" у браузері. Цей компонент лише
 * ЧИТАЄ початковий стан з initialFilters (те, що сервер уже розпарсив із
 * поточної адреси, src/app/page.tsx) і навігацією (router.push) оновлює
 * адресу — сторінка сама перечитає нові searchParams і перезавантажить
 * перший екран результатів.
 */
export function FeedControls({ initialFilters, isAuthenticated, isReceiver }: FeedControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState<DraftFilters>(() => filtersToDraft(initialFilters));
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Адреса змінилась ззовні (кнопка "Назад", перехід за посиланням із
  // готовими фільтрами) — підхопити нові значення в чернетку форми.
  useEffect(() => {
    setDraft(filtersToDraft(initialFilters));
  }, [initialFilters]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const commit = useCallback(
    (next: DraftFilters) => {
      const qs = buildFilterQueryString(draftToFilters(next));
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  // 400 мс — щоб швидкий набір тексту чи кілька клацань підряд по чіпах
  // не запускали перезавантаження результатів на кожну окрему дію.
  const commitDebounced = useCallback(
    (next: DraftFilters) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => commit(next), 400);
    },
    [commit],
  );

  const update = useCallback(
    (patch: Partial<DraftFilters>) => {
      setDraft((prev) => {
        const next = { ...prev, ...patch };
        commitDebounced(next);
        return next;
      });
    },
    [commitDebounced],
  );

  const toggleValue = useCallback(
    (key: MultiSelectKey, value: string) => {
      setDraft((prev) => {
        const current = prev[key];
        const nextValues = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        const next = { ...prev, [key]: nextValues };
        commitDebounced(next);
        return next;
      });
    },
    [commitDebounced],
  );

  const resetAll = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const next = filtersToDraft(EMPTY_FILTERS);
    setDraft(next);
    commit(next);
  }, [commit]);

  const activeFilterCount =
    draft.typology.length +
    draft.style.length +
    draft.academicType.length +
    draft.status.length +
    [
      draft.priceMin,
      draft.priceMax,
      draft.areaMin,
      draft.areaMax,
      draft.floorsMin,
      draft.floorsMax,
      draft.yearMin,
      draft.yearMax,
      draft.software,
    ].filter((value) => value !== "").length;

  const hasAnythingToReset = activeFilterCount > 0 || draft.q !== "" || draft.sort !== "newest";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label htmlFor="feed-search" className="sr-only">
            Пошук проєктів
          </label>
          <input
            id="feed-search"
            type="search"
            placeholder="Пошук за назвою, описом або хештегом…"
            value={draft.q}
            onChange={(event) => update({ q: event.target.value })}
            className="w-full rounded-xl border-[3px] border-ink bg-paper px-4 py-2.5 text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper"
          />
        </div>

        <select
          aria-label="Сортування"
          value={draft.sort}
          onChange={(event) => update({ sort: event.target.value as ProjectSortOption })}
          className="rounded-xl border-[3px] border-ink bg-paper px-4 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </select>

        {hasAnythingToReset ? (
          <button
            type="button"
            onClick={resetAll}
            className="whitespace-nowrap text-sm font-semibold text-ink underline decoration-2 underline-offset-4 hover:text-accent"
          >
            Скинути все
          </button>
        ) : null}
      </div>

      {isReceiver ? (
        <details className="rounded-2xl border-[3px] border-ink bg-paper shadow-[4px_4px_0_0_var(--color-ink)] open:pb-5">
          <summary className="cursor-pointer select-none rounded-2xl px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-ink">
            Фільтри{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </summary>

          <div className="flex flex-col gap-6 border-t-[3px] border-ink px-5 pt-5">
            <ChipGroup
              legend="Тип об'єкта"
              options={ARCHITECTURE_TYPOLOGIES}
              labels={TYPOLOGY_LABELS}
              selected={draft.typology}
              onToggle={(value) => toggleValue("typology", value)}
            />

            <ChipGroup
              legend="Стиль архітектури"
              options={ARCHITECTURE_STYLES}
              labels={STYLE_LABELS}
              selected={draft.style}
              onToggle={(value) => toggleValue("style", value)}
              scrollable
            />

            <ChipGroup
              legend="Тип роботи"
              options={ACADEMIC_TYPES}
              labels={ACADEMIC_TYPE_LABELS}
              selected={draft.academicType}
              onToggle={(value) => toggleValue("academicType", value)}
            />

            <ChipGroup
              legend="Статус проєкту"
              options={PROJECT_STATUS_VALUES}
              labels={PROJECT_STATUS_LABELS}
              selected={draft.status}
              onToggle={(value) => toggleValue("status", value)}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <RangeFields
                legend="Ціна, ₴"
                minValue={draft.priceMin}
                maxValue={draft.priceMax}
                onChange={(min, max) => update({ priceMin: min, priceMax: max })}
              />
              <RangeFields
                legend="Площа, м²"
                minValue={draft.areaMin}
                maxValue={draft.areaMax}
                onChange={(min, max) => update({ areaMin: min, areaMax: max })}
              />
              <RangeFields
                legend="Поверховість"
                minValue={draft.floorsMin}
                maxValue={draft.floorsMax}
                onChange={(min, max) => update({ floorsMin: min, floorsMax: max })}
              />
              <RangeFields
                legend="Рік"
                minValue={draft.yearMin}
                maxValue={draft.yearMax}
                onChange={(min, max) => update({ yearMin: min, yearMax: max })}
              />
            </div>

            <Field
              id="feed-software"
              label="Софт"
              placeholder="Наприклад, Revit"
              value={draft.software}
              onChange={(event) => update({ software: event.target.value })}
            />
          </div>
        </details>
      ) : (
        <div className="rounded-2xl border-[3px] border-dashed border-ink/30 px-5 py-4 text-sm text-ink/60">
          Детальні фільтри (тип об&apos;єкта, стиль, ціна, площа тощо)
          доступні акаунтам з роллю «Отримувач».{" "}
          {isAuthenticated ? (
            <Link
              href="/profile"
              className="font-semibold text-ink underline decoration-2 underline-offset-4"
            >
              Профіль
            </Link>
          ) : (
            <Link
              href="/register"
              className="font-semibold text-ink underline decoration-2 underline-offset-4"
            >
              Зареєструватись
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function ChipGroup<T extends string>({
  legend,
  options,
  labels,
  selected,
  onToggle,
  scrollable,
}: {
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  selected: string[];
  onToggle: (value: T) => void;
  scrollable?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-heading text-xs font-bold uppercase tracking-wide text-ink/60">
        {legend}
      </legend>
      <div className={cn("flex flex-wrap gap-2", scrollable && "max-h-40 overflow-y-auto pr-1")}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(option)}
              className={cn(
                "rounded-full border-[3px] border-ink px-3 py-1 text-xs font-semibold transition-colors",
                isSelected ? "bg-accent-2 text-ink" : "bg-paper text-ink/70 hover:bg-ink/5",
              )}
            >
              {labels[option]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function RangeFields({
  legend,
  minValue,
  maxValue,
  onChange,
}: {
  legend: string;
  minValue: string;
  maxValue: string;
  onChange: (minValue: string, maxValue: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-heading text-xs font-bold uppercase tracking-wide text-ink/60">
        {legend}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          aria-label={`${legend} — від`}
          placeholder="від"
          value={minValue}
          onChange={(event) => onChange(event.target.value, maxValue)}
          className="w-full rounded-xl border-[3px] border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper"
        />
        <span className="text-ink/40" aria-hidden>
          —
        </span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          aria-label={`${legend} — до`}
          placeholder="до"
          value={maxValue}
          onChange={(event) => onChange(minValue, event.target.value)}
          className="w-full rounded-xl border-[3px] border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper"
        />
      </div>
    </div>
  );
}
