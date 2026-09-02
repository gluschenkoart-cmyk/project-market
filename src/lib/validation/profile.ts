import { z } from "zod";

/**
 * Редагування профілю (Етап 6) — свідомо НЕ включає email, role чи
 * primaryVertical: email прив'язаний до входу (зміна зламала б Google/
 * Apple-акаунти), а роль/напрям — те саме навмисне обмеження, що й досі
 * (CLAUDE.md: якщо людині потрібна інша роль — другий акаунт, не зміна
 * поточного). Поля тут — той самий набір, що на онбордингу
 * (src/lib/validation/onboarding.ts), плюс два нових контактних канали.
 */
export const profileEditSchema = z.object({
  fullName: z.string().trim().min(2, "Вкажіть повне ім'я"),
  phone: z.string().trim().min(6, "Вкажіть номер телефону"),
  university: z.string().trim().min(2, "Вкажіть навчальний заклад"),
  faculty: z.string().trim().max(200).optional().or(z.literal("")),
  /** @юзернейм або номер — src/lib/contacts.ts розпізнає формат. */
  telegram: z.string().trim().max(100).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(50).optional().or(z.literal("")),
});

export type ProfileEditInput = z.infer<typeof profileEditSchema>;
