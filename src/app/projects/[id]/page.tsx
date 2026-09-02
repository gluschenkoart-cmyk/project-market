import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PriceBadge, StatusBadge } from "@/components/ui/Badge";
import { PROJECT_STATUS_TO_BADGE } from "@/lib/project-status";
import {
  ACADEMIC_TYPE_LABELS,
  STYLE_LABELS,
  TYPOLOGY_LABELS,
  type ArchitectureDna,
} from "@/lib/validation/architecture-dna";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

const IMAGE_EXTENSION_RE = /\.(png|jpe?g|webp|gif)$/i;

function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      author: { select: { fullName: true, university: true } },
      files: { orderBy: { order: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return {};

  // Хештеги — у description і keywords, щоб проєкт було легше знайти в
  // Google за цими словами (запит Артема "розширення пошуку через гугл").
  const hashtagsLine =
    project.hashtags.length > 0 ? ` ${project.hashtags.map((tag) => `#${tag}`).join(" ")}` : "";
  const description = `${project.description?.slice(0, 155) ?? project.title}${hashtagsLine}`;

  return {
    title: `${project.title} — Project Market`,
    description,
    keywords: project.hashtags,
    openGraph: {
      title: project.title,
      description,
      images: project.files[0] ? [project.files[0].url] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const dna = project.dna as unknown as ArchitectureDna;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={PROJECT_STATUS_TO_BADGE[project.status]} />
          {project.hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border-[3px] border-ink bg-paper px-3 py-1 text-xs font-semibold text-ink/70"
            >
              #{tag}
            </span>
          ))}
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-ink sm:text-4xl">
          {project.title}
        </h1>
        <p className="text-ink/70">
          {project.author.fullName} · {project.author.university}
        </p>
      </div>

      {project.files.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {project.files.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-2xl border-[3px] border-ink bg-ink/5"
            >
              {IMAGE_EXTENSION_RE.test(file.url) ? (
                // Файли зараз віддаються з локального сховища (src/lib/storage.ts),
                // домен наперед невідомий next/image — звичайний <img> навмисно.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt={file.originalName ?? project.title}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 text-ink/50">
                  <span className="text-3xl" aria-hidden>
                    📄
                  </span>
                  <span className="text-xs">{file.originalName ?? "Файл"}</span>
                </div>
              )}
            </a>
          ))}
        </div>
      ) : (
        <div className="flex aspect-[16/6] items-center justify-center rounded-2xl border-[3px] border-dashed border-ink/30 text-ink/40">
          Файли ще не завантажено
        </div>
      )}

      {project.description ? (
        <p className="whitespace-pre-line text-ink/80">{project.description}</p>
      ) : null}

      <dl className="grid gap-x-8 gap-y-3 rounded-2xl border-[3px] border-ink bg-paper p-6 shadow-[4px_4px_0_0_var(--color-ink)] sm:grid-cols-2">
        <DnaRow label="Тип об'єкта" value={TYPOLOGY_LABELS[dna.typology]} />
        <DnaRow label="Стиль" value={STYLE_LABELS[dna.style]} />
        {dna.subtype ? <DnaRow label="Підтип" value={dna.subtype} /> : null}
        <DnaRow label="Загальна площа" value={`${dna.totalAreaSqm.toLocaleString("uk-UA")} м²`} />
        {dna.plotAreaSqm ? (
          <DnaRow label="Площа ділянки" value={`${dna.plotAreaSqm.toLocaleString("uk-UA")} м²`} />
        ) : null}
        <DnaRow label="Поверховість" value={String(dna.floors)} />
        {dna.units ? <DnaRow label="К-сть юнітів" value={String(dna.units)} /> : null}
        <DnaRow label="Рік" value={String(dna.year)} />
        <DnaRow label="Тип роботи" value={ACADEMIC_TYPE_LABELS[dna.academicType]} />
        {dna.software.length > 0 ? <DnaRow label="Софт" value={dna.software.join(", ")} /> : null}
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        <PriceBadge priceUah={project.priceUah ? project.priceUah.toNumber() : undefined} />
        {project.developmentRightsPriceUah ? (
          <span className="inline-flex items-center rounded-full border-[3px] border-ink bg-paper px-3 py-1 font-heading text-sm font-extrabold text-ink">
            Доопрацювання:{" "}
            {new Intl.NumberFormat("uk-UA", {
              style: "currency",
              currency: "UAH",
              maximumFractionDigits: 0,
            }).format(project.developmentRightsPriceUah.toNumber())}
          </span>
        ) : null}
      </div>

      <div className="rounded-2xl border-[3px] border-ink bg-ink/5 p-6 text-sm text-ink/60">
        Зв&apos;язок з автором і контакти з&apos;являться на наступному етапі
        («Угода») — там-таки буде і оплата за перегляд контактів.
      </div>
    </main>
  );
}

function DnaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="font-semibold text-ink/60">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
