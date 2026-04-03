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
import { useTableDialogs } from "@/hooks/use-table-dialogs";
import { toast } from "sonner";
import log from "electron-log/renderer";

const ScheduleTable = memo(function ScheduleTable({ items = [], loading = false }) {
  const category = "schedule";
  const { deleteItem, duplicateItem, updateItem, projectItems } = useProjectDetail();
  const dialogs = useTableDialogs();
  const { openCreate, openEdit, closeCrud, openConfirm, closeConfirm, openBulkDelete, closeBulkDelete, setBulkDeleteLoading } = dialogs;

  const unitItems = projectItems?.unit || [];

  // Schedule-specific state
  const [scheduleSceneCounts, setScheduleSceneCounts] = useState({});
  const [sendScheduleDialog, setSendScheduleDialog] = useState({ open: false, items: [] });

  const [table, setTable] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({ description: false });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);

  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  useEffect(() => {
    const loadSceneCounts = async () => {
      const counts = {};
      for (const schedule of items) {
        try {
          const scenes = await window.electronAPI.schedule.getScenesWithDetails(schedule.id);
          counts[schedule.id] = scenes.length;
        } catch (error) {
          log.error(`Failed to load scene count for schedule ${schedule.id}:`, error);
          counts[schedule.id] = 0;
        }
      }
      setScheduleSceneCounts(counts);
    };

    if (items.length > 0) {
      loadSceneCounts();
    }
  }, [items]);

  const handleCreateItem = useCallback(() => openCreate(), [openCreate]);

  const handleEditItem = useCallback((item) => openEdit(item), [openEdit]);

  const handleDuplicateItem = useCallback(
    async (id) => {
      try {
        await duplicateItem(category, id);
        toast.success("Schedule duplicated successfully");
      } catch (error) {
        log.error("Failed to duplicate schedule:", error);
        toast.error("Failed to duplicate schedule");
      }
    },
    [duplicateItem, category],
  );

  const handleDeleteItem = useCallback(
    (item) => {
      openConfirm({
        title: "Delete Schedule",
        description: `Are you sure you want to delete "${item.name || "this schedule"}"? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            await deleteItem(category, item.id);
            toast.success("Schedule deleted successfully");
            closeConfirm();
          } catch (error) {
            log.error("Failed to delete schedule:", error);
            toast.error("Failed to delete schedule");
          }
        },
      });
    },
    [openConfirm, closeConfirm, deleteItem, category],
  );

  const handleDialogClose = useCallback(
    (open) => {
      if (!open) closeCrud();
    },
    [closeCrud],
  );

  const handleSendSchedule = useCallback(
    (schedule) => {
      const scheduleIndex = items.findIndex((item) => item.id === schedule.id);
      setSendScheduleDialog({ open: true, items: [{ ...schedule, calculatedIndex: scheduleIndex }] });
    },
    [items],
  );

  const handleCellEdit = useCallback((id, field, value) => {
    if (!pendingChangesRef.current.has(id)) {
      pendingChangesRef.current.set(id, {});
    }
    pendingChangesRef.current.get(id)[field] = value;
    setPendingChangesCount(pendingChangesRef.current.size);
  }, []);

  const getEffectiveValue = useCallback((item, field) => {
    const pendingChange = pendingChangesRef.current.get(item.id);
    return pendingChange && pendingChange[field] !== undefined ? pendingChange[field] : item[field] || "";
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (pendingChangesRef.current.size === 0) return;

    setSaveLoading(true);
    try {
      const updatePromises = Array.from(pendingChangesRef.current.entries()).map(([id, changes]) => {
        const originalItem = items.find((item) => item.id === id);
        if (!originalItem) throw new Error(`Original item with id ${id} not found`);

        let parsedDays = [];
        try {
          parsedDays = typeof originalItem.days === "string" ? JSON.parse(originalItem.days) : originalItem.days || [];
        } catch (e) {
          parsedDays = [];
        }

        const completeItemData = {
          name: originalItem.name || "",
          description: originalItem.description || "",
          time: originalItem.time || "",
          days: parsedDays,
          enabled: originalItem.enabled !== undefined ? originalItem.enabled : true,
          source_unit: originalItem.source_unit || null,
          mode: originalItem.mode !== undefined ? originalItem.mode : 0,
          interval_time: originalItem.interval_time || null,
          dmx_duration: originalItem.dmx_duration !== null && originalItem.dmx_duration !== undefined ? originalItem.dmx_duration : null,
          ...changes,
        };

        return updateItem(category, id, completeItemData);
      });

      await Promise.all(updatePromises);
      pendingChangesRef.current.clear();
      setPendingChangesCount(0);
      toast.success("Changes saved successfully");
    } catch (error) {
      log.error("Failed to save changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaveLoading(false);
    }
  }, [updateItem, category, items]);

  const handleBulkDelete = useCallback(
    (selectedItems) => {
      openBulkDelete(selectedItems);
    },
    [openBulkDelete],
  );

  const handleConfirmBulkDelete = useCallback(async () => {
    setBulkDeleteLoading(true);
    try {
      for (const item of dialogs.bulkDelete.items) {
        await deleteItem(category, item.id);
      }
      closeBulkDelete();
      table?.resetRowSelection();
      toast.success(`${dialogs.bulkDelete.items.length} schedule(s) deleted successfully`);
    } catch (error) {
      log.error("Failed to delete schedules:", error);
      toast.error("Failed to delete schedules");
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [dialogs.bulkDelete.items, deleteItem, category, closeBulkDelete, setBulkDeleteLoading, table]);

  const handleRowSelectionChange = useCallback((selectedCount) => setSelectedRowsCount(selectedCount), []);
  const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
  const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);

  const handleSendAllSchedules = useCallback(() => {
    const schedulesWithIndex = items.map((schedule, index) => ({ ...schedule, calculatedIndex: index }));
    setSendScheduleDialog({ open: true, items: schedulesWithIndex });
  }, [items]);

  const itemsWithCounts = items.map((item) => ({ ...item, sceneCount: scheduleSceneCounts[item.id] || 0 }));

  const columns = useMemo(() => createScheduleColumns(handleCellEdit, getEffectiveValue, unitItems), [handleCellEdit, getEffectiveValue, unitItems]);

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
                initialColumnVisibility={columnVisibility}
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

      <ScheduleDialog open={dialogs.crud.open} onOpenChange={handleDialogClose} schedule={dialogs.crud.item} mode={dialogs.crud.mode} />

      <SendScheduleDialog
        open={sendScheduleDialog.open}
        onOpenChange={(open) => setSendScheduleDialog((prev) => ({ ...prev, open }))}
        items={sendScheduleDialog.items}
      />

      <ConfirmDialog
        open={dialogs.confirm.open}
        onOpenChange={(open) => !open && closeConfirm()}
        title={dialogs.confirm.title}
        description={dialogs.confirm.description}
        onConfirm={dialogs.confirm.onConfirm}
      />

      <ConfirmDialog
        open={dialogs.bulkDelete.open}
        onOpenChange={(open) => !open && closeBulkDelete()}
        title="Delete Schedules"
        description={`Are you sure you want to delete ${dialogs.bulkDelete.items.length} selected schedule(s)? This action cannot be undone.`}
        onConfirm={handleConfirmBulkDelete}
        loading={dialogs.bulkDelete.loading}
      />
    </div>
  );
});

export { ScheduleTable };
