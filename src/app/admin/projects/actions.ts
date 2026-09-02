"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveAdminAccess } from "@/lib/admin/access";

/**
 * Показати/приховати проєкт (Етап 7, базова модерація) — прив'язується до
 * projectId, hidden і returnTo через .bind(null, ...) у формі на кожному
 * рядку таблиці /admin/projects (той самий підхід, що й
 * updateProjectStatusAction у src/app/projects/[id]/actions.ts).
 * returnTo — щоб після дії повернутись на той самий фільтр/сторінку
 * списку, а не скидати їх на дефолтні.
 */
export async function setProjectHiddenAction(
  projectId: string,
  hidden: boolean,
  returnTo: string,
  formData: FormData,
): Promise<void> {
  const { isAuthenticated, isAdmin } = await resolveAdminAccess();
  if (!isAuthenticated) {
    redirect("/login");
  }
  if (!isAdmin) {
    // Не адмін, що все ж якось відправив цю форму (пряме звернення в обхід
    // інтерфейсу) — тихо повертаємо на головну, без пояснень зайвого.
    redirect("/");
  }

  const reasonRaw = hidden ? formData.get("reason") : null;
  const reason = typeof reasonRaw === "string" && reasonRaw.trim() ? reasonRaw.trim().slice(0, 300) : null;

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        isHidden: hidden,
        hiddenReason: reason,
        hiddenAt: hidden ? new Date() : null,
      },
    });
  } catch (error) {
    console.error("Не вдалося оновити модераційний статус проєкту:", error);
    redirect(returnTo || "/admin/projects");
  }

  redirect(returnTo || "/admin/projects");
}
