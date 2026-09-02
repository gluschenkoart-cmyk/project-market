"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { registerAction, type RegisterFormState } from "./actions";

const initialState: RegisterFormState = { fieldErrors: {} };

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-extrabold text-ink">Реєстрація автора</h1>
        <p className="text-ink/70">
          Ці дані показуються при завантаженні проєкту — платформа фіксує їх на
          випадок спору щодо авторства, але не перевіряє документи.
        </p>
      </div>

      <OAuthButtons />

      <div className="flex items-center gap-3 text-sm text-ink/50">
        <span className="h-[3px] flex-1 bg-ink/10" />
        або через email
        <span className="h-[3px] flex-1 bg-ink/10" />
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <Field
          label="Повне ім'я"
          name="fullName"
          autoComplete="name"
          required
          error={state.fieldErrors.fullName}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={state.fieldErrors.email}
        />
        <Field
          label="Пароль"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          hint="Щонайменше 8 символів"
          error={state.fieldErrors.password}
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

        {state.formError ? (
          <p className="font-semibold text-accent">{state.formError}</p>
        ) : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Реєструємо…" : "Зареєструватися"}
        </Button>
      </form>

      <p className="text-center text-sm text-ink/60">
        Вже є акаунт?{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
          Увійти
        </Link>
      </p>
    </main>
  );
}
