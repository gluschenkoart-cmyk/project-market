import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { VerticalForm } from "./VerticalForm";

export default async function OnboardingVerticalPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    redirect("/login");
  }

  // Цей крок лише для творців; отримувача сюди заводити нема сенсу.
  if (user.role !== "CREATOR") {
    redirect(user.role ? "/profile" : "/onboarding");
  }
  if (user.primaryVertical) {
    redirect("/profile");
  }

  return <VerticalForm />;
}
