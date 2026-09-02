"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation/auth";
import { signIn } from "@/auth";
import { isAdminEmail } from "@/lib/admin";

export interface RegisterFormState {
  fieldErrors: Partial<Record<string, string>>;
  formError?: string;
}

const SALT_ROUNDS = 12;

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const fieldErrors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const { email, password, fullName, phone, university, faculty, copyrightConfirmed } =
    parsed.data;

  // Безпека (знайдено при перевірці Етапу 8): email+пароль тут нічого не
  // підтверджує, окрім унікальності рядка в базі — без цієї заборони
  // будь-хто міг би зареєструватись на адміністраторську адресу
  // (ADMIN_EMAILS) раніше за самого адміністратора й отримати повний
  // доступ до /admin. Для цих адрес вхід можливий лише через Google/Apple
  // (src/auth.ts), де провайдер сам підтверджує володіння поштою.
  if (isAdminEmail(email)) {
    return {
      fieldErrors: {
        email: "Ця адреса адміністраторська — увійдіть через Google, а не паролем",
      },
    };
  }

  try {
    const passwordHash = await hash(password, SALT_ROUNDS);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        university,
        faculty: faculty || null,
        copyrightConfirmed,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { email: "Цей email вже зареєстровано" } };
    }
    return { fieldErrors: {}, formError: "Щось пішло не так. Спробуйте ще раз." };
  }

  // Реєстрація одразу входить у профіль — не змушуємо вводити пароль двічі поспіль.
  try {
    await signIn("credentials", { email, password, redirectTo: "/profile" });
  } catch (error) {
    // signIn на успіху сам кидає внутрішній NEXT_REDIRECT — це не помилка,
    // а спосіб Next.js виконати редірект, тож прокидаємо його далі.
    if (error instanceof AuthError) {
      // Акаунт створено, але автоматичний вхід не вдався — не критично,
      // користувач просто увійде вручну.
      redirect("/login");
    }
    throw error;
  }

  // TypeScript не знає, що успішний signIn() із redirectTo завжди кидає
  // внутрішній NEXT_REDIRECT (перехоплюється в catch вище) — цей рядок
  // ніколи не виконається насправді, але потрібен явний return на кожному
  // шляху функції (виявлено при першій реальній збірці проєкту на Vercel).
  return { fieldErrors: {} };
}
