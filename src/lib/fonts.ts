import { Manrope, Unbounded } from "next/font/google";

/**
 * Дизайн-напрям (CLAUDE.md): заголовки — Unbounded (жирний, геометричний,
 * з характером), текст — Manrope (чистий, легко читається). Обидва шрифти
 * мають повну підтримку кирилиці — це головна вимога, бо основна
 * аудиторія платформи пише й читає українською.
 */
export const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
  variable: "--font-unbounded",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

/** Клас для <html>/<body>: підʼєднує обидва шрифти як CSS-змінні. */
export const fontVariables = `${unbounded.variable} ${manrope.variable}`;
