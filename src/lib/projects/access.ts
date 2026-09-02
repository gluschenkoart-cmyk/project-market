import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export interface ViewerAccess {
  isAuthenticated: boolean;
  /** Задано лише коли isAuthenticated — для стрічки (Етап 6, позначка "в
   * обраному" на картках) і подібних місць, яким потрібен саме id. */
  userId?: string;
  /** Чи бачить ця людина панель детальних фільтрів (рішення від
   * 01.09.2026, CLAUDE.md: "Пошук — тільки для Отримувача"). */
  isReceiver: boolean;
}

/**
 * Хто дивиться стрічку (Етап 5). Роль читаємо ЗАВЖДИ свіжою з бази, а не
 * з JWT-сесії: вона могла з'явитись уже ПІСЛЯ входу — на онбордингу
 * (людина увійшла через Google, роль ще null, обрала "Отримувач" тільки-но
 * на /onboarding) — і сесія-JWT цього не знає, доки не перевходить. Той
 * самий підхід уже в /profile і /projects/new/page.tsx.
 *
 * Використовується і на сервері для першої сторінки (src/app/page.tsx), і
 * в /api/projects для кожної наступної — щоб Отримувач-only фільтри не
 * можна було обійти прямим запитом до API в обхід інтерфейсу.
 */
export async function resolveViewerAccess(): Promise<ViewerAccess> {
  const session = await auth();
  if (!session?.user) {
    return { isAuthenticated: false, isReceiver: false };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return { isAuthenticated: true, userId: session.user.id, isReceiver: user?.role === "RECEIVER" };
}
