"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { toggleFavoriteAction } from "@/app/favorites/actions";

export interface FavoriteButtonProps {
  projectId: string;
  initialFavorited: boolean;
  isAuthenticated: boolean;
  className?: string;
}

/**
 * Серце "в обране" (Етап 6) — сідає поверх картки проєкту (ProjectCard) і
 * на сторінці самого проєкту. Картка часто загорнута в <Link> (клік веде
 * на проєкт) — тому preventDefault/stopPropagation тут обов'язкові, інакше
 * клік по серцю ще й перекидав би на сторінку проєкту.
 */
export function FavoriteButton({
  projectId,
  initialFavorited,
  isAuthenticated,
  className,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const nextValue = !isFavorited;
    setIsFavorited(nextValue); // оптимістично — відкат нижче, якщо сервер відмовить

    startTransition(async () => {
      try {
        const result = await toggleFavoriteAction(projectId);
        setIsFavorited(result.isFavorited);
      } catch {
        setIsFavorited(!nextValue);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? "Прибрати з обраного" : "Додати в обране"}
      title={isFavorited ? "Прибрати з обраного" : "Додати в обране"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-ink transition-colors disabled:opacity-60",
        isFavorited ? "bg-accent text-paper" : "bg-paper text-ink hover:bg-ink/5",
        className,
      )}
    >
      <HeartIcon filled={isFavorited} />
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path d="M12 21s-6.7-4.35-9.3-8.2C1 10.1 1.6 6.6 4.6 5.1c2.3-1.1 4.7-.2 6 1.7l1.4 2 1.4-2c1.3-1.9 3.7-2.8 6-1.7 3 1.5 3.6 5 1.9 7.7C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}
