"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { initiateContactUnlock } from "@/lib/payments/contact-unlock";
import { PROJECT_STATUS_VALUES } from "@/lib/project-status";

/**
 * Оплата за перегляд контактів (Етап 6) — прив'язується до конкретного
 * projectId через .bind(null, projectId) у формі на сторінці проєкту
 * (src/app/projects/[id]/page.tsx), тому FormData самій дії не потрібна.
 */
export async function unlockContactsAction(projectId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?from=/projects/${projectId}`);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, authorId: true, title: true },
  });
  if (!project) {
    redirect("/");
  }

  let redirectUrl: string | null;
  try {
    ({ redirectUrl } = await initiateContactUnlock(session.user.id, project));
  } catch (error) {
    console.error("Не вдалося почати оплату:", error);
    redirect(`/projects/${projectId}`);
  }

  redirect(redirectUrl ?? `/projects/${projectId}`);
}

/**
 * Автор сам змінює статус свого проєкту (Етап 6) — досі це поле
 * виставлялось лише один раз автоматично при завантаженні (Етап 4) і
 * більше ніяк не мінялось. Прив'язується до projectId так само, як і
 * unlockContactsAction — статус приходить окремим полем форми ("status").
 */
export async function updateProjectStatusAction(
  projectId: string,
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { authorId: true },
  });
  if (!project || project.authorId !== session.user.id) {
    // Не свій проєкт — тихо повертаємо назад, без пояснень зайвого.
    redirect(`/projects/${projectId}`);
  }

  const status = formData.get("status");
  const isValidStatus =
    typeof status === "string" &&
    (PROJECT_STATUS_VALUES as readonly string[]).includes(status);

  if (isValidStatus) {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: status as (typeof PROJECT_STATUS_VALUES)[number] },
    });
  }

  redirect(`/projects/${projectId}`);
}
