"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { TextareaField } from "@/components/ui/TextareaField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { Button } from "@/components/ui/Button";
import {
  ARCHITECTURE_TYPOLOGIES,
  TYPOLOGY_LABELS,
  ARCHITECTURE_STYLES,
  STYLE_LABELS,
  ACADEMIC_TYPES,
  ACADEMIC_TYPE_LABELS,
} from "@/lib/validation/architecture-dna";
import { DESCRIPTION_MAX_LENGTH, MAX_FILE_SIZE_LABEL } from "@/lib/validation/project";
import { createProjectAction, type NewProjectFormState } from "./actions";

const initialState: NewProjectFormState = { fieldErrors: {} };

const TYPOLOGY_OPTIONS: SelectOption[] = ARCHITECTURE_TYPOLOGIES.map((value) => ({
  value,
  label: TYPOLOGY_LABELS[value],
}));
const STYLE_OPTIONS: SelectOption[] = ARCHITECTURE_STYLES.map((value) => ({
  value,
  label: STYLE_LABELS[value],
}));
const ACADEMIC_TYPE_OPTIONS: SelectOption[] = ACADEMIC_TYPES.map((value) => ({
  value,
  label: ACADEMIC_TYPE_LABELS[value],
}));

export function NewProjectForm() {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);
  const [descriptionLength, setDescriptionLength] = useState(0);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-extrabold text-ink">Новий проєкт</h1>
        <p className="text-ink/70">
          Напрям: Архітектура. Обов'язкові поля позначені зірочкою — решту
          можна заповнити пізніше, відредагувавши проєкт.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-10">
        <fieldset className="flex flex-col gap-5">
          <legend className="mb-1 font-heading text-lg font-bold text-ink">Загальне</legend>
          <Field label="Назва проєкту *" name="title" required error={state.fieldErrors.title} />
          <TextareaField
            label="Опис"
            name="description"
            maxLength={DESCRIPTION_MAX_LENGTH}
            hint={`${descriptionLength}/${DESCRIPTION_MAX_LENGTH} символів`}
            onChange={(event) => setDescriptionLength(event.target.value.length)}
            error={state.fieldErrors.description}
          />
          <Field
            label="Хештеги"
            name="hashtags"
            placeholder="напр. житловий-комплекс, модернізм, київ"
            hint="Через кому — розширюють пошук на платформі й у Google"
            error={state.fieldErrors.hashtags}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="mb-1 font-heading text-lg font-bold text-ink">Про об'єкт</legend>
          <SelectField
            label="Тип об'єкта *"
            name="typology"
            options={TYPOLOGY_OPTIONS}
            placeholder="Оберіть тип"
            required
            error={state.fieldErrors.typology}
          />
          <SelectField
            label="Стиль архітектури *"
            name="style"
            options={STYLE_OPTIONS}
            placeholder="Оберіть стиль"
            required
            error={state.fieldErrors.style}
          />
          <Field
            label="Підтип"
            name="subtype"
            placeholder="напр. багатоквартирний житловий комплекс"
            error={state.fieldErrors.subtype}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Загальна площа, м² *"
              name="totalAreaSqm"
              type="number"
              min={0}
              step="any"
              required
              error={state.fieldErrors.totalAreaSqm}
            />
            <Field
              label="Площа ділянки, м² (бажано)"
              name="plotAreaSqm"
              type="number"
              min={0}
              step="any"
              error={state.fieldErrors.plotAreaSqm}
            />
            <Field
              label="Поверховість *"
              name="floors"
              type="number"
              min={1}
              step={1}
              required
              error={state.fieldErrors.floors}
            />
            <Field
              label="К-сть юнітів"
              name="units"
              type="number"
              min={1}
              step={1}
              error={state.fieldErrors.units}
            />
            <Field
              label="Рік *"
              name="year"
              type="number"
              min={1900}
              max={2100}
              step={1}
              required
              error={state.fieldErrors.year}
            />
          </div>
          <SelectField
            label="Тип роботи *"
            name="academicType"
            options={ACADEMIC_TYPE_OPTIONS}
            placeholder="Оберіть тип"
            required
            error={state.fieldErrors.academicType}
          />
          <Field
            label="Використаний софт"
            name="software"
            placeholder="напр. AutoCAD, Revit, Lumion"
            hint="Через кому"
            error={state.fieldErrors.software}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="mb-1 font-heading text-lg font-bold text-ink">Ціна</legend>
          <p className="text-sm text-ink/60">
            Обидва поля необов&apos;язкові — можна лишити тільки одне, обидва,
            або жодного (тоді проєкт показується як портфоліо, без продажу).
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Ціна, грн"
              name="priceUah"
              type="number"
              min={0}
              step="any"
              error={state.fieldErrors.priceUah}
            />
            <Field
              label="Авторське право на доопрацювання, грн"
              name="developmentRightsPriceUah"
              type="number"
              min={0}
              step="any"
              hint="Сума за право розвинути ваш ескіз далі"
              error={state.fieldErrors.developmentRightsPriceUah}
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="mb-1 font-heading text-lg font-bold text-ink">Файли</legend>
          <p className="text-sm text-ink/60">До {MAX_FILE_SIZE_LABEL} на файл.</p>
          <FileDropzone name="files_RENDER" label="Рендери" accept="image/*" />
          <FileDropzone name="files_PLAN" label="Плани" accept="image/*,.pdf,.dwg" />
          <FileDropzone name="files_SECTION" label="Розрізи" accept="image/*,.pdf,.dwg" />
          <FileDropzone
            name="files_MODEL_3D"
            label="3D-модель"
            accept=".skp,.3dm,.fbx,.obj,.rvt"
            multiple={false}
          />
          <FileDropzone name="files_DOCUMENT" label="Документи" accept=".pdf,.doc,.docx" />
          {state.fieldErrors.files ? (
            <p className="text-xs font-semibold text-accent">{state.fieldErrors.files}</p>
          ) : null}
        </fieldset>

        {state.formError ? <p className="font-semibold text-accent">{state.formError}</p> : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Зберігаємо…" : "Опублікувати проєкт"}
        </Button>
      </form>
    </main>
  );
}
