type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="min-h-11 border border-beige-300 px-3 disabled:opacity-40"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>
      {pages.map((number) => (
        <button
          key={number}
          type="button"
          aria-current={number === page ? "page" : undefined}
          className={
            number === page
              ? "min-h-11 min-w-11 border border-forest-800 bg-forest-800 px-3 text-ivory-50"
              : "min-h-11 min-w-11 border border-beige-300 px-3"
          }
          onClick={() => onPageChange(number)}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        className="min-h-11 border border-beige-300 px-3 disabled:opacity-40"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
      >
        Next
      </button>
    </nav>
  );
}
