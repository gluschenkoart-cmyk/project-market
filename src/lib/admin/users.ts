import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";

export const ADMIN_USERS_PAGE_SIZE = 30;

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole | null;
  createdAt: Date;
  projectCount: number;
  /** Обчислено з ADMIN_EMAILS (src/lib/admin.ts), а не окремого поля в
   * базі — щоб у списку було видно, хто вже має доступ до /admin. */
  isAdmin: boolean;
}

export interface AdminUsersPage {
  items: AdminUserRow[];
  totalCount: number;
  totalPages: number;
}

/** Список усіх зареєстрованих акаунтів для адмінки (Етап 7, пункт 4 з
 * узгодженого плану) — без блокування (свідомо відкладено, рішення Артема
 * від 02.09.2026), лише огляд. */
export async function getAdminUsersPage(page: number): Promise<AdminUsersPage> {
  const safePage = Number.isFinite(page) && page > 1 ? Math.trunc(page) : 1;

  const [rows, totalCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * ADMIN_USERS_PAGE_SIZE,
      take: ADMIN_USERS_PAGE_SIZE,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      role: row.role,
      createdAt: row.createdAt,
      projectCount: row._count.projects,
      isAdmin: isAdminEmail(row.email),
    })),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_USERS_PAGE_SIZE)),
  };
}
