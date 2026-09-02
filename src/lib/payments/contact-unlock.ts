import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import {
  buildLiqpayCheckoutForm,
  getAppUrl,
  isLiqpayConfigured,
  LIQPAY_SUCCESS_STATUSES,
  verifyAndParseLiqpayCallback,
} from "@/lib/payments/liqpay";

/**
 * $1 за перегляд контактів (CLAUDE.md, рішення від 01.09.2026) — фіксована
 * сума в гривнях, не перерахунок курсу щоразу. Змінити ціну для всієї
 * платформи — правка цього одного числа.
 */
export const CONTACT_UNLOCK_PRICE_UAH = 40;

export type ContactUnlockState = "OWN_PROJECT" | "UNLOCKED" | "LOCKED";

/**
 * Чи бачить ця людина контакти автора проєкту. Автор власного проєкту
 * бачить їх завжди (нема сенсу платити самому собі) — усі інші лише
 * після успішної оплати (Етап 6, "Угода").
 */
export async function getContactUnlockState(
  viewerId: string | undefined,
  project: { id: string; authorId: string },
): Promise<ContactUnlockState> {
  if (!viewerId) return "LOCKED";
  if (viewerId === project.authorId) return "OWN_PROJECT";

  const unlock = await prisma.contactUnlock.findUnique({
    where: { viewerId_projectId: { viewerId, projectId: project.id } },
    select: { status: true },
  });

  return unlock?.status === "SUCCESS" ? "UNLOCKED" : "LOCKED";
}

export interface InitiateUnlockResult {
  /** Задано — редіректити сюди (сторінка автоматичної відправки форми
   * оплати LiqPay). Не задано — DEV_MOCK одразу зарахував оплату, або
   * платити нема за що (власний проєкт / уже оплачено раніше). */
  redirectUrl: string | null;
}

/**
 * Починає (чи повторює) спробу оплати за перегляд контактів.
 *
 * Без ключів LiqPay в .env (isLiqpayConfigured() === false) одразу
 * зараховує оплату як DEV_MOCK — так усю механіку розблокування
 * контактів можна перевірити вже зараз, до підключення справжнього
 * провайдера (рішення Артема від 02.09.2026: "зроби проробку,
 * підключенням займемось пізніше").
 */
export async function initiateContactUnlock(
  viewerId: string,
  project: { id: string; authorId: string; title: string },
): Promise<InitiateUnlockResult> {
  if (viewerId === project.authorId) {
    return { redirectUrl: null };
  }

  const existing = await prisma.contactUnlock.findUnique({
    where: { viewerId_projectId: { viewerId, projectId: project.id } },
    select: { status: true },
  });
  if (existing?.status === "SUCCESS") {
    return { redirectUrl: null };
  }

  const orderId = `unlock_${randomUUID()}`;

  if (!isLiqpayConfigured()) {
    await prisma.contactUnlock.upsert({
      where: { viewerId_projectId: { viewerId, projectId: project.id } },
      create: {
        viewerId,
        projectId: project.id,
        amountUah: CONTACT_UNLOCK_PRICE_UAH,
        provider: "DEV_MOCK",
        status: "SUCCESS",
        providerOrderId: orderId,
        paidAt: new Date(),
      },
      update: {
        provider: "DEV_MOCK",
        status: "SUCCESS",
        providerOrderId: orderId,
        paidAt: new Date(),
      },
    });
    return { redirectUrl: null };
  }

  const appUrl = getAppUrl();
  const { data, signature } = buildLiqpayCheckoutForm({
    orderId,
    amountUah: CONTACT_UNLOCK_PRICE_UAH,
    description: `Розблокування контактів — «${project.title}»`,
    resultUrl: `${appUrl}/projects/${project.id}`,
    serverUrl: `${appUrl}/api/payments/liqpay/callback`,
  });

  const unlock = await prisma.contactUnlock.upsert({
    where: { viewerId_projectId: { viewerId, projectId: project.id } },
    create: {
      viewerId,
      projectId: project.id,
      amountUah: CONTACT_UNLOCK_PRICE_UAH,
      provider: "LIQPAY",
      status: "PENDING",
      providerOrderId: orderId,
      checkoutData: data,
      checkoutSignature: signature,
    },
    update: {
      provider: "LIQPAY",
      status: "PENDING",
      providerOrderId: orderId,
      checkoutData: data,
      checkoutSignature: signature,
      paidAt: null,
    },
    select: { id: true },
  });

  return { redirectUrl: `/pay/liqpay/${unlock.id}` };
}

/** Обробляє підписаний callback від LiqPay (src/app/api/payments/liqpay/callback). */
export async function applyLiqpayCallback(data: string, signature: string): Promise<void> {
  const payload = verifyAndParseLiqpayCallback(data, signature);
  if (!payload) {
    console.error("LiqPay callback: недійсний підпис — ігноровано");
    return;
  }

  const unlock = await prisma.contactUnlock.findUnique({
    where: { providerOrderId: payload.order_id },
    select: { id: true },
  });
  if (!unlock) {
    console.error(`LiqPay callback: невідомий order_id "${payload.order_id}"`);
    return;
  }

  const isSuccess = LIQPAY_SUCCESS_STATUSES.has(payload.status);
  await prisma.contactUnlock.update({
    where: { id: unlock.id },
    data: {
      status: isSuccess ? "SUCCESS" : "FAILED",
      paidAt: isSuccess ? new Date() : null,
    },
  });
}
