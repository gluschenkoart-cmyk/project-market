import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AutoSubmitForm } from "./AutoSubmitForm";

interface PayLiqpayPageProps {
  params: Promise<{ unlockId: string }>;
}

const LIQPAY_CHECKOUT_URL = "https://www.liqpay.ua/api/3/checkout";

/**
 * Проміжна сторінка перед оплатою LiqPay (Етап 6). LiqPay не приймає
 * прямий redirect-URL із параметрами — потрібна саме POST-форма з
 * підписаними полями "data"/"signature" (стандартна схема LiqPay
 * checkout API v3). Тому тут — невидима форма, яка одразу сама
 * відправляється (AutoSubmitForm), плюс кнопка на випадок, якщо
 * автоматична відправка не спрацювала (заблокований JS тощо).
 */
export default async function PayLiqpayPage({ params }: PayLiqpayPageProps) {
  const { unlockId } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const unlock = await prisma.contactUnlock.findUnique({
    where: { id: unlockId },
    select: {
      viewerId: true,
      projectId: true,
      status: true,
      checkoutData: true,
      checkoutSignature: true,
    },
  });

  if (!unlock || unlock.viewerId !== session.user.id) {
    notFound();
  }

  if (unlock.status === "SUCCESS") {
    redirect(`/projects/${unlock.projectId}`);
  }

  if (!unlock.checkoutData || !unlock.checkoutSignature) {
    // Не мало б статись (тільки якщо запис створено не через
    // initiateContactUnlock) — повертаємось на проєкт спробувати ще раз.
    redirect(`/projects/${unlock.projectId}`);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="font-heading text-2xl font-extrabold text-ink">Перенаправляємо на оплату…</h1>
      <p className="text-ink/70">Зачекайте секунду — зараз відкриється сторінка LiqPay.</p>

      <AutoSubmitForm
        actionUrl={LIQPAY_CHECKOUT_URL}
        data={unlock.checkoutData}
        signature={unlock.checkoutSignature}
      />
    </main>
  );
}
