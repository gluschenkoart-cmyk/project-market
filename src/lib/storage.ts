import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Тимчасове сховище файлів проєктів — локальний диск під /public/uploads.
 *
 * Свідомо не S3/Cloudflare R2 з першого дня: вибір і підключення реального
 * провайдера — окрема розмова з Артемом (потрібен акаунт, оплата), а форма
 * завантаження (Етап 4) мала запрацювати вже зараз. Це ЄДИНЕ місце в коді,
 * яке знає, ЯК саме зберігається файл — коли оберемо провайдера, міняється
 * тільки ця функція, а не форма чи server action, які просто викликають
 * `saveProjectFile` і отримують назад публічний URL.
 *
 * Застереження (важливо для вибору хостингу пізніше): це працює тільки на
 * сервері зі стабільним диском (звичайний VPS). На serverless-хостингах
 * типу Vercel файлова система тимчасова і завантажені файли зникнуть після
 * наступного деплою — там знадобиться реальне зовнішнє сховище.
 */

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export interface StoredFile {
  url: string;
  originalName: string;
}

export async function saveProjectFile(file: File, projectId: string): Promise<StoredFile> {
  const dir = path.join(UPLOAD_ROOT, projectId);
  await mkdir(dir, { recursive: true });

  const extension = path.extname(file.name).slice(0, 10);
  const filename = `${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return {
    url: `/uploads/${projectId}/${filename}`,
    originalName: file.name,
  };
}
