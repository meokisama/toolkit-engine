import React, { memo, useState, useCallback, useEffect } from "react";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { createMultiSceneColumns } from "@/components/projects/multi-scenes/multi-scene-columns";
import { MultiSceneDialog } from "@/components/projects/multi-scenes/multi-scene-dialog";
import { SendMultiSceneDialog } from "@/components/projects/multi-scenes/send-multi-scene-dialog";
import { Layers } from "lucide-react";
import { toast } from "sonner";

const MultiSceneTable = memo(function MultiSceneTable({ items = [], loading = false }) {
  const category = "multi_scenes";
  const { deleteItem, duplicateItem, updateItem } = useProjectDetail();
  const [multiSceneCounts, setMultiSceneCounts] = useState({});
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
  const [sendMultiSceneDialog, setSendMultiSceneDialog] = useState({
    open: false,
    items: [],
  });

  // Load scene counts for each multi-scene
  const loadMultiSceneCounts = useCallback(async () => {
    try {
      const counts = {};
      for (const multiScene of items) {
        try {
          const scenes = await window.electronAPI.multiScenes.getScenes(multiScene.id);
          counts[multiScene.id] = scenes.length;
        } catch (error) {
          console.error(`Failed to load scene count for multi-scene ${multiScene.id}:`, error);
          counts[multiScene.id] = 0;
        }
      }
      setMultiSceneCounts(counts);
    } catch (error) {
      console.error("Failed to load multi-scene counts:", error);
    }
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      loadMultiSceneCounts();
    }
  }, [items, loadMultiSceneCounts]);

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
        // Reload scene counts after duplication
        setTimeout(loadMultiSceneCounts, 100);
      } catch (error) {
        console.error("Failed to duplicate multi-scene:", error);
      }
    },
    [duplicateItem, loadMultiSceneCounts]
  );

  const handleDeleteItem = useCallback(
    (id) => {
      const item = items.find((item) => item.id === id);
      setConfirmDialog({
        open: true,
        title: "Delete Multi-Scene",
        description: `Are you sure you want to delete "${item?.name}"? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            await deleteItem(category, id);
            setConfirmDialog({ ...confirmDialog, open: false });
            // Reload scene counts after deletion
            setTimeout(loadMultiSceneCounts, 100);
          } catch (error) {
            console.error("Failed to delete multi-scene:", error);
          }
        },
      });
    },
    [items, deleteItem, confirmDialog, loadMultiSceneCounts]
  );

  const handleCellEdit = useCallback(
    (item, field, currentValue) => {
      // For now, just open the edit dialog
      handleEditItem(item);
    },
    [handleEditItem]
  );

  const getEffectiveValue = useCallback((item, field, currentValue) => {
    return currentValue;
  }, []);

  const handleSendToUnit = useCallback(
    (item) => {
      // Calculate index based on array position instead of database ID
      const multiSceneIndex = items.findIndex((multiScene) => multiScene.id === item.id);
      setSendMultiSceneDialog({
        open: true,
        items: [{ ...item, calculatedIndex: multiSceneIndex }], // Single multi-scene as array
      });
    },
    [items]
  );

  const handleSendAllMultiScenes = useCallback(() => {
    // Add calculated index to all multi-scenes
    const multiScenesWithIndex = items.map((multiScene, index) => ({
      ...multiScene,
      calculatedIndex: index,
    }));

    setSendMultiSceneDialog({
      open: true,
      items: multiScenesWithIndex, // Pass all multi-scenes as array
    });
  }, [items]);

  const handleDialogClose = useCallback(
    (success) => {
      setDialogOpen(false);
      setEditingItem(null);
      if (success) {
        // Reload scene counts after successful create/edit
        setTimeout(loadMultiSceneCounts, 100);
      }
    },
    [loadMultiSceneCounts]
  );

  // Add scene counts to items data
  const itemsWithCounts = items.map((item) => ({
    ...item,
    sceneCount: multiSceneCounts[item.id] || 0,
  }));

  const columns = createMultiSceneColumns(
    handleEditItem,
    handleDuplicateItem,
    handleDeleteItem,
    handleCellEdit,
    getEffectiveValue,
    handleSendToUnit
  );

  if (loading) {
    return <DataTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Multi-Scenes</h2>
          <span className="text-sm text-gray-500">({items.length})</span>
        </div>
        <Button onClick={handleCreateItem} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Multi-Scene
        </Button>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No multi-scenes found</p>
            <p className="text-sm">Create your first multi-scene to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {table && (
              <DataTableToolbar
                table={table}
                category={category}
                onSendAll={handleSendAllMultiScenes}
                sendAllLabel="Send All Multi-Scenes"
              />
            )}
            <div className="rounded-md border">
              <DataTable
                key={category}
                columns={columns}
                data={itemsWithCounts}
                onTableReady={setTable}
                onEdit={handleEditItem}
                onDuplicate={handleDuplicateItem}
                onDelete={handleDeleteItem}
                enableRowSelection={true}
              />
            </div>
            {table && <DataTablePagination table={table} />}
          </div>
        )}
      </div>

      <MultiSceneDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        multiScene={editingItem}
        mode={dialogMode}
      />

      <SendMultiSceneDialog
        open={sendMultiSceneDialog.open}
        onOpenChange={(open) =>
          setSendMultiSceneDialog((prev) => ({ ...prev, open }))
        }
        items={sendMultiSceneDialog.items}
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

export { MultiSceneTable };
