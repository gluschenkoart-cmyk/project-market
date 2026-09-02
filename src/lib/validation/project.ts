import { z } from "zod";

/**
 * Поля, спільні для картки проєкту в будь-якій вертикалі — не залежать від
 * Project DNA (те вертикаль-специфічне, це — завжди однакове). Разом з
 * architecture-dna.ts описує повністю форму завантаження для "Архітектури".
 */

export const DESCRIPTION_MAX_LENGTH = 1000;
export const MAX_HASHTAGS = 15;
export const HASHTAG_MAX_LENGTH = 30;

/** 21 МБ за запитом Артема — ліміт на один файл. */
export const MAX_FILE_SIZE_BYTES = 21 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = "21 МБ";

/**
 * Хештеги розширюють пошук — і внутрішній (фільтри), і зовнішній
 * (індексація Google, за проханням Артема — див. generateMetadata на
 * сторінці проєкту). Приймаємо як рядок через кому з форми, тут —
 * фінальний нормалізований масив.
 */
export const hashtagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((tag) => tag.replace(/^#/, ""))
  .pipe(z.string().min(1).max(HASHTAG_MAX_LENGTH));

export function parseHashtagsInput(raw: string): string[] {
  const candidates = raw
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const hashtags: string[] = [];
  for (const candidate of candidates) {
    const parsed = hashtagSchema.safeParse(candidate);
    if (parsed.success && !seen.has(parsed.data)) {
      seen.add(parsed.data);
      hashtags.push(parsed.data);
    }
  }
  return hashtags.slice(0, MAX_HASHTAGS);
}

/**
 * Дві незалежні ціни (за проханням Артема):
 * - priceUah — базова ціна проєкту як є
 * - developmentRightsPriceUah — окрема сума за право доопрацювати/
 *   розвинути ескіз (концепція документів: "купити, ліцензувати,
 *   розвинути"). Обидві необов'язкові — можна лишити тільки одну.
 */
export const projectBaseSchema = z.object({
  title: z.string().trim().min(3, "Вкажіть назву проєкту").max(160),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX_LENGTH, `Опис — до ${DESCRIPTION_MAX_LENGTH} символів`)
    .optional()
    .or(z.literal("")),
  hashtags: z.string().optional().or(z.literal("")),
  priceUah: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : undefined))
    .refine((value) => value === undefined || (Number.isFinite(value) && value > 0), {
      message: "Ціна має бути додатним числом",
    }),
  developmentRightsPriceUah: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : undefined))
    .refine((value) => value === undefined || (Number.isFinite(value) && value > 0), {
      message: "Сума має бути додатним числом",
    }),
});

export type ProjectBaseInput = z.infer<typeof projectBaseSchema>;
