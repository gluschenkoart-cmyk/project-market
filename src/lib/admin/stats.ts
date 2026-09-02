import type { ProjectStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface AdminStats {
  usersByRole: { role: UserRole | null; count: number }[];
  totalUsers: number;
  projectsByStatus: { status: ProjectStatus; count: number }[];
  totalProjects: number;
  hiddenProjectsCount: number;
  contactUnlocksCount: number;
  contactUnlocksRevenueUah: number;
}

/**
 * Прості цифри для головної сторінки адмінки (Етап 7, пункт 6 з
 * узгодженого плану) — без окремої аналітики, лише кілька агрегатних
 * запитів, щоб одним поглядом бачити стан платформи.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const [usersByRoleRaw, totalUsers, projectsByStatusRaw, totalProjects, hiddenProjectsCount, unlocksAgg] =
    await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.user.count(),
      prisma.project.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.project.count(),
      prisma.project.count({ where: { isHidden: true } }),
      prisma.contactUnlock.aggregate({
        where: { status: "SUCCESS" },
        _count: { _all: true },
        _sum: { amountUah: true },
      }),
    ]);

  return {
    usersByRole: usersByRoleRaw.map((row) => ({ role: row.role, count: row._count._all })),
    totalUsers,
    projectsByStatus: projectsByStatusRaw.map((row) => ({ status: row.status, count: row._count._all })),
    totalProjects,
    hiddenProjectsCount,
    contactUnlocksCount: unlocksAgg._count._all,
    contactUnlocksRevenueUah: unlocksAgg._sum.amountUah ? unlocksAgg._sum.amountUah.toNumber() : 0,
  };
}
