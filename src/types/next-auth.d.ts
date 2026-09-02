import type { DefaultSession } from "next-auth";

/**
 * Auth.js за замовчуванням не знає про наше поле `id` на session.user і на
 * JWT-токені — розширюємо обидва типи, щоб `session.user.id` і `token.id`
 * не викликали помилку TypeScript у src/auth.ts та в захищених сторінках.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
