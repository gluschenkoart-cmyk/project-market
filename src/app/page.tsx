import { resolveViewerAccess } from "@/lib/projects/access";
import { getProjectFeedPage } from "@/lib/projects/feed";
import {
  PROJECT_FEED_PAGE_SIZE,
  buildFilterQueryString,
  parseProjectFilters,
} from "@/lib/validation/project-filters";
import { FeedControls } from "./FeedControls";
import { ProjectFeed } from "./ProjectFeed";

/**
 * Стрічка проєктів (Етап 5) — головна сторінка сайту. Бачать її всі, і
 * незалогінені теж (CLAUDE.md, рішення від 01.09.2026: "переглядати
 * стрічку й картки проєктів можуть усі"); панель детальних фільтрів —
 * лише Отримувач (resolveViewerAccess перевіряє це на сервері).
 *
 * Ніколи не кешується статично: результат залежить від довільних
 * параметрів пошуку в адресі й від ролі того, хто дивиться.
 */
export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const urlSearchParams = toURLSearchParams(resolvedSearchParams);

  const { isAuthenticated, isReceiver, userId } = await resolveViewerAccess();
  const filters = parseProjectFilters(urlSearchParams, { basicOnly: !isReceiver });
  const { items, hasMore } = await getProjectFeedPage(filters, {
    page: 1,
    take: PROJECT_FEED_PAGE_SIZE,
    viewerId: userId,
  });

  // Канонічний рядок фільтрів (без "page") — і ключ для ProjectFeed (нова
  // стрічка при зміні пошуку/фільтрів замість ручного скидання старої), і
  // те, чим клієнтський компонент довантажує наступні сторінки.
  const filtersQuery = buildFilterQueryString(filters);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2 text-center sm:text-left">
        <h1 className="font-heading text-3xl font-extrabold text-ink sm:text-4xl">
          Стрічка проєктів
        </h1>
        <p className="text-ink/70">
          Нереалізовані студентські проєкти — від дипломної роботи до
          комерційного концепту.
        </p>
      </header>

      <FeedControls
        initialFilters={filters}
        isAuthenticated={isAuthenticated}
        isReceiver={isReceiver}
      />

      <ProjectFeed
        key={filtersQuery}
        filtersQuery={filtersQuery}
        initialItems={items}
        initialHasMore={hasMore}
        isAuthenticated={isAuthenticated}
      />
    </main>
  );
}

function toURLSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.append(key, value);
    }
  }
  return params;
}
