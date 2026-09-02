import { z } from "zod";

/**
 * Project DNA для вертикалі "Архітектура" (ProjectMarketConceptSummary,
 * розділ 3, розширено 01.09.2026 за запитом Артема). Зберігається в
 * Project.dna (JSON) і валідується цією Zod-схемою на етапі завантаження
 * проєкту (форма — Етап 4).
 *
 * Коли додамо вертикаль "Образотворче мистецтво" тощо — поруч з'явиться
 * fineArtDnaSchema за тим самим принципом, і Project.dna лишиться без змін.
 */
export const ARCHITECTURE_TYPOLOGIES = [
  "RESIDENTIAL",
  "PUBLIC",
  "INDUSTRIAL",
  "LANDSCAPE",
  "URBAN_PLANNING",
  "COMMERCIAL",
  "SMALL_ARCHITECTURAL_FORM",
  "STREET_FURNITURE",
  "STREET_ART_OBJECT",
  "MONUMENT",
  "FOUNTAIN",
] as const;

export const TYPOLOGY_LABELS: Record<(typeof ARCHITECTURE_TYPOLOGIES)[number], string> = {
  RESIDENTIAL: "Житлова",
  PUBLIC: "Громадська",
  INDUSTRIAL: "Промислова",
  LANDSCAPE: "Ландшафтна",
  URBAN_PLANNING: "Містобудівна",
  COMMERCIAL: "Комерційна нерухомість",
  SMALL_ARCHITECTURAL_FORM: "Мала архітектурна форма",
  STREET_FURNITURE: "Вуличні меблі",
  STREET_ART_OBJECT: "Вуличний арт-обʼєкт",
  MONUMENT: "Монумент",
  FOUNTAIN: "Фонтан",
};

/**
 * Архітектурний стиль — за запитом Артема, повний перелік з української
 * Вікіпедії плюс три службові варіанти (BIONIC, CUSTOM, UNDEFINED), яких
 * там нема, але без них поле неможливо було б завжди заповнити.
 */
export const ARCHITECTURE_STYLES = [
  "ROMANESQUE",
  "MONUMENTALISM",
  "GOTHIC",
  "RENAISSANCE",
  "CLASSICISM",
  "EMPIRE",
  "BAROQUE",
  "UKRAINIAN_BAROQUE",
  "ROCOCO",
  "NEO_GOTHIC",
  "MODERNISM",
  "NEOCLASSICISM",
  "RETROSPECTIVISM",
  "CONSTRUCTIVISM",
  "SCANDINAVIAN_CLASSICISM",
  "NORTHERN_MODERN",
  "ECLECTICISM",
  "ART_DECO",
  "DECONSTRUCTIVISM",
  "BEAUX_ARTS",
  "HIGH_TECH",
  "KINETIC",
  "BIONIC",
  "CUSTOM",
  "UNDEFINED",
] as const;

export const STYLE_LABELS: Record<(typeof ARCHITECTURE_STYLES)[number], string> = {
  ROMANESQUE: "Романський стиль",
  MONUMENTALISM: "Монументалізм",
  GOTHIC: "Готика",
  RENAISSANCE: "Ренесанс",
  CLASSICISM: "Класицизм",
  EMPIRE: "Ампір",
  BAROQUE: "Бароко",
  UKRAINIAN_BAROQUE: "Українське бароко",
  ROCOCO: "Рококо",
  NEO_GOTHIC: "Неоготика (псевдоготика)",
  MODERNISM: "Модернізм",
  NEOCLASSICISM: "Неокласицизм",
  RETROSPECTIVISM: "Ретроспективізм",
  CONSTRUCTIVISM: "Конструктивізм",
  SCANDINAVIAN_CLASSICISM: "Скандинавський класицизм",
  NORTHERN_MODERN: "Північний модерн",
  ECLECTICISM: "Еклектизм",
  ART_DECO: "Ар-деко",
  DECONSTRUCTIVISM: "Деконструктивізм",
  BEAUX_ARTS: "Боз-ар",
  HIGH_TECH: "Хай-тек",
  KINETIC: "Кінетична архітектура",
  BIONIC: "Біонічна архітектура",
  CUSTOM: "Власний стиль",
  UNDEFINED: "Стиль не визначено",
};

/**
 * Походження роботи — НЕ статус проєкту на платформі (той описаний в
 * Prisma-схемі як ProjectStatus). Це окрема вісь: яким саме навчальним
 * завданням ця робота була в оригіналі.
 */
export const ACADEMIC_TYPES = ["COURSEWORK", "COMPETITION", "DIPLOMA", "CONCEPT"] as const;

export const ACADEMIC_TYPE_LABELS: Record<(typeof ACADEMIC_TYPES)[number], string> = {
  COURSEWORK: "Навчальний",
  COMPETITION: "Конкурсний",
  DIPLOMA: "Дипломний",
  CONCEPT: "Концепт",
};

export const architectureDnaSchema = z.object({
  typology: z.enum(ARCHITECTURE_TYPOLOGIES),
  style: z.enum(ARCHITECTURE_STYLES),
  /** Вільний підтип, напр. "багатоквартирний житловий комплекс". */
  subtype: z.string().max(120).optional(),
  totalAreaSqm: z.number().positive(),
  floors: z.number().int().positive(),
  /** Кількість юнітів — здебільшого для житлових об'єктів. */
  units: z.number().int().positive().optional(),
  /** Необов'язкове, але бажане поле (позначаємо це у формі, не в схемі). */
  plotAreaSqm: z.number().positive().optional(),
  year: z.number().int().min(1900).max(2100),
  academicType: z.enum(ACADEMIC_TYPES),
  /** Напр. ["AutoCAD", "Revit", "Lumion"]. */
  software: z.array(z.string().min(1)).default([]),
});

export type ArchitectureDna = z.infer<typeof architectureDnaSchema>;
