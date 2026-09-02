"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL } from "@/lib/validation/project";

export interface FileDropzoneProps {
  name: string;
  label: string;
  hint?: string;
  accept?: string;
  /** За замовчуванням можна додати кілька файлів (напр. декілька рендерів). */
  multiple?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

/**
 * Поле завантаження файлів з попереднім переглядом (запит Артема: "треба
 * проробити можливість попереднього перегляду"). "Основний перегляд" — уже
 * на сторінці проєкту після публікації (src/app/projects/[id]/page.tsx).
 *
 * Технічна деталь: щоб дозволити прибирати окремі файли зі списку (а не
 * тільки "обрати все заново"), ми ведемо власний стан `files` і синхронно
 * записуємо його назад у прихований <input type="file"> через DataTransfer
 * — так звичайна відправка форми (FormData) далі бачить саме той набір
 * файлів, що показаний людині, без жодного окремого JS-запиту.
 */
export function FileDropzone({ name, label, hint, accept, multiple = true }: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  function syncInputFiles(next: File[]) {
    const transfer = new DataTransfer();
    next.forEach((file) => transfer.items.add(file));
    if (inputRef.current) {
      inputRef.current.files = transfer.files;
    }
  }

  function handleSelect(list: FileList | null) {
    if (!list || list.length === 0) return;

    const incoming = Array.from(list);
    const accepted = incoming.filter((file) => file.size <= MAX_FILE_SIZE_BYTES);
    const oversized = incoming.filter((file) => file.size > MAX_FILE_SIZE_BYTES);

    setError(
      oversized.length > 0
        ? `${oversized.map((file) => file.name).join(", ")} — більше ${MAX_FILE_SIZE_LABEL}, не додано`
        : null,
    );

    const next = multiple ? [...files, ...accepted] : accepted.slice(0, 1);
    setFiles(next);
    syncInputFiles(next);
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    syncInputFiles(next);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-heading text-sm font-bold text-ink">{label}</span>

      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[3px] border-dashed border-ink/40 bg-ink/[0.02] px-4 py-6 text-center transition-colors hover:border-ink hover:bg-ink/5"
      >
        <span className="font-semibold text-ink">
          Натисніть, щоб обрати файл{multiple ? "и" : ""}
        </span>
        {hint ? <span className="text-xs text-ink/50">{hint}</span> : null}
        <span className="text-xs text-ink/40">До {MAX_FILE_SIZE_LABEL} на файл</span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => handleSelect(event.target.files)}
      />

      {error ? <p className="text-xs font-semibold text-accent">{error}</p> : null}

      {files.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {files.map((file, index) => (
            <FilePreview key={`${file.name}-${file.size}-${index}`} file={file} onRemove={() => removeFile(index)} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <li className="relative flex w-28 flex-col gap-1 rounded-xl border-[3px] border-ink bg-paper p-2">
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Прибрати ${file.name}`}
        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-ink bg-accent-2 text-xs font-bold text-ink"
      >
        ×
      </button>
      {previewUrl ? (
        // Прев'ю з локального File до відправки форми — тимчасовий blob:-URL,
        // next/image тут не застосовний.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={file.name} className="h-16 w-full rounded-lg object-cover" />
      ) : (
        <div className="flex h-16 w-full items-center justify-center rounded-lg bg-ink/5 text-2xl" aria-hidden>
          📄
        </div>
      )}
      <span className="truncate text-[11px] text-ink/70" title={file.name}>
        {file.name}
      </span>
      <span className="text-[10px] text-ink/40">{formatFileSize(file.size)}</span>
    </li>
  );
}
