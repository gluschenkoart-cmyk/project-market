import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveAdminAccess } from "@/lib/admin/access";
import {
  getAdminProjectsPage,
  type AdminProjectFilters,
  type AdminProjectRow,
} from "@/lib/admin/projects";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TO_BADGE, PROJECT_STATUS_VALUES } from "@/lib/project-status";
import { VERTICALS, VERTICAL_LABELS } from "@/lib/validation/onboarding";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/SelectField";
import { Pagination } from "@/components/ui/Pagination";
import { setProjectHiddenAction } from "./actions";

interface AdminProjectsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const DATE_FORMAT = new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium" });

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value: string | string[] | undefined) {
  const v = firstValue(value);
  return v && (PROJECT_STATUS_VALUES as readonly string[]).includes(v)
    ? (v as AdminProjectFilters["status"])
    : undefined;
}

function parseVertical(value: string | string[] | undefined) {
  const v = firstValue(value);
  return v && (VERTICALS as readonly string[]).includes(v) ? (v as AdminProjectFilters["vertical"]) : undefined;
}

function parsePage(value: string | string[] | undefined): number {
  const v = Number(firstValue(value));
  return Number.isFinite(v) && v > 1 ? Math.trunc(v) : 1;
}

/** Query string для повернення на той самий фільтр/сторінку після дії
 * "Приховати"/"Показати" (передається в setProjectHiddenAction нижче) і для
 * посилань пагінації. */
function buildHref(filters: AdminProjectFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.vertical) params.set("vertical", filters.vertical);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/projects?${qs}` : "/admin/projects";
}

export default async function AdminProjectsPage({ searchParams }: AdminProjectsPageProps) {
  const { isAuthenticated, isAdmin } = await resolveAdminAccess();
  if (!isAuthenticated) {
    redirect("/login?from=/admin/projects");
  }
  if (!isAdmin) {
    redirect("/");
  }

  const resolved = await searchParams;
  const filters: AdminProjectFilters = {
    status: parseStatus(resolved.status),
    vertical: parseVertical(resolved.vertical),
  };
  const page = parsePage(resolved.page);

  const { items, totalPages } = await getAdminProjectsPage(filters, page);
  const returnTo = buildHref(filters, page);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-extrabold text-ink">Проєкти</h1>
        <p className="text-ink/70">Усі проєкти платформи — приховані модератором теж видно тут.</p>
        <Link href="/admin" className="text-sm font-semibold text-ink underline decoration-2 underline-offset-4">
          ← До адмінки
        </Link>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <SelectField
            label="Статус"
            name="status"
            defaultValue={filters.status ?? ""}
            placeholder="Усі статуси"
            options={PROJECT_STATUS_VALUES.map((value) => ({ value, label: PROJECT_STATUS_LABELS[value] }))}
          />
        </div>
        <div className="w-56">
          <SelectField
            label="Вертикаль"
            name="vertical"
            defaultValue={filters.vertical ?? ""}
            placeholder="Усі вертикалі"
            options={VERTICALS.map((value) => ({ value, label: VERTICAL_LABELS[value] }))}
          />
        </div>
        <Button type="submit" variant="secondary">
          Застосувати
        </Button>
        {filters.status || filters.vertical ? (
          <Link
            href="/admin/projects"
            className="text-sm font-semibold text-ink underline decoration-2 underline-offset-4"
          >
            Скинути фільтр
          </Link>
        ) : null}
      </form>

      {items.length === 0 ? (
        <p className="rounded-2xl border-[3px] border-dashed border-ink/30 px-6 py-12 text-center text-ink/60">
          Проєктів за цим фільтром немає.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-[3px] border-ink">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b-[3px] border-ink bg-paper font-heading text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Проєкт</th>
                <th className="px-4 py-3">Автор</th>
                <th className="px-4 py-3">Вертикаль</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Створено</th>
                <th className="px-4 py-3">Модерація</th>
              </tr>
            </thead>
            <tbody>
              {items.map((project) => (
                <tr key={project.id} className="border-b border-ink/10 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      target="_blank"
                      className="font-semibold text-ink underline decoration-2 underline-offset-4 hover:text-accent"
                    >
                      {project.title}
                    </Link>
                    {project.isHidden ? (
                      <span className="ml-2 inline-flex items-center rounded-full border-[2px] border-ink bg-accent-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
                        Приховано
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {project.authorName ?? "—"}
                    <br />
                    <span className="text-xs text-ink/50">{project.authorEmail}</span>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{VERTICAL_LABELS[project.vertical]}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={PROJECT_STATUS_TO_BADGE[project.status]} />
                  </td>
                  <td className="px-4 py-3 text-ink/60">{DATE_FORMAT.format(project.createdAt)}</td>
                  <td className="px-4 py-3">
                    <ModerationCell project={project} returnTo={returnTo} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} hrefForPage={(p) => buildHref(filters, p)} />
    </main>
  );
}

function ModerationCell({ project, returnTo }: { project: AdminProjectRow; returnTo: string }) {
  if (project.isHidden) {
    return (
      <form action={setProjectHiddenAction.bind(null, project.id, false, returnTo)} className="flex flex-col items-start gap-1">
        {project.hiddenReason ? (
          <p className="max-w-[14rem] text-xs text-ink/50">Причина: {project.hiddenReason}</p>
        ) : null}
        <Button type="submit" size="sm">
          Показати
        </Button>
      </form>
    );
  }

  return (
    <form
      action={setProjectHiddenAction.bind(null, project.id, true, returnTo)}
      className="flex flex-col items-start gap-2"
    >
      <input
        type="text"
        name="reason"
        placeholder="Причина (необов'язково)"
        aria-label="Причина приховання"
        maxLength={300}
        className="w-44 rounded-lg border-[2px] border-ink bg-paper px-2 py-1 text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <Button type="submit" variant="secondary" size="sm">
        Приховати
      </Button>
    </form>
  );
}
