import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DataTablePagination({ table, pagination }) {
  // Use prop-based state instead of internal state management
  const [localPagination, setLocalPagination] = React.useState(
    pagination || { pageIndex: 0, pageSize: 10 }
  );

  // Update local state when prop changes
  React.useEffect(() => {
    if (pagination) {
      setLocalPagination(pagination);
    }
  }, [pagination]);

  const pageCount = table.getPageCount();

  return (
    <div className="flex items-center justify-end px-2 gap-6">
      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium">Rows</p>
        <Select
          value={`${localPagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
            // Update local state immediately
            setLocalPagination((prev) => ({
              ...prev,
              pageSize: Number(value),
              pageIndex: 0, // Reset to first page when changing page size
            }));
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={localPagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
        Page {localPagination.pageIndex + 1} / {pageCount}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="hidden lg:flex"
          onClick={() => {
            table.setPageIndex(0);
            setLocalPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to first page</span>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            table.previousPage();
            setLocalPagination((prev) => ({
              ...prev,
              pageIndex: Math.max(0, prev.pageIndex - 1),
            }));
          }}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            table.nextPage();
            setLocalPagination((prev) => ({
              ...prev,
              pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1),
            }));
          }}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hidden lg:flex"
          onClick={() => {
            table.setPageIndex(pageCount - 1);
            setLocalPagination((prev) => ({
              ...prev,
              pageIndex: pageCount - 1,
            }));
          }}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to last page</span>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
