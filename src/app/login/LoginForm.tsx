"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = { fieldErrors: {} };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-extrabold text-ink">Вхід</h1>
        <p className="text-ink/70">Раді бачити знову.</p>
      </div>

      <OAuthButtons />

      <div className="flex items-center gap-3 text-sm text-ink/50">
        <span className="h-[3px] flex-1 bg-ink/10" />
        або через email
        <span className="h-[3px] flex-1 bg-ink/10" />
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="from" value={from} />
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
          autoComplete="current-password"
          required
          error={state.fieldErrors.password}
        />

        {state.formError ? (
          <p className="font-semibold text-accent">{state.formError}</p>
        ) : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Входимо…" : "Увійти"}
        </Button>
      </form>

      <p className="text-center text-sm text-ink/60">
        Ще немає акаунту?{" "}
        <Link href="/register" className="font-semibold text-ink underline underline-offset-4">
          Зареєструватися
        </Link>
      </p>
    </main>
  );
}
