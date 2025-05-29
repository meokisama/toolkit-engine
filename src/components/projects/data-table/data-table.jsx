"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableRow } from "./data-table-row";

export function DataTable({
  columns,
  data,
  onTableReady,
  onRowSelectionChange,
  onColumnVisibilityChange,
  onPaginationChange,
  onEdit,
  onDuplicate,
  onDelete,
  initialPagination,
  enableRowSelection = false,
}) {
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState(
    initialPagination || {
      pageIndex: 0,
      pageSize: 10,
    }
  );

  // Sync pagination state with parent when initialPagination changes
  React.useEffect(() => {
    if (initialPagination) {
      setPagination(initialPagination);
    }
  }, [initialPagination]);

  // Reset row selection when data length changes (e.g., after deleting items)
  React.useEffect(() => {
    setRowSelection({});
  }, [data.length]);

  // Adjust pagination when data changes to ensure current page is valid
  React.useEffect(() => {
    if (data.length > 0) {
      const maxPageIndex = Math.ceil(data.length / pagination.pageSize) - 1;
      if (pagination.pageIndex > maxPageIndex) {
        setPagination((prev) => ({
          ...prev,
          pageIndex: Math.max(0, maxPageIndex),
        }));
      }
    }
  }, [data.length, pagination.pageSize, pagination.pageIndex]);

  // Notify parent component when row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedCount = Object.keys(rowSelection).filter(
        (id) => rowSelection[id]
      ).length;
      onRowSelectionChange(selectedCount, rowSelection);
    }
  }, [rowSelection, onRowSelectionChange]);

  // Notify parent component when column visibility changes
  React.useEffect(() => {
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(columnVisibility);
    }
  }, [columnVisibility, onColumnVisibilityChange]);

  // Notify parent component when pagination changes
  React.useEffect(() => {
    if (onPaginationChange) {
      onPaginationChange(pagination);
    }
  }, [pagination, onPaginationChange]);

  // Memoize table configuration to prevent unnecessary recreations
  const tableConfig = React.useMemo(
    () => ({
      data,
      columns,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onPaginationChange: setPagination,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      onColumnVisibilityChange: setColumnVisibility,
      onRowSelectionChange: setRowSelection,
      enableRowSelection: enableRowSelection,
      // Disable auto reset to preserve pagination state when data changes
      autoResetPageIndex: false,
      autoResetRowSelection: false,
      state: {
        sorting,
        columnFilters,
        columnVisibility,
        rowSelection,
        pagination,
      },
    }),
    [
      data,
      columns,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      enableRowSelection,
    ]
  );

  const table = useReactTable(tableConfig);

  // Pass table instance to parent component - memoized callback
  const memoizedOnTableReady = React.useCallback(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  React.useEffect(() => {
    memoizedOnTableReady();
  }, [memoizedOnTableReady]);

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.className}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table
              .getRowModel()
              .rows.map((row) => (
                <DataTableRow
                  key={row.id}
                  row={row}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
