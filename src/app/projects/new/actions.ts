"use server";

import { redirect } from "next/navigation";
import type { Prisma, ProjectFileType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isProfileComplete } from "@/lib/onboarding";
import { saveProjectFile } from "@/lib/storage";
import { architectureDnaSchema } from "@/lib/validation/architecture-dna";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
  parseHashtagsInput,
  projectBaseSchema,
} from "@/lib/validation/project";

export interface NewProjectFormState {
  fieldErrors: Partial<Record<string, string>>;
  formError?: string;
}

/** Категорії файлів у формі — імена input'ів звідси ж (FileDropzone). */
const FILE_FIELDS: ReadonlyArray<{ field: string; type: ProjectFileType }> = [
  { field: "files_RENDER", type: "RENDER" },
  { field: "files_PLAN", type: "PLAN" },
  { field: "files_SECTION", type: "SECTION" },
  { field: "files_MODEL_3D", type: "MODEL_3D" },
  { field: "files_DOCUMENT", type: "DOCUMENT" },
];

function firstIssueByField(issues: { path: PropertyKey[]; message: string }[]) {
  const result: Partial<Record<string, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}

export async function createProjectAction(
  _prevState: NewProjectFormState,
  formData: FormData,
): Promise<NewProjectFormState> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !isProfileComplete(user) || user.role !== "CREATOR") {
    redirect("/profile");
  }

  const raw = Object.fromEntries(formData);

  const baseParsed = projectBaseSchema.safeParse(raw);

  // Числові поля Project DNA приходять з форми рядками — приводимо їх до
  // чисел ще до валідації Zod-схемою, яка вже очікує number.
  const dnaCandidate = {
    typology: raw.typology,
    style: raw.style,
    subtype: typeof raw.subtype === "string" && raw.subtype.trim() ? raw.subtype : undefined,
    totalAreaSqm: raw.totalAreaSqm ? Number(raw.totalAreaSqm) : undefined,
    floors: raw.floors ? Number(raw.floors) : undefined,
    units: raw.units ? Number(raw.units) : undefined,
    plotAreaSqm: raw.plotAreaSqm ? Number(raw.plotAreaSqm) : undefined,
    year: raw.year ? Number(raw.year) : undefined,
    academicType: raw.academicType,
    software:
      typeof raw.software === "string"
        ? raw.software
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
  };
  const dnaParsed = architectureDnaSchema.safeParse(dnaCandidate);

  const fieldErrors: Partial<Record<string, string>> = {
    ...(baseParsed.success ? {} : firstIssueByField(baseParsed.error.issues)),
    ...(dnaParsed.success ? {} : firstIssueByField(dnaParsed.error.issues)),
  };

  // Розмір файлів перевіряємо ще раз тут: клієнт (FileDropzone) уже
  // відфільтрував завеликі файли, але клієнту в цьому не довіряємо.
  const filesToStore: { type: ProjectFileType; file: File }[] = [];
  for (const { field, type } of FILE_FIELDS) {
    const entries = formData
      .getAll(field)
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    for (const file of entries) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        fieldErrors.files = `Файл «${file.name}» більший за ${MAX_FILE_SIZE_LABEL}`;
        continue;
      }
      filesToStore.push({ type, file });
    }
  }

  if (!baseParsed.success || !dnaParsed.success || Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const { title, description, hashtags, priceUah, developmentRightsPriceUah } = baseParsed.data;
  const dna = dnaParsed.data;

  let projectId: string;
  try {
    const project = await prisma.project.create({
      data: {
        authorId: user.id,
        vertical: "ARCHITECTURE",
        title,
        description: description || null,
        priceUah: priceUah ?? null,
        developmentRightsPriceUah: developmentRightsPriceUah ?? null,
        hashtags: parseHashtagsInput(hashtags ?? ""),
        status: priceUah || developmentRightsPriceUah ? "FOR_SALE" : "ACADEMIC",
        // Project.dna — Prisma.InputJsonValue ширший за нашу Zod-модель,
        // тому приводимо тип явно (той самий підхід, що й у prisma/seed.ts).
        dna: dna as unknown as Prisma.InputJsonValue,
      },
    });
    projectId = project.id;

    if (filesToStore.length > 0) {
      const stored = await Promise.all(
        filesToStore.map(async ({ type, file }, order) => {
          const { url, originalName } = await saveProjectFile(file, project.id);
          return { type, order, url, originalName };
        }),
      );

      await prisma.projectFile.createMany({
        data: stored.map(({ type, order, url, originalName }) => ({
          projectId: project.id,
          type,
          url,
          // Немає окремого пайплайну мініатюр (Етап 4, TODO) — поки що
          // previewUrl дорівнює url, поле вже існує для реальних мініатюр.
          previewUrl: url,
          originalName,
          order,
        })),
      });
    }
  } catch (error) {
    console.error("Не вдалося створити проєкт:", error);
    return { fieldErrors: {}, formError: "Щось пішло не так. Спробуйте ще раз." };
  }

  redirect(`/projects/${projectId}`);
}
