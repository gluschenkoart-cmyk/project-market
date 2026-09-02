"use server";

import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { onboardingContactSchema, roleSchema } from "@/lib/validation/onboarding";

export interface OnboardingFormState {
  fieldErrors: Partial<Record<string, string>>;
}

export async function onboardingAction(
  _prevState: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    redirect("/login");
  }

  // Що саме запитувати, вирішуємо тут-таки за поточним станом акаунта —
  // не довіряємо прихованим полям із форми, які людина теоретично могла
  // б підмінити.
  const needsContact = !user.phone || !user.university || !user.copyrightConfirmed;

  const fieldErrors: Partial<Record<string, string>> = {};
  const data: Prisma.UserUpdateInput = {};

  if (needsContact) {
    const parsedContact = onboardingContactSchema.safeParse(Object.fromEntries(formData));
    if (!parsedContact.success) {
      for (const issue of parsedContact.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
    } else {
      data.fullName = parsedContact.data.fullName;
      data.phone = parsedContact.data.phone;
      data.university = parsedContact.data.university;
      data.faculty = parsedContact.data.faculty || null;
      data.copyrightConfirmed = parsedContact.data.copyrightConfirmed;
    }
  }

  const parsedRole = roleSchema.safeParse(Object.fromEntries(formData));
  if (!parsedRole.success) {
    fieldErrors.role = "Оберіть один з двох варіантів";
  } else {
    data.role = parsedRole.data.role;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  await prisma.user.update({ where: { id: user.id }, data });

  redirect(parsedRole.success && parsedRole.data.role === "CREATOR" ? "/onboarding/vertical" : "/profile");
}
