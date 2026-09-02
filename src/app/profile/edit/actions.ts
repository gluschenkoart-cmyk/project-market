"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { profileEditSchema } from "@/lib/validation/profile";
import { firstIssueByField } from "@/lib/validation/form-errors";

export interface EditProfileFormState {
  fieldErrors: Partial<Record<string, string>>;
  formError?: string;
}

/**
 * Редагування профілю (Етап 6) — на відміну від онбордингу, ця дія
 * доступна БУДЬ-КОЛИ після заповнення анкети, не лише один раз. Роль і
 * напрям тут навмисно не змінюються (див. коментар у
 * src/lib/validation/profile.ts).
 */
export async function updateProfileAction(
  _prevState: EditProfileFormState,
  formData: FormData,
): Promise<EditProfileFormState> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const parsed = profileEditSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: firstIssueByField(parsed.error.issues) };
  }

  const { fullName, phone, university, faculty, telegram, whatsapp } = parsed.data;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName,
        phone,
        university,
        faculty: faculty || null,
        telegram: telegram || null,
        whatsapp: whatsapp || null,
      },
    });
  } catch (error) {
    console.error("Не вдалося оновити профіль:", error);
    return { fieldErrors: {}, formError: "Щось пішло не так. Спробуйте ще раз." };
  }

  redirect("/profile");
}
