/**
 * Спільний перетворювач Zod-помилок на "перше повідомлення на поле" —
 * той самий підхід, що вже був локально в src/app/projects/new/actions.ts
 * (Етап 4), винесений сюди, щоб нові форми Етапу 6 (редагування профілю,
 * розблокування контактів) не копіювали його втретє-вчетверте.
 */
export function firstIssueByField(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): Partial<Record<string, string>> {
  const result: Partial<Record<string, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}
