import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isProfileComplete } from "@/lib/onboarding";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    redirect("/login");
  }

  // Профіль уже повний (напр. людина повернулась на /onboarding вручну) —
  // нема чого тут робити.
  if (isProfileComplete(user)) {
    redirect("/profile");
  }

  const needsContact = !user.phone || !user.university || !user.copyrightConfirmed;

  return (
    <OnboardingForm
      needsContact={needsContact}
      defaultFullName={user.fullName ?? user.name ?? ""}
    />
  );
}
