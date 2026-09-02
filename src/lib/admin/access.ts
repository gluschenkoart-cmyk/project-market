import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";

export interface AdminAccess {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

/**
 * Те саме, що resolveViewerAccess (src/lib/projects/access.ts), але для
 * прав адміністратора (Етап 7) — використовується на /admin-сторінках і в
 * їхніх діях (Node.js-рантайм, повний auth() з src/auth.ts). На відміну
 * від ролі Творець/Отримувач (яка читається ЗАВЖДИ свіжою з бази, бо може
 * з'явитись уже після входу — онбординг), email людини незмінний після
 * реєстрації, тому довіряти йому із сесії тут безпечно, без окремого
 * запиту в базу.
 *
 * middleware.ts НЕ може викликати цю функцію напряму (Edge-рантайм
 * забороняє Prisma, а auth() з src/auth.ts підключає Prisma-адаптер) —
 * там та сама перевірка робиться через isAdminEmail(req.auth?.user?.email)
 * окремо, вже маючи сесію з edge-безпечного auth.config.ts.
 */
export async function resolveAdminAccess(): Promise<AdminAccess> {
  const session = await auth();
  return {
    isAuthenticated: Boolean(session?.user),
    isAdmin: isAdminEmail(session?.user?.email),
  };
}
