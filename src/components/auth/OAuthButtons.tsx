import { Button } from "@/components/ui/Button";
import { signInWithApple, signInWithGoogle } from "@/actions/oauth";

/**
 * Google/Apple — головний, рекомендований шлях реєстрації (за проханням
 * Артема): швидше, без придумування й запам'ятовування пароля. Форма
 * email+пароль (нижче на сторінках /register і /login) лишається як
 * альтернатива для тих, хто не хоче прив'язувати такий акаунт.
 *
 * Обидві кнопки вимагають, щоб у .env були реальні ключі від Google Cloud
 * Console / Apple Developer — без них Auth.js поверне помилку конфігурації
 * при натисканні. Кроки для отримання ключів — docs/auth.md.
 */
export function OAuthButtons() {
  return (
    <div className="flex flex-col gap-3">
      <form action={signInWithGoogle}>
        <Button type="submit" variant="secondary" className="w-full">
          Продовжити через Google
        </Button>
      </form>
      <form action={signInWithApple}>
        <Button type="submit" variant="secondary" className="w-full">
          Продовжити через Apple
        </Button>
      </form>
    </div>
  );
}
