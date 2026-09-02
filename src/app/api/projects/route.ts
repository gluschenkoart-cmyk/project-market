import { NextResponse, type NextRequest } from "next/server";
import { resolveViewerAccess } from "@/lib/projects/access";
import { getProjectFeedPage } from "@/lib/projects/feed";
import { parseProjectFilters } from "@/lib/validation/project-filters";

/**
 * Довантаження наступних сторінок нескінченної стрічки (Етап 5) —
 * викликає клієнтський компонент src/app/ProjectFeed.tsx. Перша сторінка
 * рендериться одразу на сервері в src/app/page.tsx (швидший перший показ
 * і видимість для Google); ця ручка — лише для сторінки 2 і далі.
 *
 * Результат ніколи не кешується статично: він залежить і від ролі
 * користувача (Отримувач бачить більше фільтрів), і від довільних
 * параметрів пошуку в URL.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Роль перевіряємо на сервері, а не довіряємо тому, що інтерфейс просто
  // не показав панель фільтрів — інакше Творець міг би обійти обмеження
  // "пошук — тільки для Отримувача" (CLAUDE.md) прямим запитом до цієї
  // ручки, без потреби навіть заводити другий акаунт.
  const { isReceiver, userId } = await resolveViewerAccess();
  const filters = parseProjectFilters(searchParams, { basicOnly: !isReceiver });

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isFinite(pageParam) && pageParam > 1 ? Math.trunc(pageParam) : 1;

  const result = await getProjectFeedPage(filters, { page, viewerId: userId });

  return NextResponse.json(result);
}
