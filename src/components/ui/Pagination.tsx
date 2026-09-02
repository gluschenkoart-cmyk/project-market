import Link from "next/link";

export interface PaginationProps {
  page: number;
  totalPages: number;
  /** Будує href для сторінки N — функція, а не шаблон рядка, бо різні
   * списки адмінки (Етап 7: /admin/projects, /admin/users) мають різні
   * власні фільтри в query string, які теж треба зберегти при переході
   * між сторінками. */
  hrefForPage: (page: number) => string;
}

/** Звичайна офсетна пагінація (Попередня/Наступна) для таблиць адмінки —
 * на відміну від нескінченної стрічки на головній (Етап 5), тут вона
 * зручніша: адмін нечасто гортає список і не завжди хоче цього робити. */
export function Pagination({ page, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-4 text-sm">
      {page > 1 ? (
        <Link
          href={hrefForPage(page - 1)}
          className="font-semibold text-ink underline decoration-2 underline-offset-4 hover:text-accent"
        >
          ← Попередня
        </Link>
      ) : (
        <span />
      )}
      <span className="text-ink/60">
        Сторінка {page} з {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={hrefForPage(page + 1)}
          className="font-semibold text-ink underline decoration-2 underline-offset-4 hover:text-accent"
        >
          Наступна →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
