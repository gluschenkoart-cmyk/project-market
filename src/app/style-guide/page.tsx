import { Button } from "@/components/ui/Button";
import { PriceBadge, StatusBadge, type ProjectStatus } from "@/components/ui/Badge";
import { ProjectCard } from "@/components/ui/ProjectCard";

const SWATCHES: { name: string; token: string; className: string }[] = [
  { name: "Ink", token: "--color-ink", className: "bg-ink text-paper" },
  { name: "Paper", token: "--color-paper", className: "bg-paper text-ink border-[3px] border-ink" },
  { name: "Accent", token: "--color-accent", className: "bg-accent text-paper" },
  { name: "Accent-2", token: "--color-accent-2", className: "bg-accent-2 text-ink" },
];

const ALL_STATUSES: ProjectStatus[] = [
  "academic",
  "concept",
  "for_sale",
  "sold",
  "in_development",
  "built",
  "archived",
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-2xl font-bold text-ink">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-ink/60">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function StyleGuidePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-16">
      <header className="flex flex-col gap-2">
        <span className="w-fit rounded-full border-[3px] border-ink bg-accent-2 px-4 py-1 font-heading text-xs font-bold uppercase tracking-wide text-ink">
          Дизайн-система · чернетка
        </span>
        <h1 className="font-heading text-4xl font-extrabold text-ink">Project Market</h1>
        <p className="max-w-2xl text-ink/70">
          Лаконічно, весело, яскраво, трохи кітчево — товсті контури й
          "стікерна" тінь замість тонких сірих рамок. Ця сторінка існує,
          щоб швидко звірити напрям, перш ніж будувати реальні екрани.
        </p>
      </header>

      <Section title="Кольори" description="Токени з CLAUDE.md — відправна точка, уточнюємо разом за реакцією.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SWATCHES.map((s) => (
            <div key={s.name} className="flex flex-col gap-2">
              <div className={`flex h-24 items-end rounded-xl p-3 font-heading text-sm font-bold ${s.className}`}>
                {s.name}
              </div>
              <code className="text-xs text-ink/50">{s.token}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Типографіка"
        description="Заголовки — Unbounded (жирний, геометричний). Текст — Manrope. Обидва з повною підтримкою кирилиці."
      >
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-5xl font-extrabold text-ink">Заголовок H1</h1>
          <h2 className="font-heading text-3xl font-bold text-ink">Заголовок H2</h2>
          <h3 className="font-heading text-xl font-bold text-ink">Заголовок H3</h3>
          <p className="max-w-xl text-base text-ink/80">
            Основний текст (Manrope). Дипломний проєкт «Житловий комплекс
            для студентського містечка» — приклад того, як звучить опис
            проєкту в стрічці.
          </p>
          <p className="max-w-xl text-sm text-ink/60">
            Дрібний текст для метаданих: КНУБА · спеціальність 191 · 5 курс.
          </p>
        </div>
      </Section>

      <Section title="Кнопки">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Опублікувати проєкт</Button>
          <Button variant="secondary">Зберегти чернетку</Button>
          <Button variant="ghost">Скасувати</Button>
          <Button variant="primary" size="sm">
            Написати автору
          </Button>
        </div>
      </Section>

      <Section title="Статуси проєкту" description="Academic → Concept → For Sale → Sold/Licensed → Under Development → Built → Archived.">
        <div className="flex flex-wrap gap-3">
          {ALL_STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section title="Ціна">
        <div className="flex flex-wrap gap-3">
          <PriceBadge priceUah={45000} />
          <PriceBadge />
        </div>
      </Section>

      <Section title="Картка проєкту" description="Приклад для вертикалі «Архітектура».">
        <div className="grid max-w-sm gap-6">
          <ProjectCard
            title="Житловий комплекс для студентського містечка"
            authorName="Марія Коваль"
            university="КНУБА"
            typology="Житлова"
            areaSqm={7400}
            floors={9}
            status="for_sale"
            priceUah={45000}
          />
        </div>
      </Section>
    </main>
  );
}
