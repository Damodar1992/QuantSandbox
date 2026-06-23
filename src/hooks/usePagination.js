import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Client-side pagination for table views.
 * @param {unknown[]} items
 * @param {number} defaultPageSize
 */
export function usePagination(items, defaultPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil((items?.length || 0) / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const safePage = Math.min(page, totalPages);

  const sliceItems = useMemo(() => {
    const list = items || [];
    const start = (safePage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const goToPrev = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sliceItems,
    goToPrev,
    goToNext,
    resetPage,
    totalItems: items?.length || 0,
  };
}
