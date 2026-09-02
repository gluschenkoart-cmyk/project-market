import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveAdminAccess } from "@/lib/admin/access";
import { getAdminUsersPage } from "@/lib/admin/users";
import { ROLE_LABELS } from "@/lib/user-role";
import { Pagination } from "@/components/ui/Pagination";

interface AdminUsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const DATE_FORMAT = new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium" });

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 1 ? Math.trunc(parsed) : 1;
}

/**
 * Список усіх зареєстрованих акаунтів (Етап 7, пункт 4 з узгодженого
 * плану) — без блокування (свідомо відкладено, рішення Артема від
 * 02.09.2026: "поки без блокування"), лише огляд бета-тесту в одному
 * місці.
 */
export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { isAuthenticated, isAdmin } = await resolveAdminAccess();
  if (!isAuthenticated) {
    redirect("/login?from=/admin/users");
  }
  if (!isAdmin) {
    redirect("/");
  }

  const resolved = await searchParams;
  const page = parsePage(resolved.page);
  const { items, totalPages } = await getAdminUsersPage(page);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-extrabold text-ink">Користувачі</h1>
        <p className="text-ink/70">Усі зареєстровані акаунти платформи.</p>
        <Link href="/admin" className="text-sm font-semibold text-ink underline decoration-2 underline-offset-4">
          ← До адмінки
        </Link>
      </header>

      <div className="overflow-x-auto rounded-2xl border-[3px] border-ink">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b-[3px] border-ink bg-paper font-heading text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Ім&apos;я</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3">Проєктів</th>
              <th className="px-4 py-3">Зареєстрований</th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr key={user.id} className="border-b border-ink/10 last:border-0">
                <td className="px-4 py-3 text-ink">
                  {user.email}
                  {user.isAdmin ? (
                    <span className="ml-2 inline-flex items-center rounded-full border-[2px] border-ink bg-accent-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
                      Адмін
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-ink/70">{user.fullName ?? "—"}</td>
                <td className="px-4 py-3 text-ink/70">{user.role ? ROLE_LABELS[user.role] : "—"}</td>
                <td className="px-4 py-3 text-ink/70">{user.projectCount}</td>
                <td className="px-4 py-3 text-ink/60">{DATE_FORMAT.format(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) => (p > 1 ? `/admin/users?page=${p}` : "/admin/users")}
      />
    </main>
  );
}
