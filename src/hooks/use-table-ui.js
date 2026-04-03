import { useCallback } from "react";
import { useTableUIStore } from "@/store/use-table-ui-store";
import { useProjectNavStore } from "@/store/use-project-nav-store";

const DEFAULT_PAGE_SIZE = 10;

/**
 * Persisted table UI preferences.
 *
 * - columnVisibility: persisted to localStorage (global user preference)
 * - pageSize: persisted to localStorage (global user preference)
 * - pageIndex: in-memory per project+table, resets on app restart
 *
 * @param {string} tableKey - Category name, e.g. "lighting", "knx"
 * @param {object} defaultColumnVisibility - Default column visibility for this table type
 */
export function useTableUI(tableKey, defaultColumnVisibility = {}) {
  const projectId = useProjectNavStore((s) => s.selectedProject?.id);
  // pageIndex is keyed per project so switching projects resets the page
  const pageIndexKey = projectId ? `${projectId}_${tableKey}` : tableKey;
  const columnVisibility = useTableUIStore((s) => s.columnVisibility[tableKey] ?? defaultColumnVisibility);
  const pageSize = useTableUIStore((s) => s.pageSizes[tableKey] ?? DEFAULT_PAGE_SIZE);
  const pageIndex = useTableUIStore((s) => s.pageIndexes[pageIndexKey] ?? 0);
  const setColumnVisibility = useTableUIStore((s) => s.setColumnVisibility);
  const setPageSize = useTableUIStore((s) => s.setPageSize);
  const setPageIndex = useTableUIStore((s) => s.setPageIndex);
  const pagination = { pageIndex, pageSize };
  const onColumnVisibilityChange = useCallback((visibility) => setColumnVisibility(tableKey, visibility), [tableKey, setColumnVisibility]);
  const onPaginationChange = useCallback(
    ({ pageIndex: newPageIndex, pageSize: newPageSize }) => {
      if (newPageSize !== pageSize) setPageSize(tableKey, newPageSize);
      if (newPageIndex !== pageIndex) setPageIndex(pageIndexKey, newPageIndex);
    },
    [tableKey, pageIndexKey, pageSize, pageIndex, setPageSize, setPageIndex],
  );

  return {
    columnVisibility,
    pagination,
    onColumnVisibilityChange,
    onPaginationChange,
  };
}
