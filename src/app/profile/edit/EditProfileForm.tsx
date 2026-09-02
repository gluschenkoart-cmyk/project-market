"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { updateProfileAction, type EditProfileFormState } from "./actions";

const initialState: EditProfileFormState = { fieldErrors: {} };

interface EditProfileFormProps {
  initialValues: {
    fullName: string;
    phone: string;
    university: string;
    faculty: string;
    telegram: string;
    whatsapp: string;
  };
}

export function EditProfileForm({ initialValues }: EditProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-extrabold text-ink">Редагувати профіль</h1>
        <p className="text-ink/70">
          Email і роль тут не змінити — якщо потрібен інший акаунт, зареєструйтесь окремо.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-8">
        <fieldset className="flex flex-col gap-5">
          <legend className="mb-1 font-heading text-lg font-bold text-ink">Основне</legend>
          <Field
            label="Повне ім'я *"
            name="fullName"
            required
            defaultValue={initialValues.fullName}
            error={state.fieldErrors.fullName}
          />
          <Field
            label="Телефон *"
            name="phone"
            type="tel"
            required
            defaultValue={initialValues.phone}
            error={state.fieldErrors.phone}
          />
          <Field
            label="Навчальний заклад *"
            name="university"
            required
            defaultValue={initialValues.university}
            error={state.fieldErrors.university}
          />
          <Field
            label="Факультет"
            name="faculty"
            defaultValue={initialValues.faculty}
            error={state.fieldErrors.faculty}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="mb-1 font-heading text-lg font-bold text-ink">
            Додаткові способи зв&apos;язку
          </legend>
          <p className="text-sm text-ink/60">
            Необов&apos;язково — покажуться тим, хто оплатив перегляд ваших
            контактів на сторінці проєкту.
          </p>
          <Field
            label="Telegram"
            name="telegram"
            placeholder="@nickname або +380…"
            hint="Юзернейм або номер телефону — що зручніше"
            defaultValue={initialValues.telegram}
            error={state.fieldErrors.telegram}
          />
          <Field
            label="WhatsApp"
            name="whatsapp"
            type="tel"
            placeholder="+380…"
            defaultValue={initialValues.whatsapp}
            error={state.fieldErrors.whatsapp}
          />
        </fieldset>

        {state.formError ? <p className="font-semibold text-accent">{state.formError}</p> : null}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Зберігаємо…" : "Зберегти"}
          </Button>
          <Link href="/profile" className="text-sm font-semibold text-ink underline decoration-2 underline-offset-4">
            Скасувати
          </Link>
        </div>
      </form>
    </main>
  );
}
