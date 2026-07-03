// src/components/Pagination.jsx
export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) rangeWithDots.push(1, '...');
    else rangeWithDots.push(1);

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) rangeWithDots.push('...', pages);
    else rangeWithDots.push(pages);

    return rangeWithDots;
  };

  const btnBase =
    'min-w-[36px] h-9 px-2 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200';

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      {/* Prev */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`${btnBase} border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
          hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Previous page"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((p, idx) =>
        p === '...' ? (
          <span key={`dot-${idx}`} className={`${btnBase} text-gray-400 cursor-default`}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${
              p === page
                ? 'bg-primary-600 text-white border border-primary-600'
                : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className={`${btnBase} border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
          hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Next page"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}
