import React, { useState } from "react";
import { Search, X, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

export function DataTableToolbar({
  table,
  searchColumn = "name",
  searchPlaceholder = "Search...",
  onBulkDelete,
  selectedRowsCount = 0,
  onAddItem,
  addItemLabel = "Add Item",
}) {
  const [searchValue, setSearchValue] = useState("");

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRowsCount > 0;

  const handleSearch = () => {
    table.getColumn(searchColumn)?.setFilterValue(searchValue);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchValue("");
    table.getColumn(searchColumn)?.setFilterValue("");
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && hasSelectedRows) {
      const selectedItems = selectedRows.map((row) => row.original);
      onBulkDelete(selectedItems);
    }
  };

  return (
    <div className="flex items-center justify-between">
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
          <Button variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4" />
            Delete ({selectedRowsCount})
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
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
