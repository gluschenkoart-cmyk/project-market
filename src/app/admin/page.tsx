import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveAdminAccess } from "@/lib/admin/access";
import { getAdminStats } from "@/lib/admin/stats";
import { PROJECT_STATUS_LABELS } from "@/lib/project-status";
import { ROLE_LABELS } from "@/lib/user-role";
import { Button } from "@/components/ui/Button";

const CURRENCY_FORMAT = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
});

/**
 * Головна сторінка адмінки (Етап 7) — прості цифри (пункт 6 узгодженого
 * плану) плюс вхід до двох списків нижче. Доступ перевіряється тут-таки,
 * не лише в middleware.ts (Edge-перевірка там — перший, швидший бар'єр;
 * ця — той самий принцип "не довіряти лише прихованням в інтерфейсі", що
 * вже є в /api/projects, src/lib/projects/access.ts).
 */
export default async function AdminDashboardPage() {
  const { isAuthenticated, isAdmin } = await resolveAdminAccess();
  if (!isAuthenticated) {
    redirect("/login?from=/admin");
  }
  if (!isAdmin) {
    redirect("/");
  }

  const stats = await getAdminStats();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-extrabold text-ink">Адмінка</h1>
        <p className="text-ink/70">Базова модерація платформи (Етап 7).</p>
      </header>

      <nav className="flex flex-wrap gap-3">
        <Link href="/admin/projects">
          <Button variant="secondary">Усі проєкти</Button>
        </Link>
        <Link href="/admin/users">
          <Button variant="secondary">Усі користувачі</Button>
        </Link>
      </nav>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Користувачі" value={stats.totalUsers}>
          <ul className="flex flex-col gap-1">
            {stats.usersByRole.map((row) => (
              <li key={row.role ?? "none"}>
                {row.role ? ROLE_LABELS[row.role] : "Роль не обрана"}: {row.count}
              </li>
            ))}
          </ul>
        </StatCard>

        <StatCard title="Проєкти" value={stats.totalProjects}>
          <ul className="flex flex-col gap-1">
            {stats.projectsByStatus.map((row) => (
              <li key={row.status}>
                {PROJECT_STATUS_LABELS[row.status]}: {row.count}
              </li>
            ))}
          </ul>
          {stats.hiddenProjectsCount > 0 ? (
            <p className="mt-2 font-semibold text-accent">
              Приховано модератором: {stats.hiddenProjectsCount}
            </p>
          ) : null}
        </StatCard>

        <StatCard title="Оплачені розблокування контактів" value={stats.contactUnlocksCount}>
          <p>На суму {CURRENCY_FORMAT.format(stats.contactUnlocksRevenueUah)}</p>
        </StatCard>
      </section>
    </main>
  );
}

function StatCard({ title, value, children }: { title: string; value: number; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border-[3px] border-ink bg-paper p-6 shadow-[4px_4px_0_0_var(--color-ink)]">
      <p className="font-heading text-sm font-bold uppercase tracking-wide text-ink/50">{title}</p>
      <p className="font-heading text-3xl font-extrabold text-ink">{value}</p>
      {children ? <div className="text-sm text-ink/70">{children}</div> : null}
    </div>
  );
}
