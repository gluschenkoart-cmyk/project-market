import { Prisma, PrismaClient } from "@prisma/client";
import type { ArchitectureDna } from "../src/lib/validation/architecture-dna";

const prisma = new PrismaClient();

/**
 * "Посівний" контент для локальної розробки — приклад із документа персон
 * (PersonyTaShlyahKorystuvacha.md, автор 1 з 5). Так само знадобиться перед
 * публічним запуском (DorozhnyaKarta.md, Фаза 1: "щоб перші відвідувачі не
 * бачили порожню стрічку"), лише з реальними проєктами замість цього.
 */
async function main() {
  const maria = await prisma.user.upsert({
    where: { email: "maria.koval@example.com" },
    update: {},
    create: {
      email: "maria.koval@example.com",
      fullName: "Марія Коваль",
      phone: "+380001234567",
      university: "КНУБА",
      faculty: "Архітектурний факультет, спец. 191",
      copyrightConfirmed: true,
      role: "CREATOR",
      primaryVertical: "ARCHITECTURE",
    },
  });

  const dna: ArchitectureDna = {
    typology: "RESIDENTIAL",
    style: "MODERNISM",
    subtype: "Житловий комплекс для студентського містечка",
    totalAreaSqm: 7400,
    floors: 9,
    year: 2026,
    academicType: "DIPLOMA",
    software: ["AutoCAD", "Revit", "Lumion"],
  };

  await prisma.project.upsert({
    where: { id: "seed-maria-project-1" },
    update: {},
    create: {
      id: "seed-maria-project-1",
      authorId: maria.id,
      vertical: "ARCHITECTURE",
      title: "Житловий комплекс для студентського містечка",
      description:
        "Дипломний проєкт — житловий комплекс на 9 поверхів для студентського містечка.",
      status: "FOR_SALE",
      priceUah: 45000,
      // Project.dna — Json-поле; Prisma генерує для нього власний ширший
      // тип (Prisma.InputJsonValue), тому конкретну Zod-модель приводимо
      // явно замість покладатись на структурну сумісність.
      dna: dna as unknown as Prisma.InputJsonValue,
    },
  });

  // Ще два проєкти — щоб стрічку й фільтри (Етап 5) було на чому
  // перевірити: різні типи об'єкта, стилі, статуси й ціни (зокрема один
  // без ціни — "лише портфоліо").
  const publicSpaceDna: ArchitectureDna = {
    typology: "PUBLIC",
    style: "HIGH_TECH",
    subtype: "Міський культурний центр",
    totalAreaSqm: 3200,
    floors: 4,
    year: 2025,
    academicType: "CONCEPT",
    software: ["Rhino", "Lumion"],
  };

  await prisma.project.upsert({
    where: { id: "seed-maria-project-2" },
    update: {},
    create: {
      id: "seed-maria-project-2",
      authorId: maria.id,
      vertical: "ARCHITECTURE",
      title: "Культурний центр біля набережної",
      description: "Концепт багатофункціонального культурного центру.",
      status: "CONCEPT",
      // Без ціни — свідомо: демонструє картку "лише портфоліо".
      dna: publicSpaceDna as unknown as Prisma.InputJsonValue,
    },
  });

  const commercialDna: ArchitectureDna = {
    typology: "COMMERCIAL",
    style: "ART_DECO",
    subtype: "Торговельно-офісний центр",
    totalAreaSqm: 12500,
    floors: 6,
    year: 2024,
    academicType: "COURSEWORK",
    software: ["ArchiCAD"],
  };

  await prisma.project.upsert({
    where: { id: "seed-maria-project-3" },
    update: {},
    create: {
      id: "seed-maria-project-3",
      authorId: maria.id,
      vertical: "ARCHITECTURE",
      title: "Торговельно-офісний центр у стилі ар-деко",
      description: "Курсовий проєкт комерційної нерухомості.",
      status: "FOR_SALE",
      priceUah: 120000,
      dna: commercialDna as unknown as Prisma.InputJsonValue,
    },
  });

  // Приклад ролі RECEIVER (покупець) — персона Марека з
  // PersonyTaShlyahKorystuvacha.md, "Покупець 1 з 2".
  await prisma.user.upsert({
    where: { email: "marek@example.com" },
    update: {},
    create: {
      email: "marek@example.com",
      fullName: "Marek Nowak",
      phone: "+48001234567",
      university: "—",
      copyrightConfirmed: true,
      role: "RECEIVER",
    },
  });

  console.log("Seed завершено: 2 користувачі (CREATOR, RECEIVER), 3 проєкти.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
