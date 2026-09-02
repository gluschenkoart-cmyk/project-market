import type { ProjectStatus } from "@prisma/client";
import {
  ACADEMIC_TYPES,
  ARCHITECTURE_STYLES,
  ARCHITECTURE_TYPOLOGIES,
} from "@/lib/validation/architecture-dna";
import { PROJECT_STATUS_VALUES } from "@/lib/project-status";

/**
 * Пошук і фільтри стрічки (Етап 5). Єдине джерело істини для того, які
 * параметри URL існують, як вони називаються і як парсяться — і сторінка
 * стрічки (src/app/page.tsx, перша сторінка на сервері), і довантаження
 * наступних сторінок (src/app/api/projects/route.ts), і клієнтська форма
 * фільтрів (src/app/FeedControls.tsx) використовують САМЕ ЦЕЙ файл, щоб
 * усі три місця завжди розуміли параметри однаково.
 *
 * Джерело значень для типу об'єкта/стилю/типу роботи — architecture-dna.ts
 * (Етап 4). Це навмисно: фільтри Етапу 5 стосуються лише вертикалі
 * "Архітектура" (єдиної, яка зараз має дані) — коли додамо інші вертикалі,
 * цей файл і src/lib/projects/feed.ts розділяться по вертикалях так само,
 * як зараз розділені форми завантаження.
 */

type ArchitectureTypologyValue = (typeof ARCHITECTURE_TYPOLOGIES)[number];
type ArchitectureStyleValue = (typeof ARCHITECTURE_STYLES)[number];
type AcademicTypeValue = (typeof ACADEMIC_TYPES)[number];

export const PROJECT_FEED_PAGE_SIZE = 12;

export const SORT_OPTIONS = ["newest", "price_asc", "price_desc"] as const;
export type ProjectSortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABELS: Record<ProjectSortOption, string> = {
  newest: "Спочатку нові",
  price_asc: "Спочатку дешевші",
  price_desc: "Спочатку дорожчі",
};

export interface ProjectFilters {
  /** Простий текстовий пошук (назва/опис/хештеги) — доступний УСІМ, не
   * лише Отримувачу (рішення Артема від 02.09.2026, Етап 5). */
  q: string;
  sort: ProjectSortOption;
  /** Нижче — панель детальних фільтрів, доступна лише Отримувачу. Коли
   * запит приходить не від Отримувача, parseProjectFilters поверне ці
   * поля порожніми незалежно від того, що є в самій URL-адресі
   * (options.basicOnly) — перевірка ролі відбувається на сервері, а не
   * лише приховуванням елементів інтерфейсу. */
  typology: ArchitectureTypologyValue[];
  style: ArchitectureStyleValue[];
  academicType: AcademicTypeValue[];
  status: ProjectStatus[];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  floorsMin?: number;
  floorsMax?: number;
  yearMin?: number;
  yearMax?: number;
  /** Вільний текст — шукаємо серед значень dna.software. */
  software: string;
}

const Q_MAX_LENGTH = 120;
const SOFTWARE_MAX_LENGTH = 60;

function parseEnumList<T extends string>(values: string[], allowed: readonly T[]): T[] {
  const allowedSet = new Set<string>(allowed);
  const result: T[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (allowedSet.has(value) && !seen.has(value)) {
      seen.add(value);
      result.push(value as T);
    }
  }
  return result;
}

/** Невід'ємне скінченне число або undefined — використовується для всіх
 * пар "від/до" (ціна, площа, поверховість, рік). Навмисно єдиний, не
 * розділений на "ціле"/"дробове" — SQL-запит (feed.ts) сам приводить типи
 * при порівнянні, тож зайва строгість тут нічого не додає. */
