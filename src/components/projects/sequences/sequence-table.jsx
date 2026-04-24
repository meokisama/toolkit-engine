import React, { memo, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProjectDetail } from "@/store/use-project-detail";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { createSequenceColumns } from "@/components/projects/sequences/sequence-columns";
import { SequenceDialog } from "@/components/projects/sequences/sequence-dialog";
import { SendSequenceDialog } from "@/components/projects/sequences/send-sequence-dialog";
import { ListOrdered } from "lucide-react";
import { useTableDialogs } from "@/hooks/use-table-dialogs";
import { useTableUI } from "@/hooks/use-table-ui";
import { toast } from "sonner";
import log from "electron-log/renderer";

const SequenceTable = memo(function SequenceTable({ items = [], loading = false }) {
  const category = "sequences";
  const { deleteItem, duplicateItem, updateItem, projectItems } = useProjectDetail();
  const dialogs = useTableDialogs();
  const { openCreate, openEdit, closeCrud, openConfirm, closeConfirm } = dialogs;

  const unitItems = projectItems?.unit || [];

  // Sequence-specific state
  const [sequenceCounts, setSequenceCounts] = useState({});
  const [sendSequenceDialog, setSendSequenceDialog] = useState({ open: false, items: [] });

  const [table, setTable] = useState(null);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const { columnVisibility, pagination, onColumnVisibilityChange, onPaginationChange } = useTableUI(category);
  const [saveLoading, setSaveLoading] = useState(false);

  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  const loadSequenceCounts = useCallback(async () => {
    try {
      const counts = {};
      for (const sequence of items) {
        try {
          const multiScenes = await window.electronAPI.sequences.getMultiScenes(sequence.id);
          counts[sequence.id] = multiScenes.length;
        } catch (error) {
          log.error(`Failed to load multi-scene count for sequence ${sequence.id}:`, error);
          counts[sequence.id] = 0;
        }
      }
      setSequenceCounts(counts);
    } catch (error) {
      log.error("Failed to load sequence counts:", error);
    }
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      loadSequenceCounts();
    }
  }, [items, loadSequenceCounts]);

  const handleCreateItem = useCallback(() => openCreate(), [openCreate]);

  const handleEditItem = useCallback((item) => openEdit(item), [openEdit]);

  const handleDuplicateItem = useCallback(
    async (id) => {
      try {
        await duplicateItem(category, id);
        setTimeout(loadSequenceCounts, 100);
      } catch (error) {
        log.error("Failed to duplicate sequence:", error);
      }
    },
    [duplicateItem, loadSequenceCounts],
  );

  const handleDeleteItem = useCallback(
    (item) => {
      openConfirm({
        title: "Delete Sequence",
        description: `Are you sure you want to delete "${item?.name}"? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            await deleteItem(category, item.id);
            closeConfirm();
            setTimeout(loadSequenceCounts, 100);
          } catch (error) {
            log.error("Failed to delete sequence:", error);
          }
        },
      });
    },
    [openConfirm, closeConfirm, deleteItem, loadSequenceCounts],
  );

  const handleSendSequence = useCallback(
    (item) => {
      const sequenceIndex = items.findIndex((sequence) => sequence.id === item.id);
      setSendSequenceDialog({ open: true, items: [{ ...item, calculatedIndex: sequenceIndex }] });
    },
    [items],
  );

  const handleSendAllSequences = useCallback(() => {
    const sequencesWithIndex = items.map((sequence, index) => ({ ...sequence, calculatedIndex: index }));
    setSendSequenceDialog({ open: true, items: sequencesWithIndex });
  }, [items]);

  const handleRowSelectionChange = useCallback((selectedCount) => setSelectedRowsCount(selectedCount), []);

  const handleBulkDelete = useCallback(
    (selectedItems) => {
      openConfirm({
        title: "Delete Sequences",
        description: `Are you sure you want to delete ${selectedItems.length} sequence(s)? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            for (const item of selectedItems) {
              await deleteItem(category, item.id);
            }
            toast.success(`Successfully deleted ${selectedItems.length} sequence(s)`);
            closeConfirm();
          } catch (error) {
            log.error("Failed to delete sequences:", error);
            toast.error("Failed to delete sequences");
          }
        },
      });
    },
    [openConfirm, closeConfirm, deleteItem],
  );

  const handleSaveChanges = useCallback(async () => {
    if (pendingChangesRef.current.size === 0) return;

    setSaveLoading(true);
    try {
      for (const [itemId, changes] of pendingChangesRef.current) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          const updatedItem = { ...item, ...changes };
          await updateItem(category, itemId, updatedItem);
        }
      }
      pendingChangesRef.current.clear();
      setPendingChangesCount(0);
      toast.success("Changes saved successfully");
    } catch (error) {
      log.error("Failed to save changes:", error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaveLoading(false);
    }
  }, [updateItem, items]);

  const handleDialogClose = useCallback(
    (success) => {
      closeCrud();
      if (success) setTimeout(loadSequenceCounts, 100);
    },
    [closeCrud, loadSequenceCounts],
  );

  const handleCellEdit = useCallback((itemId, field, value) => {
    const existingChanges = pendingChangesRef.current.get(itemId) || {};
    pendingChangesRef.current.set(itemId, { ...existingChanges, [field]: value });
    setPendingChangesCount(pendingChangesRef.current.size);
  }, []);

  const getEffectiveValue = useCallback((item, field) => {
    const pendingChange = pendingChangesRef.current.get(item.id);
    return pendingChange && pendingChange[field] !== undefined ? pendingChange[field] : item[field];
  }, []);

  const itemsWithCounts = items.map((item) => ({ ...item, multiSceneCount: sequenceCounts[item.id] || 0 }));

  const columns = useMemo(() => createSequenceColumns(handleCellEdit, getEffectiveValue, unitItems), [handleCellEdit, getEffectiveValue, unitItems]);

  if (loading) {
    return <DataTableSkeleton />;
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex-1 space-y-4">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground flex flex-col justify-center items-center h-full -mt-8">
            <ListOrdered className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sequences found.</p>
            <p className="text-sm mb-8">Click "Add Sequence" to create your first sequence.</p>
            <Button onClick={handleCreateItem}>
              <Plus className="h-4 w-4" />
              Add Sequence
            </Button>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col h-full">
            <div className="flex-1 space-y-4">
              {table && (
                <DataTableToolbar
                  table={table}
                  searchColumn="name"
                  searchPlaceholder="Search sequences..."
                  onBulkDelete={handleBulkDelete}
                  selectedRowsCount={selectedRowsCount}
                  category={category}
                  columnVisibility={columnVisibility}
                  onAddItem={handleCreateItem}
                  addItemLabel="Add Sequence"
                  onSave={handleSaveChanges}
                  hasPendingChanges={pendingChangesCount > 0}
                  saveLoading={saveLoading}
                  onSendAll={handleSendAllSequences}
                  sendAllLabel="Send All Sequences"
                />
              )}
              <DataTable
                key={category}
                columns={columns}
                data={itemsWithCounts}
                initialPagination={pagination}
                onTableReady={setTable}
                onRowSelectionChange={handleRowSelectionChange}
                onColumnVisibilityChange={onColumnVisibilityChange}
                onPaginationChange={onPaginationChange}
                onEdit={handleEditItem}
                onDuplicate={handleDuplicateItem}
                onDelete={handleDeleteItem}
                onSendSequence={handleSendSequence}
                enableRowSelection={true}
              />
            </div>
            {table && <DataTablePagination table={table} pagination={pagination} />}
          </div>
        )}
      </div>

      <SequenceDialog open={dialogs.crud.open} onOpenChange={handleDialogClose} sequence={dialogs.crud.item} mode={dialogs.crud.mode} />

      <SendSequenceDialog
        open={sendSequenceDialog.open}
        onOpenChange={(open) => setSendSequenceDialog((prev) => ({ ...prev, open }))}
        items={sendSequenceDialog.items}
      />

      <ConfirmDialog
        open={dialogs.confirm.open}
        onOpenChange={(open) => !open && closeConfirm()}
        title={dialogs.confirm.title}
        description={dialogs.confirm.description}
        onConfirm={dialogs.confirm.onConfirm}
      />
    </div>
  );
});

export { SequenceTable };
