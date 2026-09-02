import { Prisma } from "@prisma/client";
import type { ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ARCHITECTURE_TYPOLOGIES,
  STYLE_LABELS,
  TYPOLOGY_LABELS,
} from "@/lib/validation/architecture-dna";
import {
  PROJECT_FEED_PAGE_SIZE,
  type ProjectFilters,
  type ProjectSortOption,
} from "@/lib/validation/project-filters";

/**
 * Стрічка проєктів (Етап 5) — SQL пишемо вручну (Prisma.sql / $queryRaw),
 * а не через звичайні `prisma.project.findMany({ where: ... })`.
 *
 * Причина: тип об'єкта, стиль, поверховість, площа, рік і софт — не окремі
 * колонки таблиці Project, а поля всередині Project.dna (JSON). Це свідоме
 * рішення Етапу 2 (schema.prisma, коментар до поля `dna`): нова вертикаль —
 * це нова Zod-схема й нова форма, БЕЗ міграції таблиці. Платити за цю
 * гнучкість доводиться тут: числові діапазони ("площа від-до") і пошук
 * усередині JSON надійніше й прозоріше писати прямим SQL до Postgres
 * (jsonb-оператори `->>`, приведення типів), ніж покладатись на те, як
 * саме Prisma ORM транслює JSON-фільтри в конкретній версії клієнта.
 * Значення завжди підставляються через параметри Prisma.sql (не рядкова
 * конкатенація) — це так само безпечно від SQL-ін'єкцій, як prisma.*.
 *
 * Функція стосується лише вертикалі "Архітектура" (єдиної, що має дані
 * зараз, CLAUDE.md). Коли додамо інші вертикалі — цей файл розділиться на
 * по-вертикальні варіанти так само, як зараз розділені форми завантаження
 * (src/app/projects/new) і Project DNA-схеми (src/lib/validation/).
 *
 * Пагінація — офсетна (LIMIT/OFFSET), не курсорна: для стрічки-каталогу з
 * фільтрами й сортуванням (а не наприклад чату в реальному часі) це
 * стандартний і значно простіший вибір — ціна (рідкісний зсув елемента на
 * сторінку, якщо саме між двома запитами хтось додав новий проєкт) тут
 * не критична.
 */

const ARCHITECTURE_TYPOLOGY_SET = new Set<string>(ARCHITECTURE_TYPOLOGIES);

export interface FeedProject {
  id: string;
  title: string;
  status: ProjectStatus;
  /** null = "лише портфоліо" (та сама умова, що й на картці/сторінці
   * проєкту). Число, не Prisma.Decimal — для стрічки точність до копійки
   * не потрібна, а плаский number прибирає зайву неоднозначність типів
   * при передачі через /api/projects у JSON. */
  priceUah: number | null;
  authorName: string;
  university: string;
  typologyLabel: string;
  areaSqm: number;
  floors: number;
  previewUrl: string | null;
  /** Чи додав ЦЕЙ глядач проєкт собі в обране (Етап 6) — false і для
   * незалогінених, і коли viewerId у getProjectFeedPage не передано. */
  isFavorited: boolean;
}

export interface ProjectFeedPage {
  items: FeedProject[];
  /** Чи є ще принаймні одна сторінка — рахуємо трюком "візьми на один
   * рядок більше за потрібне", без окремого COUNT(*) по всій вибірці. */
  hasMore: boolean;
}

interface FeedRow {
  id: string;
  title: string;
  status: ProjectStatus;
  priceUah: number | null;
  authorName: string | null;
  university: string | null;
  typology: string | null;
  areaSqm: number | null;
  floors: number | null;
  previewUrl: string | null;
  isFavorited: boolean;
}

/** Екранує спецсимволи LIKE/ILIKE (% і _, і сам символ екранування), щоб
 * людина, яка шукає скажімо "100%", не отримала непередбачуваного шаблону. */
