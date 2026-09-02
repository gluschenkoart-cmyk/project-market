import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isProfileComplete } from "@/lib/onboarding";
import { NewProjectForm } from "./NewProjectForm";

/**
 * Форма завантаження проєкту (Етап 4) — поки що тільки для вертикалі
 * "Архітектура" (єдина, для якої готова Project DNA-схема). Отримувачі
 * сюди не потрапляють: вони переглядають і купують, але не завантажують.
 */
export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    redirect("/login");
  }

  if (!isProfileComplete(user)) {
    redirect("/onboarding");
  }

  if (user.role !== "CREATOR") {
    redirect("/profile");
  }

  if (user.primaryVertical !== "ARCHITECTURE") {
    return (
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-24 text-center">
        <h1 className="font-heading text-2xl font-extrabold text-ink">Скоро</h1>
        <p className="text-ink/70">
          Форма завантаження для вашого напряму ще в розробці — зараз повністю
          готова тільки «Архітектура». Напишіть нам, якщо хочете спробувати
          новий напрям одним з перших.
        </p>
      </main>
    );
  }

  return <NewProjectForm />;
}
