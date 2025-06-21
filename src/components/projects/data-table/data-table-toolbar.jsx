import React, { useState, useCallback } from "react";
import {
  Search,
  X,
  Trash2,
  Plus,
  Download,
  Upload,
  FileText,
  Save,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableViewOptions } from "./data-table-view-options";

export function DataTableToolbar({
  table,
  searchColumn = "name",
  searchPlaceholder = "Search...",
  onBulkDelete,
  selectedRowsCount = 0,
  onAddItem,
  addItemLabel = "Add Item",
  onExport,
  onImport,
  category,
  columnVisibility,
  onSave,
  hasPendingChanges = false,
  saveLoading = false,
  onSendAll,
  sendAllLabel = "Send All",
  onSendToUnit,
  sendToUnitLabel = "Send to Unit",
  sendToUnitIcon: SendToUnitIcon = Send,
}) {
  const [searchValue, setSearchValue] = useState("");

  const selectedRows = table?.getFilteredSelectedRowModel()?.rows || [];
  const hasSelectedRows = selectedRowsCount > 0;

  // Memoize handlers to prevent unnecessary rerenders
  const handleSearch = useCallback(() => {
    table?.getColumn(searchColumn)?.setFilterValue(searchValue);
  }, [table, searchColumn, searchValue]);

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchValue("");
    table?.getColumn(searchColumn)?.setFilterValue("");
  }, [table, searchColumn]);

  const handleBulkDelete = useCallback(() => {
    if (onBulkDelete && hasSelectedRows) {
      const selectedItems = selectedRows.map((row) => row.original);
      onBulkDelete(selectedItems);
    }
  }, [onBulkDelete, selectedRows]);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
    }
  }, [onExport]);

  const handleImport = useCallback(() => {
    if (onImport) {
      onImport();
    }
  }, [onImport]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  const handleSendAll = useCallback(() => {
    if (onSendAll) {
      onSendAll();
    }
  }, [onSendAll]);

  const handleSendToUnit = useCallback(() => {
    if (onSendToUnit && hasSelectedRows) {
      const selectedItems = selectedRows.map((row) => row.original);
      onSendToUnit(selectedItems);
    }
  }, [onSendToUnit, selectedRows, hasSelectedRows]);

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-8 pr-8 max-w-sm"
          />
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {hasSelectedRows && (
          <>
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4" />
              <span className="hidden lg:inline">Delete </span>(
              {selectedRowsCount})
            </Button>
            {onSendToUnit && category === "knx" && (
              <Button variant="outline" onClick={handleSendToUnit}>
                <SendToUnitIcon className="h-4 w-4" />
                <span className="hidden lg:inline">{sendToUnitLabel}</span>
              </Button>
            )}
          </>
        )}

        {hasPendingChanges && (
          <Button
            onClick={handleSave}
            disabled={saveLoading}
            className="bg-green-700 hover:bg-green-800"
          >
            <Save className="h-4 w-4" />
            {saveLoading ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {onSendAll &&
          (category === "scene" ||
            category === "schedule" ||
            category === "curtain" ||
            category === "knx") && (
            <Button variant="outline" onClick={handleSendAll}>
              <Send className="h-4 w-4" />
              <span className="hidden lg:inline">{sendAllLabel}</span>
            </Button>
          )}
        {(onExport || onImport) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-gray-700">
                <FileText className="h-4 w-4" />
                <span className="hidden lg:inline">Import/Export Data</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExport && (
                <DropdownMenuItem onClick={handleExport}>
                  <Upload className="h-4 w-4" />
                  Export data
                </DropdownMenuItem>
              )}
              {onImport && (
                <DropdownMenuItem onClick={handleImport}>
                  <Download className="h-4 w-4" />
                  Import data
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <DataTableViewOptions
          table={table}
          columnVisibility={columnVisibility}
        />
        {onAddItem && (
          <Button onClick={onAddItem}>
            <Plus className="h-4 w-4" />
            {addItemLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
