import type { NextAuthConfig } from "next-auth";

/**
 * Частина конфігурації Auth.js, безпечна для Edge Runtime (middleware).
 * Middleware НЕ МОЖЕ імпортувати Prisma (потребує Node.js) — тому тут немає
 * ані adapter, ані провайдерів з authorize()-логікою до бази даних. Повна
 * конфігурація — у src/auth.ts, для Route Handler, Server Actions і
 * Server Components (усі виконуються в Node.js, не в Edge).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
} satisfies NextAuthConfig;
