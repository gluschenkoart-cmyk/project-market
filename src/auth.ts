import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
import { authConfig } from "@/auth.config";
import { isAdminEmail } from "@/lib/admin";

/**
 * Повна автентифікація (Node.js-рантайм): email+пароль і вхід через
 * Google/Apple (CLAUDE.md: "реєстрація — email, можливо Google" — Google і
 * Apple додано на прохання Артема; обидва вимагають, щоб він сам створив
 * OAuth-застосунок у Google Cloud Console / Apple Developer і додав ключі
 * в .env — див. docs/auth.md).
 *
 * PrismaAdapter зберігає OAuth-акаунти (Account/Session-таблиці), але
 * сесії лишаються JWT (`session.strategy` з auth.config.ts) — це вимога
 * Auth.js: Credentials-провайдер несумісний із сесіями в базі даних.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Адміністраторські email (ADMIN_EMAILS, src/lib/admin.ts) навмисно
        // НЕ можуть входити паролем — лише через Google/Apple, де сам
        // провайдер підтверджує володіння цією поштою. Реєстрація й вхід
        // паролем нічого не перевіряють, крім унікальності рядка в базі
        // (registerAction) — без цієї заборони будь-хто міг би
        // зареєструватись на чужу адміністраторську адресу email+паролем,
        // не маючи до неї доступу, і отримати повний доступ до /admin.
        if (isAdminEmail(parsed.data.email)) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;

        const passwordMatches = await compare(parsed.data.password, user.passwordHash);
        if (!passwordMatches) return null;

        return { id: user.id, email: user.email, name: user.fullName ?? user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
