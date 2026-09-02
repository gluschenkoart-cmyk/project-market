import { NextResponse, type NextRequest } from "next/server";
import { applyLiqpayCallback } from "@/lib/payments/contact-unlock";

/**
 * Серверне підтвердження оплати від LiqPay (server_url у
 * src/lib/payments/liqpay.ts) — POST, application/x-www-form-urlencoded,
 * поля "data" і "signature". Не спрацює, доки додаток не має публічної
 * адреси (LiqPay не може достукатись до localhost) — очікувано на цьому
 * етапі ("зроби проробку, підключенням займемось пізніше").
 *
 * Завжди відповідаємо 200 — інакше LiqPay продовжуватиме повторювати
 * запит; недійсний підпис чи невідомий order_id просто логуються й
 * ігноруються (applyLiqpayCallback), а не повертають помилку.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const data = formData.get("data");
  const signature = formData.get("signature");

  if (typeof data === "string" && typeof signature === "string") {
    await applyLiqpayCallback(data, signature);
  }

  return NextResponse.json({ ok: true });
}
