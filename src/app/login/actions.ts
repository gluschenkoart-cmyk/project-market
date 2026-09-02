"use server";

import { AuthError } from "next-auth";
import { loginSchema } from "@/lib/validation/auth";
import { signIn } from "@/auth";

export interface LoginFormState {
  fieldErrors: Partial<Record<string, string>>;
  formError?: string;
}

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

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

  const redirectTo = (formData.get("from") as string | null) || "/profile";

  try {
    await signIn("credentials", { ...parsed.data, redirectTo });
  } catch (error) {
    // Успішний signIn сам кидає службовий NEXT_REDIRECT — пропускаємо його далі.
    if (error instanceof AuthError) {
      return { fieldErrors: {}, formError: "Неправильний email або пароль" };
    }
    throw error;
  }

  return { fieldErrors: {} };
}
