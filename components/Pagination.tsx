import Link from 'next/link';

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}

function buildHref(basePath: string, searchParams: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) params.set(key, value);
  }
  params.set('page', String(page));
  return `${basePath}?${params.toString()}`;
}

export function Pagination({ page, totalPages, basePath, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 pt-6" aria-label="Pagination">
      <Link
        href={buildHref(basePath, searchParams, Math.max(1, page - 1))}
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
        className={`rounded-md border px-4 py-2 text-sm font-medium ${
          prevDisabled
            ? 'pointer-events-none border-gray-100 text-gray-300'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        Previous
      </Link>
      <span className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </span>
      <Link
        href={buildHref(basePath, searchParams, Math.min(totalPages, page + 1))}
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
        className={`rounded-md border px-4 py-2 text-sm font-medium ${
          nextDisabled
            ? 'pointer-events-none border-gray-100 text-gray-300'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        Next
      </Link>
    </nav>
  );
}
