"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export interface ToggleFavoriteResult {
  isFavorited: boolean;
}

/**
 * Додати/прибрати проєкт з обраного (Етап 6) — доступно і Творцю, і
 * Отримувачу (рішення Артема від 02.09.2026), єдина вимога — бути
 * залогіненим. Викликається напряму з клієнтського компонента
 * (FavoriteButton) як звичайна функція, а не через <form> — тому
 * повертає результат для оптимістичного оновлення інтерфейсу, а не
 * робить redirect.
 */
export async function toggleFavoriteAction(projectId: string): Promise<ToggleFavoriteResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const userId = session.user.id;

  const existing = await prisma.favoriteProject.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.favoriteProject.delete({ where: { id: existing.id } });
    revalidatePath("/favorites");
    return { isFavorited: false };
  }

  await prisma.favoriteProject.create({ data: { userId, projectId } });
  revalidatePath("/favorites");
  return { isFavorited: true };
}
