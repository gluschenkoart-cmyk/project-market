import type { UserRole } from "@prisma/client";

/**
 * Українські підписи ролей — спільні для профілю (src/app/profile/page.tsx)
 * і адмінки (src/app/admin/), щоб не тримати той самий переклад у двох
 * місцях (той самий підхід, що й PROJECT_STATUS_LABELS у
 * src/lib/project-status.ts).
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  CREATOR: "Творець",
  RECEIVER: "Отримувач",
};
