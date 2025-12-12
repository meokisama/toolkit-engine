import React, { useState, useCallback, memo, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { ScheduleDialog } from "@/components/projects/schedules/schedule-dialog";
import { SendScheduleDialog } from "@/components/projects/schedules/send-schedule-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { createScheduleColumns } from "./schedule-columns";
import { toast } from "sonner";

const ScheduleTable = memo(function ScheduleTable({ items = [], loading = false }) {
  const category = "schedule";
  const { deleteItem, duplicateItem, updateItem } = useProjectDetail();
  const [scheduleSceneCounts, setScheduleSceneCounts] = useState({});
  const [table, setTable] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingItem, setEditingItem] = useState(null);
  const [sendScheduleDialog, setSendScheduleDialog] = useState({
    open: false,
    items: [],
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: null,
  });
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Track pending changes for inline editing
  const [saveLoading, setSaveLoading] = useState(false);

  // Use ref instead of state to avoid re-renders when pendingChanges update
  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Row selection and bulk delete state
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Load scene counts for each schedule
  useEffect(() => {
    const loadSceneCounts = async () => {
      const counts = {};
      for (const schedule of items) {
        try {
          const scenes = await window.electronAPI.schedule.getScenesWithDetails(schedule.id);
          counts[schedule.id] = scenes.length;
        } catch (error) {
          console.error(`Failed to load scene count for schedule ${schedule.id}:`, error);
          counts[schedule.id] = 0;
        }
      }
      setScheduleSceneCounts(counts);
    };

    if (items.length > 0) {
      loadSceneCounts();
    }
  }, [items]);

  const handleCreateItem = useCallback(() => {
    setEditingItem(null);
    setDialogMode("create");
    setDialogOpen(true);
  }, []);

  const handleEditItem = useCallback((item) => {
    setEditingItem(item);
    setDialogMode("edit");
    setDialogOpen(true);
  }, []);

  const handleDuplicateItem = useCallback(
    async (id) => {
      try {
        await duplicateItem(category, id);
        toast.success("Schedule duplicated successfully");
      } catch (error) {
        console.error("Failed to duplicate schedule:", error);
        toast.error("Failed to duplicate schedule");
      }
    },
    [duplicateItem, category]
  );

  const handleDeleteItem = useCallback(
    (item) => {
      setConfirmDialog({
        open: true,
        title: "Delete Schedule",
        description: `Are you sure you want to delete "${item.name || "this schedule"}"? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            await deleteItem(category, item.id);
            toast.success("Schedule deleted successfully");
          } catch (error) {
            console.error("Failed to delete schedule:", error);
            toast.error("Failed to delete schedule");
          }
          setConfirmDialog({ ...confirmDialog, open: false });
        },
      });
    },
    [deleteItem, category, confirmDialog]
  );

  const handleDialogClose = useCallback((open) => {
    setDialogOpen(open);
    if (!open) {
      setEditingItem(null);
    }
  }, []);

  const handleSendSchedule = useCallback(
    (schedule) => {
      // Calculate index based on array position instead of database ID
      const scheduleIndex = items.findIndex((item) => item.id === schedule.id);
      setSendScheduleDialog({
        open: true,
        items: [{ ...schedule, calculatedIndex: scheduleIndex }], // Single schedule as array
      });
    },
    [items]
  );

  // Stable function that doesn't change reference
  const handleCellEdit = useCallback((id, field, value) => {
    if (!pendingChangesRef.current.has(id)) {
      pendingChangesRef.current.set(id, {});
    }
    pendingChangesRef.current.get(id)[field] = value;

    // Only trigger re-render for toolbar save button
    setPendingChangesCount(pendingChangesRef.current.size);
  }, []);

  // Stable function that doesn't depend on state
  const getEffectiveValue = useCallback((item, field) => {
    const pendingChange = pendingChangesRef.current.get(item.id);
    return pendingChange && pendingChange[field] !== undefined ? pendingChange[field] : item[field] || "";
  }, []); // No dependencies = stable function!

  // Save pending changes
  const handleSaveChanges = useCallback(async () => {
    if (pendingChangesRef.current.size === 0) return;

    setSaveLoading(true);
    try {
      const updatePromises = Array.from(pendingChangesRef.current.entries()).map(([id, changes]) => {
        // Find the original item to merge with changes
        const originalItem = items.find((item) => item.id === id);
        if (!originalItem) {
          throw new Error(`Original item with id ${id} not found`);
        }

        // Parse days field to ensure it's an array
        let parsedDays = [];
        try {
          parsedDays = typeof originalItem.days === "string" ? JSON.parse(originalItem.days) : originalItem.days || [];
        } catch (e) {
          parsedDays = [];
        }

        // Merge changes with original item data to ensure all required fields are present
        const completeItemData = {
          name: originalItem.name || "",
          description: originalItem.description || "",
          time: originalItem.time || "",
          days: parsedDays, // Ensure days is always an array
          enabled: originalItem.enabled !== undefined ? originalItem.enabled : true,
          ...changes, // Apply the pending changes on top
        };

        return updateItem(category, id, completeItemData);
      });

      await Promise.all(updatePromises);
      pendingChangesRef.current.clear();
      setPendingChangesCount(0);
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaveLoading(false);
    }
  }, [updateItem, category, items]);

  // Bulk delete handlers
  const handleBulkDelete = useCallback((selectedItems) => {
    setItemsToDelete(selectedItems);
    setBulkDeleteDialogOpen(true);
  }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    setBulkDeleteLoading(true);
    try {
      for (const item of itemsToDelete) {
        await deleteItem(category, item.id);
      }
      setBulkDeleteDialogOpen(false);
      setItemsToDelete([]);
      table?.resetRowSelection();
      toast.success(`${itemsToDelete.length} schedule(s) deleted successfully`);
    } catch (error) {
      console.error("Failed to delete schedules:", error);
      toast.error("Failed to delete schedules");
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [deleteItem, itemsToDelete, table, category]);

  const handleRowSelectionChange = useCallback((selectedCount) => {
    setSelectedRowsCount(selectedCount);
  }, []);

  const handleColumnVisibilityChange = useCallback((newVisibility) => {
    setColumnVisibility(newVisibility);
  }, []);

  const handlePaginationChange = useCallback((newPagination) => {
    setPagination(newPagination);
  }, []);

  const handleSendAllSchedules = useCallback(() => {
    // Add calculated index to all schedules
    const schedulesWithIndex = items.map((schedule, index) => ({
      ...schedule,
      calculatedIndex: index,
    }));

    setSendScheduleDialog({
      open: true,
      items: schedulesWithIndex, // Pass all schedules as array
    });
  }, [items]);

  // Add scene counts to items data
  const itemsWithCounts = items.map((item) => ({
    ...item,
    sceneCount: scheduleSceneCounts[item.id] || 0,
  }));

  // Now columns will be truly stable because all dependencies are stable!
  const columns = useMemo(
    () => createScheduleColumns(handleEditItem, handleDuplicateItem, handleDeleteItem, handleCellEdit, getEffectiveValue, handleSendSchedule),
    [
      handleEditItem,
      handleDuplicateItem,
      handleDeleteItem,
      handleCellEdit,
      getEffectiveValue, // This is now stable!
      handleSendSchedule,
    ]
  );

  if (loading) {
    return <DataTableSkeleton />;
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex-1 space-y-4">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground flex flex-col justify-center items-center h-full -mt-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No schedules found.</p>
            <p className="text-sm mb-8">Click "Add Schedule" to create your first schedule.</p>
            <Button onClick={handleCreateItem}>
              <Plus className="h-4 w-4" />
              Add Schedule
            </Button>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col h-full">
            <div className="flex-1 space-y-4">
              {table && (
                <DataTableToolbar
                  table={table}
                  searchColumn="name"
                  searchPlaceholder="Search schedules..."
                  onBulkDelete={handleBulkDelete}
                  selectedRowsCount={selectedRowsCount}
                  category={category}
                  columnVisibility={columnVisibility}
                  onAddItem={handleCreateItem}
                  addItemLabel="Add Schedule"
                  onSave={handleSaveChanges}
                  hasPendingChanges={pendingChangesCount > 0}
                  saveLoading={saveLoading}
                  onSendAll={handleSendAllSchedules}
                  sendAllLabel="Send All Schedules"
                />
              )}
              <DataTable
                key={category}
                columns={columns}
                data={itemsWithCounts}
                initialPagination={pagination}
                onTableReady={setTable}
                onRowSelectionChange={handleRowSelectionChange}
                onColumnVisibilityChange={handleColumnVisibilityChange}
                onPaginationChange={handlePaginationChange}
                onEdit={handleEditItem}
                onDuplicate={handleDuplicateItem}
                onDelete={handleDeleteItem}
                onSendSchedule={handleSendSchedule}
                enableRowSelection={true}
              />
            </div>
            {table && <DataTablePagination table={table} pagination={pagination} />}
          </div>
        )}
      </div>

      <ScheduleDialog open={dialogOpen} onOpenChange={handleDialogClose} schedule={editingItem} mode={dialogMode} />

      <SendScheduleDialog
        open={sendScheduleDialog.open}
        onOpenChange={(open) => setSendScheduleDialog({ ...sendScheduleDialog, open })}
        items={sendScheduleDialog.items}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete Schedules"
        description={`Are you sure you want to delete ${itemsToDelete.length} selected schedule(s)? This action cannot be undone.`}
        onConfirm={handleConfirmBulkDelete}
        loading={bulkDeleteLoading}
      />
    </div>
  );
});

export { ScheduleTable };
