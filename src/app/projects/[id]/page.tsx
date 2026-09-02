import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PriceBadge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { SelectField } from "@/components/ui/SelectField";
import { formatTelegramContact, formatWhatsappContact } from "@/lib/contacts";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TO_BADGE,
  PROJECT_STATUS_VALUES,
} from "@/lib/project-status";
import { CONTACT_UNLOCK_PRICE_UAH, getContactUnlockState } from "@/lib/payments/contact-unlock";
import { isProjectFavorited } from "@/lib/projects/favorites";
import {
  ACADEMIC_TYPE_LABELS,
  STYLE_LABELS,
  TYPOLOGY_LABELS,
  type ArchitectureDna,
} from "@/lib/validation/architecture-dna";
import { unlockContactsAction, updateProjectStatusAction } from "./actions";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

const IMAGE_EXTENSION_RE = /\.(png|jpe?g|webp|gif)$/i;

function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          fullName: true,
          university: true,
          phone: true,
          email: true,
          telegram: true,
          whatsapp: true,
        },
      },
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
  const [project, session] = await Promise.all([getProject(id), auth()]);
  if (!project) {
    notFound();
  }

  const dna = project.dna as unknown as ArchitectureDna;
  const viewerId = session?.user?.id;
  const isAuthenticated = Boolean(viewerId);
  const isOwnProject = viewerId === project.authorId;

  const [unlockState, isFavorited] = await Promise.all([
    getContactUnlockState(viewerId, project),
    viewerId ? isProjectFavorited(viewerId, project.id) : Promise.resolve(false),
  ]);

  const telegramContact = formatTelegramContact(project.author.telegram);
  const whatsappContact = formatWhatsappContact(project.author.whatsapp);
  const hasExtraContacts = Boolean(telegramContact || whatsappContact);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <FavoriteButton
            projectId={project.id}
            initialFavorited={isFavorited}
            isAuthenticated={isAuthenticated}
          />
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

      {isOwnProject ? (
        <form
          action={updateProjectStatusAction.bind(null, project.id)}
          className="flex flex-wrap items-end gap-3 rounded-2xl border-[3px] border-ink bg-paper p-6 shadow-[4px_4px_0_0_var(--color-ink)]"
        >
          <div className="min-w-[220px] flex-1">
            <SelectField
              label="Статус проєкту"
              name="status"
              defaultValue={project.status}
              options={PROJECT_STATUS_VALUES.map((value) => ({
                value,
                label: PROJECT_STATUS_LABELS[value],
              }))}
            />
          </div>
          <Button type="submit" variant="secondary">
            Зберегти статус
          </Button>
        </form>
      ) : null}

      {isOwnProject || unlockState === "UNLOCKED" ? (
        <ContactsCard
          author={project.author}
          telegramContact={telegramContact}
          whatsappContact={whatsappContact}
          isOwnProject={isOwnProject}
        />
      ) : isAuthenticated ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-[3px] border-ink bg-accent-2/30 p-6 text-center shadow-[4px_4px_0_0_var(--color-ink)]">
          <p className="font-heading text-lg font-bold text-ink">Контакти автора приховані</p>
          <p className="max-w-sm text-sm text-ink/70">
            Перегляньте телефон і email{hasExtraContacts ? ", а також Telegram/WhatsApp" : ""} автора
            за одноразову оплату.
          </p>
          <form action={unlockContactsAction.bind(null, project.id)}>
            <Button type="submit">Переглянути контакти — {CONTACT_UNLOCK_PRICE_UAH} ₴</Button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-[3px] border-dashed border-ink/30 p-6 text-center">
          <p className="font-heading text-lg font-bold text-ink">
            Увійдіть, щоб переглянути контакти
          </p>
          <Link href={`/login?from=/projects/${project.id}`}>
            <Button type="button">Увійти</Button>
          </Link>
        </div>
      )}
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

interface ContactsCardProps {
  author: { phone: string | null; email: string };
  telegramContact: ReturnType<typeof formatTelegramContact>;
  whatsappContact: ReturnType<typeof formatWhatsappContact>;
  isOwnProject: boolean;
}

/**
 * Показує контакти автора — і власнику проєкту (завжди), і тому, хто вже
 * оплатив перегляд (Етап 6, CONTACT_UNLOCK_PRICE_UAH). Telegram/WhatsApp —
 * необов'язкові поля профілю (src/lib/contacts.ts), тому показуємо лише
 * задані.
 */
function ContactsCard({ author, telegramContact, whatsappContact, isOwnProject }: ContactsCardProps) {
  return (
    <dl className="flex flex-col gap-3 rounded-2xl border-[3px] border-ink bg-paper p-6 shadow-[4px_4px_0_0_var(--color-ink)]">
      <p className="font-heading text-sm font-bold uppercase tracking-wide text-ink/50">
        {isOwnProject ? "Ваші контакти" : "Контакти автора"}
      </p>
      {author.phone ? (
        <ContactRow label="Телефон" href={`tel:${author.phone}`} value={author.phone} />
      ) : null}
      <ContactRow label="Email" href={`mailto:${author.email}`} value={author.email} />
      {telegramContact ? (
        <ContactRow
          label="Telegram"
          href={telegramContact.href}
          value={telegramContact.label.replace(/^Telegram: /, "")}
          external
        />
      ) : null}
      {whatsappContact ? (
        <ContactRow
          label="WhatsApp"
          href={whatsappContact.href}
          value={whatsappContact.label.replace(/^WhatsApp: /, "")}
          external
        />
      ) : null}
    </dl>
  );
}

function ContactRow({
  label,
  href,
  value,
  external,
}: {
  label: string;
  href: string;
  value: string;
  external?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="font-semibold text-ink/60">{label}</dt>
      <dd className="text-ink">
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="underline decoration-2 underline-offset-4 hover:text-accent"
        >
          {value}
        </a>
      </dd>
    </div>
  );
}
