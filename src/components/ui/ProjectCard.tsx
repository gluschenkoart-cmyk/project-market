import { cn } from "@/lib/cn";
import { PriceBadge, StatusBadge, type ProjectStatus } from "@/components/ui/Badge";

/**
 * Спрощена картка проєкту для вертикалі "Архітектура" — демонструє
 * ключові поля Project DNA (тип, площа, поверховість) у стрічці.
 * Це вітрина дизайн-системи, не фінальний компонент даних (той з'явиться
 * на Етапі 4 разом зі схемою бази даних).
 */
export interface ProjectCardProps {
  title: string;
  authorName: string;
  university: string;
  typology: string;
  areaSqm: number;
  floors: number;
  status: ProjectStatus;
  priceUah?: number;
  className?: string;
}

export function ProjectCard({
  title,
  authorName,
  university,
  typology,
  areaSqm,
  floors,
  status,
  priceUah,
  className,
}: ProjectCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border-[3px] border-ink bg-paper shadow-[6px_6px_0_0_var(--color-ink)]",
        className,
      )}
    >
      <div className="flex aspect-[4/3] items-center justify-center border-b-[3px] border-ink bg-ink/5 font-heading text-sm text-ink/40">
        Рендер / фото проєкту
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
}
