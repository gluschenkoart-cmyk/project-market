import Link from "next/link";
import { cn } from "@/lib/cn";
import { PriceBadge, StatusBadge, type ProjectStatus } from "@/components/ui/Badge";
import { FavoriteButton } from "@/components/ui/FavoriteButton";

/**
 * Картка проєкту для вертикалі "Архітектура" — демонструє ключові поля
 * Project DNA (тип, площа, поверховість) у стрічці (Етап 5) і на вітрині
 * дизайн-системи (/style-guide, Етап 1 — там `id`/`previewUrl` не
 * передають, картка просто не стає посиланням і показує заглушку фото,
 * як і раніше).
 */
export interface ProjectCardProps {
  /** Якщо задано — уся картка стає посиланням на /projects/[id] (стрічка,
   * Етап 5). Без нього — статична демонстрація (/style-guide). */
  id?: string;
  title: string;
  authorName: string;
  university: string;
  typology: string;
  areaSqm: number;
  floors: number;
  status: ProjectStatus;
  priceUah?: number;
  /** Перше зображення проєкту (перевага — рендерам, див.
   * src/lib/projects/feed.ts). null/undefined — показуємо заглушку. */
  previewUrl?: string | null;
  /** Задано — над фото з'являється серце "в обране" (Етап 6). Без `id`
   * кнопка теж не показується (немає що зберігати в /style-guide). */
  favorite?: { isFavorited: boolean; isAuthenticated: boolean };
  className?: string;
}

export function ProjectCard({
  id,
  title,
  authorName,
  university,
  typology,
  areaSqm,
  floors,
  status,
  priceUah,
  previewUrl,
  favorite,
  className,
}: ProjectCardProps) {
  const card = (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border-[3px] border-ink bg-paper shadow-[6px_6px_0_0_var(--color-ink)]",
        id && "transition-transform duration-150 ease-out hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden border-b-[3px] border-ink bg-ink/5">
        {id && favorite ? (
          <FavoriteButton
            projectId={id}
            initialFavorited={favorite.isFavorited}
            isAuthenticated={favorite.isAuthenticated}
            className="absolute right-3 top-3 z-10 shadow-[3px_3px_0_0_var(--color-ink)]"
          />
        ) : null}
        {previewUrl ? (
          // Файли зараз віддаються з локального сховища (src/lib/storage.ts),
          // домен наперед невідомий next/image — звичайний <img> навмисно
          // (той самий підхід, що й на src/app/projects/[id]/page.tsx).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-heading text-sm text-ink/40">
            Рендер / фото проєкту
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg font-bold leading-snug text-ink">{title}</h3>
          <StatusBadge status={status} />
        </div>

        <p className="text-sm text-ink/70">
          {authorName} · {university}
        </p>

        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/80">
          <div className="flex gap-1">
            <dt className="font-semibold">Тип:</dt>
            <dd>{typology}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-semibold">Площа:</dt>
            <dd>{areaSqm.toLocaleString("uk-UA")} м²</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-semibold">Поверхів:</dt>
            <dd>{floors}</dd>
          </div>
        </dl>

        <div className="mt-1">
          <PriceBadge priceUah={priceUah} />
        </div>
      </div>
    </article>
  );

  if (!id) {
    return card;
  }

  return (
    <Link
      href={`/projects/${id}`}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      {card}
    </Link>
  );
}
