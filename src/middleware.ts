import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

/**
 * Окремий, edge-безпечний інстанс Auth.js — лише щоб прочитати, чи є
 * дійсна сесія (не викликає Prisma). Повний інстанс — src/auth.ts.
 */
const { auth } = NextAuth(authConfig);

/**
 * Захищає /profile, /onboarding, /projects/new і /favorites —
 * неавторизованих відправляємо на /login. Чи заповнена анкета (роль,
 * напрям тощо) і чи саме Творець перед нами middleware НЕ перевіряє — це
 * потребувало б бази даних, а тому робиться в самих сторінках, які
 * виконуються в Node.js (/profile, /onboarding, /projects/new/page.tsx).
 * /favorites (Етап 6) перевіряє тільки наявність сесії — без бази — тому
 * теж підходить сюди, хоча сторінка й дублює цю ж перевірку про всяк
 * випадок.
 */
export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/profile/:path*", "/onboarding/:path*", "/projects/new", "/favorites"],
};
