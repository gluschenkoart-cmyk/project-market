import { createHash, timingSafeEqual } from "crypto";

/**
 * LiqPay (ПриватБанк) — Етап 6, "Угода". Артем підтвердив LiqPay як
 * провайдера (рішення 02.09.2026), але саме підключення (реєстрація
 * акаунта, реальні ключі) — пізніше ("зроби проробку"): цей файл — уже
 * робочий код за офіційною схемою LiqPay (checkout API v3, стабільна
 * роками), який просто не активний без ключів у .env.
 *
 * Apple Pay / Google Pay: окремого коду для них не потрібно — обидва
 * з'являються як додаткові кнопки на самій сторінці оплати LiqPay
 * (потрібно тільки увімкнути в налаштуваннях мерчант-акаунта LiqPay,
 * коли Артем його заведе — деталі в docs/payments.md).
 */

export interface LiqpayCheckoutParams {
  orderId: string;
  amountUah: number;
  description: string;
  /** Куди LiqPay поверне БРАУЗЕР людини після оплати (не обов'язково
   * означає "оплата успішна" — це підтверджує лише server_url нижче). */
  resultUrl: string;
  /** Куди LiqPay надішле СЕРВЕРНЕ підтвердження оплати (webhook) — має
   * бути публічно доступною адресою, тому не спрацює на localhost. */
  serverUrl: string;
}

export interface LiqpaySignedForm {
  data: string;
  signature: string;
}

export function getAppUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function getLiqpayKeys(): { publicKey: string; privateKey: string } | null {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}

/** false, доки Артем не додасть справжні ключі в .env.local — тоді
 * src/lib/payments/contact-unlock.ts перемикається на DEV_MOCK. */
export function isLiqpayConfigured(): boolean {
  return getLiqpayKeys() !== null;
}

function sign(data: string, privateKey: string): string {
  return createHash("sha1")
    .update(privateKey + data + privateKey)
    .digest("base64");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Підписані параметри форми чек-ауту LiqPay. Саме "data" і "signature" —
 * усе, що потрібно відправити POST-формою на
 * https://www.liqpay.ua/api/3/checkout (src/app/pay/liqpay/[unlockId]).
 */
export function buildLiqpayCheckoutForm(params: LiqpayCheckoutParams): LiqpaySignedForm {
  const keys = getLiqpayKeys();
  if (!keys) {
    throw new Error(
      "LiqPay не підключено — немає LIQPAY_PUBLIC_KEY/LIQPAY_PRIVATE_KEY у .env",
    );
  }

  const payload = {
    public_key: keys.publicKey,
    version: 3,
    action: "pay",
    amount: params.amountUah,
    currency: "UAH",
    description: params.description,
    order_id: params.orderId,
    result_url: params.resultUrl,
    server_url: params.serverUrl,
    // Пісочниця за замовчуванням, доки Артем явно не підтвердив, що
    // акаунт готовий приймати справжні платежі (LIQPAY_SANDBOX=false).
    ...(process.env.LIQPAY_SANDBOX === "false" ? {} : { sandbox: 1 }),
  };

  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  return { data, signature: sign(data, keys.privateKey) };
}

export interface LiqpayCallbackPayload {
  order_id: string;
  status: string;
  amount: number;
  currency: string;
}

/** Статуси LiqPay, які означають "гроші отримано" — "success" (бойовий
 * режим) і "sandbox" (тестові платежі при sandbox=1). */
export const LIQPAY_SUCCESS_STATUSES = new Set(["success", "sandbox"]);

/**
 * Перевіряє підпис callback-повідомлення від LiqPay (POST на
 * server_url) і повертає розкодований вміст — або null, якщо підпис не
 * збігається (тоді довіряти вмісту не можна, і його просто ігнорують:
 * так з боку LiqPay виглядає підроблений або пошкоджений запит).
 */
export function verifyAndParseLiqpayCallback(
  data: string,
  signature: string,
): LiqpayCallbackPayload | null {
  const keys = getLiqpayKeys();
  if (!keys) return null;

  if (!safeEqual(sign(data, keys.privateKey), signature)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(data, "base64").toString("utf-8")) as LiqpayCallbackPayload;
  } catch {
    return null;
  }
}
