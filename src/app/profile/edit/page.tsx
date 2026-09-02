import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isProfileComplete } from "@/lib/onboarding";
import { EditProfileForm } from "./EditProfileForm";

/**
 * Редагування профілю (Етап 6) — захищена сторінка, як і /profile. На
 * відміну від /onboarding, сюди можна повертатись скільки завгодно разів.
 */
export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    redirect("/login");
  }

  // Якщо анкета ще не заповнена — спершу онбординг, туди й повертаємось.
  if (!isProfileComplete(user)) {
    redirect("/onboarding");
  }

  return (
    <EditProfileForm
      initialValues={{
        fullName: user.fullName ?? "",
        phone: user.phone ?? "",
        university: user.university ?? "",
        faculty: user.faculty ?? "",
        telegram: user.telegram ?? "",
        whatsapp: user.whatsapp ?? "",
      }}
    />
  );
}
