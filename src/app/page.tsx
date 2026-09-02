import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * Тимчасова титульна сторінка Етапу 1. Реальна стрічка з пошуком і
 * фільтрами зʼявиться на Етапі 5 — зараз тут лише перевірка того, що
 * фундамент (шрифти, кольори, компоненти) працює разом.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="rounded-full border-[3px] border-ink bg-accent-2 px-4 py-1 font-heading text-xs font-bold uppercase tracking-wide text-ink">
        Етап 1 · Технічний фундамент
      </span>

      <h1 className="max-w-2xl font-heading text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
        Жодна добра ідея не має зникнути безслідно
      </h1>

      <p className="max-w-xl text-lg text-ink/70">
        Маркетплейс нереалізованих креативних студентських проєктів —
        від дипломної роботи до комерційного концепту.
      </p>

      <Link href="/style-guide">
        <Button>Переглянути дизайн-систему</Button>
      </Link>
    </main>
  );
}
