"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { PROJECT_STATUS_TO_BADGE } from "@/lib/project-status";
import type { FeedProject } from "@/lib/projects/feed";

interface ProjectFeedProps {
  /** Канонічний рядок запиту фільтрів (без "page") — src/app/page.tsx
   * будує його через buildFilterQueryString і завжди передає й у key,
   * і сюди: батько монтує <ProjectFeed key={filtersQuery} .../>, тож зміна
   * пошуку/фільтрів пересоздає весь цей компонент заново замість того, щоб
   * вручну скидати вже накопичені картки попереднього запиту. */
  filtersQuery: string;
  initialItems: FeedProject[];
  initialHasMore: boolean;
  /** Для серця "в обране" на кожній картці (Етап 6) — незалогінений
   * веде на /login замість перемикання. */
  isAuthenticated: boolean;
}

interface FeedApiResponse {
  items: FeedProject[];
  hasMore: boolean;
}

/**
 * Нескінченна стрічка (Етап 5, рішення Артема від 02.09.2026). Перша
 * сторінка вже прийшла з сервера (src/app/page.tsx) — швидкий перший показ
 * і видимість для Google; решту довантажує цей компонент через
 * /api/projects при наближенні до кінця списку (IntersectionObserver на
 * невидимому "сторожі" в самому низу).
 */
export function ProjectFeed({
  filtersQuery,
  initialItems,
  initialHasMore,
  isAuthenticated,
}: ProjectFeedProps) {
  const [items, setItems] = useState<FeedProject[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Скасувати незавершений запит, якщо компонент іде з екрана (наприклад,
  // фільтри змінились і батько змонтував нову стрічку замість цієї).
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const loadMore = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setLoadError(false);

    const nextPage = page + 1;
    const query = new URLSearchParams(filtersQuery);
    query.set("page", String(nextPage));

    try {
      const response = await fetch(`/api/projects?${query.toString()}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Feed request failed: ${response.status}`);
      }
      const data: FeedApiResponse = await response.json();

      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setLoadError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [filtersQuery, page]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading || loadError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      // Починаємо довантажувати ще до того, як сторож реально ввійде в
      // кадр — плавніше на швидкому скролі.
      { rootMargin: "600px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadError, loadMore]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-[3px] border-dashed border-ink/30 px-6 py-20 text-center">
        <p className="font-heading text-lg font-bold text-ink">Нічого не знайдено</p>
        <p className="max-w-sm text-sm text-ink/60">
          Спробуйте змінити пошуковий запит або послабити фільтри.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="feed"
        aria-busy={isLoading}
      >
        {items.map((project) => (
          <ProjectCard
            key={project.id}
            id={project.id}
            title={project.title}
            authorName={project.authorName}
            university={project.university}
            typology={project.typologyLabel}
            areaSqm={project.areaSqm}
            floors={project.floors}
            status={PROJECT_STATUS_TO_BADGE[project.status]}
            priceUah={project.priceUah ?? undefined}
            previewUrl={project.previewUrl}
            favorite={{ isFavorited: project.isFavorited, isAuthenticated }}
          />
        ))}
      </div>

      {/* Невидимий сторож для IntersectionObserver — не сам індикатор. */}
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />

      {isLoading ? (
        <p className="text-center text-sm font-semibold text-ink/50" role="status">
          Завантажуємо ще проєкти…
        </p>
      ) : null}

      {loadError ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-accent">Не вдалось довантажити проєкти.</p>
          <button
            type="button"
            onClick={() => void loadMore()}
            className="text-sm font-semibold text-ink underline decoration-2 underline-offset-4 hover:text-accent"
          >
            Спробувати ще раз
          </button>
        </div>
      ) : null}

      {!hasMore && !isLoading && !loadError ? (
        <p className="text-center text-sm text-ink/40">Це всі проєкти за цим запитом.</p>
      ) : null}
    </div>
  );
}