function escapeLikeTerm(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

const ORDER_BY_SQL: Record<ProjectSortOption, Prisma.Sql> = {
  newest: Prisma.sql`p."createdAt" DESC, p."id" DESC`,
  // COALESCE замість NULL — щоб "лише портфоліо" (priceUah IS NULL) завжди
  // осідало в кінці списку незалежно від напрямку сортування, а не
  // випадало із впорядкування через те, що NULL "не порівнюється".
  price_asc: Prisma.sql`COALESCE(p."priceUah", 999999999999) ASC, p."id" ASC`,
  price_desc: Prisma.sql`COALESCE(p."priceUah", -1) DESC, p."id" ASC`,
};

function buildWhereConditions(filters: ProjectFilters): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [
    // MVP: єдина активна вертикаль (CLAUDE.md, "Одна вертикаль спочатку").
    Prisma.sql`p."vertical" = 'ARCHITECTURE'::"Vertical"`,
  ];

  if (filters.status.length > 0) {
    conditions.push(
      Prisma.sql`p."status" IN (${Prisma.join(
        filters.status.map((status) => Prisma.sql`${status}::"ProjectStatus"`),
      )})`,
    );
  }

  if (filters.priceMin !== undefined) {
    conditions.push(Prisma.sql`p."priceUah" >= ${filters.priceMin}::numeric`);
  }
  if (filters.priceMax !== undefined) {
    conditions.push(Prisma.sql`p."priceUah" <= ${filters.priceMax}::numeric`);
  }

  if (filters.q) {
    const term = `%${escapeLikeTerm(filters.q)}%`;
    conditions.push(Prisma.sql`(
      p."title" ILIKE ${term}
      OR p."description" ILIKE ${term}
      OR EXISTS (SELECT 1 FROM unnest(p."hashtags") AS h WHERE h ILIKE ${term})
    )`);
  }

  // --- Далі — поля всередині Project DNA (JSON), лише для "Архітектури". ---

  if (filters.typology.length > 0) {
    conditions.push(Prisma.sql`(p."dna"->>'typology') = ANY(${filters.typology}::text[])`);
  }
  if (filters.style.length > 0) {
    conditions.push(Prisma.sql`(p."dna"->>'style') = ANY(${filters.style}::text[])`);
  }
  if (filters.academicType.length > 0) {
    conditions.push(Prisma.sql`(p."dna"->>'academicType') = ANY(${filters.academicType}::text[])`);
  }

  if (filters.areaMin !== undefined) {
    conditions.push(Prisma.sql`(p."dna"->>'totalAreaSqm')::float8 >= ${filters.areaMin}::float8`);
  }
  if (filters.areaMax !== undefined) {
    conditions.push(Prisma.sql`(p."dna"->>'totalAreaSqm')::float8 <= ${filters.areaMax}::float8`);
  }

  if (filters.floorsMin !== undefined) {
    conditions.push(
      Prisma.sql`(p."dna"->>'floors')::int >= ${Math.trunc(filters.floorsMin)}::int`,
    );
  }
  if (filters.floorsMax !== undefined) {
    conditions.push(
      Prisma.sql`(p."dna"->>'floors')::int <= ${Math.trunc(filters.floorsMax)}::int`,
    );
  }

  if (filters.yearMin !== undefined) {
    conditions.push(Prisma.sql`(p."dna"->>'year')::int >= ${Math.trunc(filters.yearMin)}::int`);
  }
  if (filters.yearMax !== undefined) {
    conditions.push(Prisma.sql`(p."dna"->>'year')::int <= ${Math.trunc(filters.yearMax)}::int`);
  }

  if (filters.software) {
    const term = `%${escapeLikeTerm(filters.software)}%`;
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(p."dna"->'software') AS s WHERE s ILIKE ${term}
    )`);
  }

  return conditions;
}

function mapRowToFeedProject(row: FeedRow): FeedProject {
  const typology =
    row.typology && ARCHITECTURE_TYPOLOGY_SET.has(row.typology)
      ? TYPOLOGY_LABELS[row.typology as keyof typeof TYPOLOGY_LABELS]
      : (row.typology ?? "—");

  return {
    id: row.id,
    title: row.title,
    status: row.status,
    priceUah: row.priceUah,
    authorName: row.authorName ?? "Автор",
    university: row.university ?? "",
    typologyLabel: typology,
    areaSqm: row.areaSqm ?? 0,
    floors: row.floors ?? 0,
    previewUrl: row.previewUrl,
    isFavorited: row.isFavorited,
  };
}

export interface GetProjectFeedPageOptions {
  page: number;
  take?: number;
  /** Хто дивиться стрічку зараз — лише щоб позначити вже збережені "в
   * обране" проєкти (Етап 6). Не задано для незалогінених відвідувачів. */
  viewerId?: string;
}

export async function getProjectFeedPage(
  filters: ProjectFilters,
  { page, take = PROJECT_FEED_PAGE_SIZE, viewerId }: GetProjectFeedPageOptions,
): Promise<ProjectFeedPage> {
  const safePage = Number.isFinite(page) && page > 1 ? Math.trunc(page) : 1;
  const offset = (safePage - 1) * take;

  const whereSql = Prisma.join(buildWhereConditions(filters), " AND ");
  const orderSql = ORDER_BY_SQL[filters.sort];
  const isFavoritedSql = viewerId
    ? Prisma.sql`EXISTS (
        SELECT 1 FROM "FavoriteProject" AS fp
        WHERE fp."projectId" = p."id" AND fp."userId" = ${viewerId}
      )`
    : Prisma.sql`FALSE`;

  const rows = await prisma.$queryRaw<FeedRow[]>(Prisma.sql`
    SELECT
      p."id" AS "id",
      p."title" AS "title",
      p."status" AS "status",
      p."priceUah"::float8 AS "priceUah",
      u."fullName" AS "authorName",
      u."university" AS "university",
      (p."dna"->>'typology') AS "typology",
      (p."dna"->>'totalAreaSqm')::float8 AS "areaSqm",
      (p."dna"->>'floors')::int AS "floors",
      (
        SELECT pf."url" FROM "ProjectFile" AS pf
        WHERE pf."projectId" = p."id"
        ORDER BY (pf."type" = 'RENDER') DESC, pf."order" ASC, pf."createdAt" ASC
        LIMIT 1
      ) AS "previewUrl",
      ${isFavoritedSql} AS "isFavorited"
    FROM "Project" AS p
    INNER JOIN "User" AS u ON u."id" = p."authorId"
    WHERE ${whereSql}
    ORDER BY ${orderSql}
    LIMIT ${take + 1}
    OFFSET ${offset}
  `);

  const hasMore = rows.length > take;
  const items = rows.slice(0, take).map(mapRowToFeedProject);

  return { items, hasMore };
}
