import type { ProjectStatus } from "@prisma/client";
import { STATUS_LABELS, type ProjectStatus as BadgeStatus } from "@/components/ui/Badge";

/**
 * Prisma зберігає статус проєкту у ВЕЛИКИХ_ЛІТЕРАХ (enum ProjectStatus),
 * а компонент <StatusBadge> очікує нижній регістр — так його зробили в
 * Етапі 1, ще до появи цієї enum. Замість того щоб міняти один з двох
 * (і там, і там уже є код, який на це покладається), тримаємо один
 * спільний мапінг, яким користуються всі сторінки, що показують статус.
 */
export const PROJECT_STATUS_TO_BADGE: Record<ProjectStatus, BadgeStatus> = {
  ACADEMIC: "academic",
  CONCEPT: "concept",
  FOR_SALE: "for_sale",
  SOLD: "sold",
  IN_DEVELOPMENT: "in_development",
  BUILT: "built",
  ARCHIVED: "archived",
};

/**
 * Усі значення enum ProjectStatus як звичайний масив рядків — виведено з
 * ключів мапи вище (а не продубльовано вручну і не імпортовано рантайм-enum
 * з @prisma/client, який у цьому проєкті свідомо ніде не імпортують як
 * значення — лише як тип, за прикладом architecture-dna.ts). Використовує
 * Етап 5 (src/lib/validation/project-filters.ts) для переліку значень у
 * фільтрі "Статус проєкту".
 */
export const PROJECT_STATUS_VALUES = Object.keys(PROJECT_STATUS_TO_BADGE) as ProjectStatus[];

/**
 * Українські підписи статусів, ключовані enum-значенням Prisma (а не
 * рядком Badge-компонента) — щоб фільтр Етапу 5 показував ті самі слова,
 * що й сама картка проєкту, з єдиного джерела (STATUS_LABELS у Badge.tsx),
 * а не другий рукописний переклад.
 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = Object.fromEntries(
  (Object.entries(PROJECT_STATUS_TO_BADGE) as [ProjectStatus, BadgeStatus][]).map(
    ([status, badge]) => [status, STATUS_LABELS[badge]],
  ),
) as Record<ProjectStatus, string>;
