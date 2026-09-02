import type { Prisma, ProjectStatus, Vertical } from "@prisma/client";
import { prisma } from "@/lib/db";

export const ADMIN_PROJECTS_PAGE_SIZE = 30;

export interface AdminProjectFilters {
  status?: ProjectStatus;
  vertical?: Vertical;
}

export interface AdminProjectRow {
  id: string;
  title: string;
  vertical: Vertical;
  status: ProjectStatus;
  priceUah: number | null;
  isHidden: boolean;
  hiddenReason: string | null;
  createdAt: Date;
  authorName: string | null;
  authorEmail: string;
}

export interface AdminProjectsPage {
  items: AdminProjectRow[];
  totalCount: number;
  totalPages: number;
}

/**
 * Список УСІХ проєктів для адмінки (Етап 7) — на відміну від публічної
 * стрічки (src/lib/projects/feed.ts), тут не показуємо фільтри за Project
 * DNA (стиль, площа тощо) — лише статус і вертикаль, які є звичайними
 * колонками таблиці. Тому звичайного prisma.findMany досить, сирий SQL
 * (як у feed.ts) тут не виправданий — та сама логіка, що й у
 * src/lib/projects/favorites.ts. І, на відміну від публічної стрічки,
 * приховані модератором проєкти тут навпаки МАЮТЬ бути видимі — інакше
 * адмін не зміг би повернути їх назад.
 */
export async function getAdminProjectsPage(
  filters: AdminProjectFilters,
  page: number,
): Promise<AdminProjectsPage> {
  const where: Prisma.ProjectWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.vertical ? { vertical: filters.vertical } : {}),
  };

  const safePage = Number.isFinite(page) && page > 1 ? Math.trunc(page) : 1;

  const [rows, totalCount] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * ADMIN_PROJECTS_PAGE_SIZE,
      take: ADMIN_PROJECTS_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        vertical: true,
        status: true,
        priceUah: true,
        isHidden: true,
        hiddenReason: true,
        createdAt: true,
        author: { select: { fullName: true, email: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      vertical: row.vertical,
      status: row.status,
      priceUah: row.priceUah ? row.priceUah.toNumber() : null,
      isHidden: row.isHidden,
      hiddenReason: row.hiddenReason,
      createdAt: row.createdAt,
      authorName: row.author.fullName,
      authorEmail: row.author.email,
    })),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_PROJECTS_PAGE_SIZE)),
  };
}
