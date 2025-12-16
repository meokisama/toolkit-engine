import React, { memo, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { createSequenceColumns } from "@/components/projects/sequences/sequence-columns";
import { SequenceDialog } from "@/components/projects/sequences/sequence-dialog";
import { SendSequenceDialog } from "@/components/projects/sequences/send-sequence-dialog";
import { ListOrdered } from "lucide-react";
import { toast } from "sonner";

const SequenceTable = memo(function SequenceTable({ items = [], loading = false }) {
  const category = "sequences";
  const { deleteItem, duplicateItem, updateItem, projectItems } = useProjectDetail();

  // Get unit items for source unit filtering
  const unitItems = projectItems?.unit || [];
  const [sequenceCounts, setSequenceCounts] = useState({});
  const [table, setTable] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: null,
  });
  const [sendSequenceDialog, setSendSequenceDialog] = useState({
    open: false,
    items: [],
  });

  // Add states for table functionality
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // Use ref instead of state to avoid re-renders when pendingChanges update
  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Load multi-scene counts for each sequence
  const loadSequenceCounts = useCallback(async () => {
    try {
      const counts = {};
      for (const sequence of items) {
        try {
          const multiScenes = await window.electronAPI.sequences.getMultiScenes(sequence.id);
          counts[sequence.id] = multiScenes.length;
        } catch (error) {
          console.error(`Failed to load multi-scene count for sequence ${sequence.id}:`, error);
          counts[sequence.id] = 0;
        }
      }
      setSequenceCounts(counts);
    } catch (error) {
      console.error("Failed to load sequence counts:", error);
    }
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      loadSequenceCounts();
    }
  }, [items, loadSequenceCounts]);

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
        // Reload multi-scene counts after duplication
        setTimeout(loadSequenceCounts, 100);
      } catch (error) {
        console.error("Failed to duplicate sequence:", error);
      }
    },
    [duplicateItem, loadSequenceCounts]
  );

  const handleDeleteItem = useCallback(
    (item) => {
      setConfirmDialog({
        open: true,
        title: "Delete Sequence",
        description: `Are you sure you want to delete "${item?.name}"? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            await deleteItem(category, item.id);
            setConfirmDialog({ ...confirmDialog, open: false });
            // Reload multi-scene counts after deletion
            setTimeout(loadSequenceCounts, 100);
          } catch (error) {
            console.error("Failed to delete sequence:", error);
          }
        },
      });
    },
    [deleteItem, confirmDialog, loadSequenceCounts]
  );

  const handleSendToUnit = useCallback(
    (item) => {
      // Calculate index based on array position instead of database ID
      const sequenceIndex = items.findIndex((sequence) => sequence.id === item.id);
      setSendSequenceDialog({
        open: true,
        items: [{ ...item, calculatedIndex: sequenceIndex }], // Single sequence as array
      });
    },
    [items]
  );

  const handleSendAllSequences = useCallback(() => {
    // Add calculated index to all sequences
    const sequencesWithIndex = items.map((sequence, index) => ({
      ...sequence,
      calculatedIndex: index,
    }));

    setSendSequenceDialog({
      open: true,
      items: sequencesWithIndex, // Pass all sequences as array
    });
  }, [items]);

  // Add handlers for table functionality
  const handleRowSelectionChange = useCallback((selectedCount) => {
    setSelectedRowsCount(selectedCount);
  }, []);

  const handleColumnVisibilityChange = useCallback((visibility) => {
    setColumnVisibility(visibility);
  }, []);

  const handlePaginationChange = useCallback((newPagination) => {
    setPagination(newPagination);
  }, []);

  const handleBulkDelete = useCallback(
    async (selectedItems) => {
      setConfirmDialog({
        open: true,
        title: "Delete Sequences",
        description: `Are you sure you want to delete ${selectedItems.length} sequence(s)? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            for (const item of selectedItems) {
              await deleteItem(category, item.id);
            }
            toast.success(`Successfully deleted ${selectedItems.length} sequence(s)`);
            setConfirmDialog({ ...confirmDialog, open: false });
          } catch (error) {
            console.error("Failed to delete sequences:", error);
            toast.error("Failed to delete sequences");
          }
        },
      });
    },
    [deleteItem, confirmDialog]
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
      console.error("Failed to save changes:", error);
      const errorMessage = error.message || "Failed to save changes";
      toast.error(errorMessage);
    } finally {
      setSaveLoading(false);
    }
  }, [updateItem, items]);

  const handleDialogClose = useCallback(
    (success) => {
      setDialogOpen(false);
      setEditingItem(null);
      if (success) {
        // Reload multi-scene counts after successful create/edit
        setTimeout(loadSequenceCounts, 100);
      }
    },
    [loadSequenceCounts]
  );

  // Stable function that doesn't change reference
  const handleCellEdit = useCallback((itemId, field, value) => {
    const existingChanges = pendingChangesRef.current.get(itemId) || {};
    pendingChangesRef.current.set(itemId, {
      ...existingChanges,
      [field]: value,
    });

    // Only trigger re-render for toolbar save button
    setPendingChangesCount(pendingChangesRef.current.size);
  }, []);

  // Stable function that doesn't depend on state
  const getEffectiveValue = useCallback((item, field) => {
    const pendingChange = pendingChangesRef.current.get(item.id);
    return pendingChange && pendingChange[field] !== undefined ? pendingChange[field] : item[field];
  }, []); // No dependencies = stable function!

  // Add multi-scene counts to items data
  const itemsWithCounts = items.map((item) => ({
    ...item,
    multiSceneCount: sequenceCounts[item.id] || 0,
  }));

  // Now columns will be truly stable because all dependencies are stable!
  const columns = useMemo(
    () => createSequenceColumns(handleEditItem, handleDuplicateItem, handleDeleteItem, handleCellEdit, getEffectiveValue, handleSendToUnit, unitItems),
    [
      handleEditItem,
      handleDuplicateItem,
      handleDeleteItem,
      handleCellEdit,
      getEffectiveValue, // This is now stable!
      handleSendToUnit,
      unitItems,
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
                onColumnVisibilityChange={handleColumnVisibilityChange}
                onPaginationChange={handlePaginationChange}
                onEdit={handleEditItem}
                onDuplicate={handleDuplicateItem}
                onDelete={handleDeleteItem}
                enableRowSelection={true}
              />
            </div>
            {table && <DataTablePagination table={table} pagination={pagination} />}
          </div>
        )}
      </div>

      <SequenceDialog open={dialogOpen} onOpenChange={handleDialogClose} sequence={editingItem} mode={dialogMode} />

      <SendSequenceDialog
        open={sendSequenceDialog.open}
        onOpenChange={(open) => setSendSequenceDialog((prev) => ({ ...prev, open }))}
        items={sendSequenceDialog.items}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
});

export { SequenceTable };
