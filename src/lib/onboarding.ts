import type { UserRole, Vertical } from "@prisma/client";

/**
 * Мінімальний набір полів, потрібний, щоб вважати профіль заповненим.
 * Використовується і в /onboarding (що ще запитати), і в /profile
 * (пускати далі чи повернути на онбординг) — єдине джерело істини для
 * цього правила, щоб дві сторінки не розійшлись у визначенні.
 */
export interface ProfileCompletenessInput {
  phone: string | null;
  university: string | null;
  copyrightConfirmed: boolean;
  role: UserRole | null;
  primaryVertical: Vertical | null;
}

export function isProfileComplete(user: ProfileCompletenessInput | null | undefined): boolean {
  if (!user) return false;
  if (!user.phone || !user.university || !user.copyrightConfirmed || !user.role) {
    return false;
  }
  // RECEIVER (покупець) не має основного творчого напряму — це поле лише
  // для CREATOR (див. коментар до User.primaryVertical у schema.prisma).
  if (user.role === "CREATOR" && !user.primaryVertical) {
    return false;
  }
  return true;
}
