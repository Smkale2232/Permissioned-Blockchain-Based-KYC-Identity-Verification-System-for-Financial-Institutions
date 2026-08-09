import { useState, useMemo, useEffect } from 'react';

// Client-side pagination over an already-filtered/sorted array. Resets to
// page 0 whenever the input list's length changes (e.g. a new search term
// narrows the results) so you're never stuck looking at an empty page.
export function usePagination(items, defaultRowsPerPage = 10) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  useEffect(() => {
    setPage(0);
  }, [items.length]);

  const pageItems = useMemo(() => {
    const start = page * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return { page, setPage, rowsPerPage, handleChangeRowsPerPage, pageItems };
}
