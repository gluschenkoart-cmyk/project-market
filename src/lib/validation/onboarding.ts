import { z } from "zod";

/**
 * Контактні поля, яких бракує в акаунтах, створених через Google/Apple
 * (там немає ні телефону, ні вишу). Той самий набір, що й у формі
 * email-реєстрації (src/lib/validation/auth.ts) — навмисно не імпортуємо
 * звідти напряму, бо там ще є email/password, які тут не потрібні.
 */
export const onboardingContactSchema = z.object({
  fullName: z.string().trim().min(2, "Вкажіть повне ім'я"),
  phone: z.string().trim().min(6, "Вкажіть номер телефону"),
  university: z.string().trim().min(2, "Вкажіть навчальний заклад"),
  faculty: z.string().trim().max(200).optional().or(z.literal("")),
  copyrightConfirmed: z
    .string()
    .optional()
    .refine((value) => value === "on", {
      message: "Потрібно підтвердити відповідальність за авторське право",
    })
    .transform(() => true as const),
});

export const USER_ROLES = ["CREATOR", "RECEIVER"] as const;

export const roleSchema = z.object({
  // Без кастомного повідомлення: API кастомізації помилок відрізняється між
  // версіями zod, а UI все одно просто повторно показує форму з
  // required-позначками, тому дефолтного тексту достатньо.
  role: z.enum(USER_ROLES),
});

export const VERTICALS = [
  "ARCHITECTURE",
  "FINE_ART",
  "SCULPTURE",
  "DESIGN",
  "DIGITAL_3D_ANIMATION",
] as const;

export const VERTICAL_LABELS: Record<(typeof VERTICALS)[number], string> = {
  ARCHITECTURE: "Архітектура",
  FINE_ART: "Образотворче мистецтво",
  SCULPTURE: "Скульптура",
  DESIGN: "Дизайн",
  DIGITAL_3D_ANIMATION: "Цифрове мистецтво / 3D / Анімація",
};

export const primaryVerticalSchema = z.object({
  primaryVertical: z.enum(VERTICALS),
});
