import { z } from "zod";

/**
 * Реєстрація автора — поля з CLAUDE.md ("Авторське право"): самодекларація
 * при завантаженні на платформу, а не перевірка документів. `university`
 * навмисно вільний текст (див. src/lib/validation/architecture-dna.ts —
 * та сама причина: школи гейм-дизайну, курси тощо, не лише університети).
 */
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Введіть коректний email"),
  password: z.string().min(8, "Пароль має містити щонайменше 8 символів"),
  fullName: z.string().trim().min(2, "Вкажіть повне ім'я"),
  phone: z.string().trim().min(6, "Вкажіть номер телефону"),
  university: z.string().trim().min(2, "Вкажіть навчальний заклад"),
  faculty: z.string().trim().max(200).optional().or(z.literal("")),
  // Незаповнений чекбокс узагалі не потрапляє у FormData — тому optional,
  // а не z.literal("on") напряму (значення відсутнє, не порожній рядок).
  copyrightConfirmed: z
    .string()
    .optional()
    .refine((value) => value === "on", {
      message: "Потрібно підтвердити відповідальність за авторське право",
    })
    .transform(() => true as const),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Введіть коректний email"),
  password: z.string().min(1, "Введіть пароль"),
});

export type LoginInput = z.infer<typeof loginSchema>;
