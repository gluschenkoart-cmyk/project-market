"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { primaryVerticalSchema } from "@/lib/validation/onboarding";

export interface VerticalFormState {
  fieldErrors: Partial<Record<string, string>>;
}

export async function primaryVerticalAction(
  _prevState: VerticalFormState,
  formData: FormData,
): Promise<VerticalFormState> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const parsed = primaryVerticalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: { primaryVertical: "Оберіть один напрям" } };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { primaryVertical: parsed.data.primaryVertical },
  });

  redirect("/profile");
}
