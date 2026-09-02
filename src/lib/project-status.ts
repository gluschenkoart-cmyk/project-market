import type { ProjectStatus } from "@prisma/client";
import type { ProjectStatus as BadgeStatus } from "@/components/ui/Badge";

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
