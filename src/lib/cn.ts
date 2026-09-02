type ClassValue = string | number | false | null | undefined;

/**
 * Мінімальний хелпер для умовного зʼєднання CSS-класів — без зайвих
 * залежностей (clsx/tailwind-merge можна додати пізніше, якщо конфлікти
 * класів стануть реальною проблемою).
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
