import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Market — маркетплейс нереалізованих креативних проєктів",
  description:
    "Студенти архітектури, образотворчого мистецтва, скульптури, дизайну та цифрового мистецтва показують, архівують і продають свої навчальні проєкти.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk" className={fontVariables}>
      <body className="antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
