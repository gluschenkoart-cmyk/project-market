import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { isAdminEmail } from "@/lib/admin";

/**
 * Окремий, edge-безпечний інстанс Auth.js — лише щоб прочитати, чи є
 * дійсна сесія (не викликає Prisma). Повний інстанс — src/auth.ts.
 */
const { auth } = NextAuth(authConfig);

/**
 * Захищає /profile, /onboarding, /projects/new, /favorites і /admin —
 * неавторизованих відправляємо на /login. Чи заповнена анкета (роль,
 * напрям тощо) і чи саме Творець перед нами middleware НЕ перевіряє — це
 * потребувало б бази даних, а тому робиться в самих сторінках, які
 * виконуються в Node.js (/profile, /onboarding, /projects/new/page.tsx).
 * /favorites (Етап 6) перевіряє тільки наявність сесії — без бази — тому
 * теж підходить сюди, хоча сторінка й дублює цю ж перевірку про всяк
 * випадок.
 *
 * /admin (Етап 7) — виняток: тут middleware ОДРАЗУ ж відсіює залогінених,
 * але не адміністраторів, а не лише неавторизованих. Це можливо без
 * Prisma, бо email людини вже є в JWT-токені (isAdminEmail — звичайні
 * рядкові операції, src/lib/admin.ts) — швидший і надійніший перший
 * бар'єр, ніж чекати рендеру сторінки. Сторінки й дії всередині /admin
 * повторюють цю саму перевірку (src/lib/admin/access.ts) — той самий
 * принцип "не покладатись лише на приховання в інтерфейсі", що вже є в
 * /api/projects.
 */
export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (req.nextUrl.pathname.startsWith("/admin") && !isAdminEmail(req.auth.user?.email)) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/profile/:path*", "/onboarding/:path*", "/projects/new", "/favorites", "/admin/:path*"],
};
