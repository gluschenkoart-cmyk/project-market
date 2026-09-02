"use client";

import { useActionState } from "react";
import { SelectableCard } from "@/components/ui/SelectableCard";
import { Button } from "@/components/ui/Button";
import { VERTICALS, VERTICAL_LABELS } from "@/lib/validation/onboarding";
import { primaryVerticalAction, type VerticalFormState } from "./actions";

const initialState: VerticalFormState = { fieldErrors: {} };

const VERTICAL_DESCRIPTIONS: Record<(typeof VERTICALS)[number], string> = {
  ARCHITECTURE: "Житлові, громадські, промислові, ландшафтні, містобудівні проєкти.",
  FINE_ART: "Живопис — оригінали, принти, лімітовані серії.",
  SCULPTURE: "Фізичні об'єкти — індивідуальні чи серійні, indoor/outdoor.",
  DESIGN: "Продукт-дизайн, меблі, виробничі файли (DWG/STEP/Rhino).",
  DIGITAL_3D_ANIMATION: "3D-моделі, анімація, motion graphics, VFX, game-ready асети.",
};

export function VerticalForm() {
  const [state, formAction, pending] = useActionState(primaryVerticalAction, initialState);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-extrabold text-ink">
          Який ваш основний творчий напрям?
        </h1>
        <p className="text-ink/70">
          Це визначає, яку форму завантаження проєкту ви побачите. Наразі
          повністю готова тільки «Архітектура» — інші напрями відкриються
          найближчим часом, але профіль уже можна налаштувати.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {VERTICALS.map((vertical) => (
            <SelectableCard
              key={vertical}
              name="primaryVertical"
              value={vertical}
              title={VERTICAL_LABELS[vertical]}
              description={VERTICAL_DESCRIPTIONS[vertical]}
              hint={vertical !== "ARCHITECTURE" ? "Завантаження — скоро" : undefined}
            />
          ))}
        </div>
        {state.fieldErrors.primaryVertical ? (
          <p className="text-xs font-semibold text-accent">
            {state.fieldErrors.primaryVertical}
          </p>
        ) : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Зберігаємо…" : "Завершити"}
        </Button>
      </form>
    </main>
  );
}
