import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/app/profile/actions";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between border-b-[3px] border-ink px-6 py-4">
      <Link href="/" className="font-heading text-xl font-extrabold text-ink">
        Project Market
      </Link>

      <nav className="flex items-center gap-4">
        {session?.user ? (
          <>
            <Link href="/profile" className="font-semibold text-ink hover:text-accent">
              Профіль
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Вийти
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="font-semibold text-ink hover:text-accent">
              Увійти
            </Link>
            <Link href="/register">
              <Button size="sm">Реєстрація</Button>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
