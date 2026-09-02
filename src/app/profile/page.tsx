import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isProfileComplete } from "@/lib/onboarding";
import { PROJECT_STATUS_TO_BADGE } from "@/lib/project-status";
import { VERTICAL_LABELS } from "@/lib/validation/onboarding";
import { formatTelegramContact, formatWhatsappContact } from "@/lib/contacts";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { signOutAction } from "./actions";

const ROLE_LABELS = {
  CREATOR: "Творець",
  RECEIVER: "Отримувач",
} as const;

/**
 * Захищена сторінка (див. src/middleware.ts) — сюди не дійти без входу.
 * Для Творця тут же — список власних проєктів і посилання на форму
 * завантаження нового (Етап 4, src/app/projects/new).
 */
export default async function ProfilePage() {
  const session = await auth();

  // middleware вже гарантує сесію, але для типів і на випадок гонки —
  // явна перевірка тут.
  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      fullName: true,
      email: true,
      phone: true,
      university: true,
      faculty: true,
      role: true,
      primaryVertical: true,
      copyrightConfirmed: true,
      telegram: true,
      whatsapp: true,
      _count: { select: { projects: true, favorites: true } },
      projects: {
        select: { id: true, title: true, status: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Анкета Google/Apple-акаунту ще не заповнена (телефон, роль тощо) —
  // повертаємо на онбординг, доки цього не зроблено.
  if (!isProfileComplete(user)) {
    redirect("/onboarding");
  }

  const telegramContact = formatTelegramContact(user.telegram);
  const whatsappContact = formatWhatsappContact(user.whatsapp);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-ink">{user.fullName}</h1>
          <p className="text-ink/60">{user.university}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link href="/profile/edit">
            <Button type="button" variant="secondary" size="sm">
              Редагувати профіль
            </Button>
          </Link>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Вийти
            </Button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center rounded-full border-[3px] border-ink bg-accent-2 px-3 py-1 font-heading text-xs font-bold uppercase tracking-wide text-ink">
          {user.role ? ROLE_LABELS[user.role] : "Роль не обрана"}
        </span>
        {user.primaryVertical ? (
          <span className="inline-flex items-center rounded-full border-[3px] border-ink bg-paper px-3 py-1 font-heading text-xs font-bold uppercase tracking-wide text-ink">
            {VERTICAL_LABELS[user.primaryVertical]}
          </span>
        ) : null}
      </div>

      <dl className="flex flex-col gap-4 rounded-2xl border-[3px] border-ink bg-paper p-6 shadow-[4px_4px_0_0_var(--color-ink)]">
        <div className="flex justify-between gap-4">
          <dt className="font-semibold text-ink/60">Email</dt>
          <dd className="text-ink">{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-semibold text-ink/60">Телефон</dt>
          <dd className="text-ink">{user.phone}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-semibold text-ink/60">Навчальний заклад</dt>
          <dd className="text-ink">{user.university}</dd>
        </div>
        {user.faculty ? (
          <div className="flex justify-between gap-4">
            <dt className="font-semibold text-ink/60">Факультет</dt>
            <dd className="text-ink">{user.faculty}</dd>
          </div>
        ) : null}
        {telegramContact ? (
          <div className="flex justify-between gap-4">
            <dt className="font-semibold text-ink/60">Telegram</dt>
            <dd className="text-ink">
              <a
                href={telegramContact.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-2 underline-offset-4 hover:text-accent"
              >
                {telegramContact.label.replace(/^Telegram: /, "")}
              </a>
            </dd>
          </div>
        ) : null}
        {whatsappContact ? (
          <div className="flex justify-between gap-4">
            <dt className="font-semibold text-ink/60">WhatsApp</dt>
            <dd className="text-ink">
              <a
                href={whatsappContact.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-2 underline-offset-4 hover:text-accent"
              >
                {whatsappContact.label.replace(/^WhatsApp: /, "")}
              </a>
            </dd>
          </div>
        ) : null}
        {user.role === "CREATOR" ? (
          <div className="flex justify-between gap-4">
            <dt className="font-semibold text-ink/60">Проєктів завантажено</dt>
            <dd className="text-ink">{user._count.projects}</dd>
          </div>
        ) : null}
      </dl>

      <Link
        href="/favorites"
        className="flex items-center justify-between gap-4 rounded-2xl border-[3px] border-ink bg-paper px-6 py-4 shadow-[4px_4px_0_0_var(--color-ink)] hover:bg-ink/5"
      >
        <span className="font-heading text-lg font-bold text-ink">Обрані проєкти</span>
        <span className="inline-flex items-center rounded-full border-[3px] border-ink bg-accent-2 px-3 py-1 font-heading text-xs font-bold text-ink">
          {user._count.favorites}
        </span>
      </Link>

      {user.role === "CREATOR" ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-xl font-bold text-ink">Мої проєкти</h2>
            <Link href="/projects/new">
              <Button size="sm">Завантажити проєкт</Button>
            </Link>
          </div>

          {user.projects.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {user.projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border-[3px] border-ink bg-paper px-4 py-3 hover:bg-ink/5"
                  >
                    <span className="font-semibold text-ink">{project.title}</span>
                    <StatusBadge status={PROJECT_STATUS_TO_BADGE[project.status]} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/60">Ще немає жодного проєкту — почніть із першого.</p>
          )}
        </div>
      ) : null}
    </main>
  );
}