function parseRangeNumber(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

/** Якщо людина переплутала "від" і "до" (ввела більше в перше поле) —
 * тихо міняємо місцями, а не показуємо "нічого не знайдено". */
function normalizeRange(
  min: number | undefined,
  max: number | undefined,
): [number | undefined, number | undefined] {
  if (min !== undefined && max !== undefined && min > max) {
    return [max, min];
  }
  return [min, max];
}

export interface ParseProjectFiltersOptions {
  /** true — запит не від Отримувача: панель детальних фільтрів
   * ігнорується сервером, лишається тільки простий пошук і сортування. */
  basicOnly?: boolean;
}

export function parseProjectFilters(
  searchParams: URLSearchParams,
  options: ParseProjectFiltersOptions = {},
): ProjectFilters {
  const q = (searchParams.get("q") ?? "").trim().slice(0, Q_MAX_LENGTH);
  const sortRaw = searchParams.get("sort");
  const sort: ProjectSortOption = (SORT_OPTIONS as readonly string[]).includes(sortRaw ?? "")
    ? (sortRaw as ProjectSortOption)
    : "newest";

  if (options.basicOnly) {
    return { q, sort, typology: [], style: [], academicType: [], status: [], software: "" };
  }

  const [priceMin, priceMax] = normalizeRange(
    parseRangeNumber(searchParams.get("priceMin")),
    parseRangeNumber(searchParams.get("priceMax")),
  );
  const [areaMin, areaMax] = normalizeRange(
    parseRangeNumber(searchParams.get("areaMin")),
    parseRangeNumber(searchParams.get("areaMax")),
  );
  const [floorsMin, floorsMax] = normalizeRange(
    parseRangeNumber(searchParams.get("floorsMin")),
    parseRangeNumber(searchParams.get("floorsMax")),
  );
  const [yearMin, yearMax] = normalizeRange(
    parseRangeNumber(searchParams.get("yearMin")),
    parseRangeNumber(searchParams.get("yearMax")),
  );

  return {
    q,
    sort,
    typology: parseEnumList(searchParams.getAll("typology"), ARCHITECTURE_TYPOLOGIES),
    style: parseEnumList(searchParams.getAll("style"), ARCHITECTURE_STYLES),
    academicType: parseEnumList(searchParams.getAll("academicType"), ACADEMIC_TYPES),
    status: parseEnumList(searchParams.getAll("status"), PROJECT_STATUS_VALUES),
    priceMin,
    priceMax,
    areaMin,
    areaMax,
    floorsMin,
    floorsMax,
    yearMin,
    yearMax,
    software: (searchParams.get("software") ?? "").trim().slice(0, SOFTWARE_MAX_LENGTH),
  };
}

/**
 * Зворотне до parseProjectFilters — канонічний рядок запиту БЕЗ параметра
 * "page". Сервер (page.tsx) використовує це, щоб дати клієнтському
 * компоненту стрічки (ProjectFeed) рядок, яким довантажувати наступні
 * сторінки через /api/projects; клієнтська форма фільтрів (FeedControls)
 * використовує це саме, щоб зібрати нову URL-адресу після зміни фільтра.
 * Єдина функція серіалізації — щоб назви параметрів ніколи не розійшлись.
 */
export function buildFilterQueryString(filters: ProjectFilters): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  for (const value of filters.typology) params.append("typology", value);
  for (const value of filters.style) params.append("style", value);
  for (const value of filters.academicType) params.append("academicType", value);
  for (const value of filters.status) params.append("status", value);
  if (filters.priceMin !== undefined) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== undefined) params.set("priceMax", String(filters.priceMax));
  if (filters.areaMin !== undefined) params.set("areaMin", String(filters.areaMin));
  if (filters.areaMax !== undefined) params.set("areaMax", String(filters.areaMax));
  if (filters.floorsMin !== undefined) params.set("floorsMin", String(filters.floorsMin));
  if (filters.floorsMax !== undefined) params.set("floorsMax", String(filters.floorsMax));
  if (filters.yearMin !== undefined) params.set("yearMin", String(filters.yearMin));
  if (filters.yearMax !== undefined) params.set("yearMax", String(filters.yearMax));
  if (filters.software) params.set("software", filters.software);

  return params.toString();
}
