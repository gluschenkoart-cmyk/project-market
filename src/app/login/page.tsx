import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

/**
 * LoginForm читає useSearchParams() (щоб знати, куди повернути користувача
 * після входу) — Next.js вимагає Suspense-межу навколо будь-якого клієнтського
 * компонента з useSearchParams, інакше падає збірка.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
