import { prisma } from "@/lib/db";
import { TYPOLOGY_LABELS, type ArchitectureDna } from "@/lib/validation/architecture-dna";
import type { FeedProject } from "@/lib/projects/feed";

/**
 * "Обране" (Етап 6) — на відміну від стрічки (src/lib/projects/feed.ts),
 * тут нема ні фільтрів, ні числових діапазонів по Project DNA, тож
 * звичайного prisma.findMany досить: сирий SQL там був виправданий саме
 * складністю фільтрів, а не сам по собі "кращий" спосіб читати проєкти.
 */
export async function getFavoriteProjects(userId: string): Promise<FeedProject[]> {
  const favorites = await prisma.favoriteProject.findMany({
    // Приховані модератором проєкти (Етап 7) не показуємо і тут — та сама
    // логіка, що й у публічній стрічці (src/lib/projects/feed.ts).
    where: { userId, project: { isHidden: false } },
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        include: {
          author: { select: { fullName: true, university: true } },
          files: { orderBy: { order: "asc" }, take: 1 },
        },
      },
    },
  });

  return favorites.map(({ project }) => {
    const dna = project.dna as unknown as ArchitectureDna;
    return {
      id: project.id,
      title: project.title,
      status: project.status,
      priceUah: project.priceUah ? project.priceUah.toNumber() : null,
      authorName: project.author.fullName ?? "Автор",
      university: project.author.university ?? "",
      typologyLabel: TYPOLOGY_LABELS[dna.typology] ?? dna.typology,
      areaSqm: dna.totalAreaSqm,
      floors: dna.floors,
      previewUrl: project.files[0]?.url ?? null,
      isFavorited: true,
    };
  });
}

export async function isProjectFavorited(userId: string, projectId: string): Promise<boolean> {
  const favorite = await prisma.favoriteProject.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { id: true },
  });
  return favorite !== null;
}
