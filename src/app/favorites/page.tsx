import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFavoriteProjects } from "@/lib/projects/favorites";
import { PROJECT_STATUS_TO_BADGE } from "@/lib/project-status";
import { ProjectCard } from "@/components/ui/ProjectCard";

/**
 * "Обране" (Етап 6) — доступно і Творцю, і Отримувачу (рішення Артема від
 * 02.09.2026), єдина вимога — бути залогіненим. На відміну від стрічки
 * (src/app/page.tsx) тут немає фільтрів чи пагінації — список зазвичай
 * невеликий, і людина сама його наповнює.
 */
export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?from=/favorites");
  }

  const projects = await getFavoriteProjects(session.user.id);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2 text-center sm:text-left">
        <h1 className="font-heading text-3xl font-extrabold text-ink sm:text-4xl">
          Обране
        </h1>
        <p className="text-ink/70">Проєкти, які ви зберегли собі зі стрічки.</p>
      </header>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-[3px] border-dashed border-ink/30 px-6 py-20 text-center">
          <p className="font-heading text-lg font-bold text-ink">Тут поки що порожньо</p>
          <p className="max-w-sm text-sm text-ink/60">
            Натисніть на серце на будь-якій картці проєкту, щоб зберегти
            його сюди.
          </p>
          <Link
            href="/"
            className="mt-2 text-sm font-semibold text-ink underline decoration-2 underline-offset-4"
          >
            До стрічки проєктів
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
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
              favorite={{ isFavorited: true, isAuthenticated: true }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
