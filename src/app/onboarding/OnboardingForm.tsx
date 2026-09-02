"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { SelectableCard } from "@/components/ui/SelectableCard";
import { Button } from "@/components/ui/Button";
import { onboardingAction, type OnboardingFormState } from "./actions";

const initialState: OnboardingFormState = { fieldErrors: {} };

export function OnboardingForm({
  needsContact,
  defaultFullName,
}: {
  needsContact: boolean;
  defaultFullName: string;
}) {
  const [state, formAction, pending] = useActionState(onboardingAction, initialState);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-extrabold text-ink">
          Ще пара кроків
        </h1>
        <p className="text-ink/70">
          {needsContact
            ? "Потрібні деякі дані, яких немає у вашому Google/Apple-акаунті, і одне рішення про те, як ви користуватиметесь платформою."
            : "Останнє рішення — і можна далі."}
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-10">
        {needsContact ? (
          <fieldset className="flex flex-col gap-5">
            <legend className="mb-1 font-heading text-lg font-bold text-ink">
              Контактні дані
            </legend>
            <Field
              label="Повне ім'я"
              name="fullName"
              autoComplete="name"
              required
              defaultValue={defaultFullName}
              error={state.fieldErrors.fullName}
            />
            <Field
              label="Телефон"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              error={state.fieldErrors.phone}
            />
            <Field
              label="Навчальний заклад"
              name="university"
              placeholder="Напр. КНУБА, або школа гейм-дизайну, курси тощо"
              required
              error={state.fieldErrors.university}
            />
            <Field
              label="Факультет (необов'язково)"
              name="faculty"
              error={state.fieldErrors.faculty}
            />
            <Checkbox
              label="Я самостійно несу відповідальність за авторське право на завантажений матеріал"
              name="copyrightConfirmed"
              error={state.fieldErrors.copyrightConfirmed}
            />
          </fieldset>
        ) : null}

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 font-heading text-lg font-bold text-ink">
            Як ви користуватиметесь платформою?
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectableCard
              name="role"
              value="CREATOR"
              title="Я Творець"
              description="Показую, архівую й продаю власні проєкти."
            />
            <SelectableCard
              name="role"
              value="RECEIVER"
              title="Я Отримувач"
              description="Шукаю й купую готові проєкти."
            />
          </div>
          {state.fieldErrors.role ? (
            <p className="text-xs font-semibold text-accent">{state.fieldErrors.role}</p>
          ) : null}
        </fieldset>

        <Button type="submit" disabled={pending}>
          {pending ? "Зберігаємо…" : "Продовжити"}
        </Button>
      </form>
    </main>
  );
}
