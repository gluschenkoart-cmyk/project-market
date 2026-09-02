import { PrismaClient } from "@prisma/client";

/**
 * Стандартний патерн для Next.js: у dev-режимі hot-reload перестворював би
 * PrismaClient на кожну зміну файлу й вичерпав би пул з'єднань до бази.
 * Зберігаємо єдиний інстанс у globalThis і перевикористовуємо його.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
