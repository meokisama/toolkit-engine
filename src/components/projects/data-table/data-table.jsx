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
}) {
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Reset row selection when data length changes (e.g., after deleting items)
  React.useEffect(() => {
    setRowSelection({});
  }, [data.length]);

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
    <div className="w-full">
      <div className="border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
