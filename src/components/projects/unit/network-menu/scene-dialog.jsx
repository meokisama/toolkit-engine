import React, { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { BaseControlDialog } from "@/components/shared/base-control-dialog";
import { SceneCard } from "./cards/scene-card";
import { DeleteSceneDialog } from "./delete-scene-popover";
import { sceneConfig } from "./configs/scene-config";

/**
 * Optimized Scene Control Dialog
 */
export const SceneDialog = React.memo(({ open, onOpenChange, unit }) => {
  // Memoized scene trigger handler
  const handleTriggerScene = useCallback(async (sceneIndex, sceneAddress) => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    try {
      await window.electronAPI.rcuController.triggerScene({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        sceneIndex,
        sceneAddress,
      });

      toast.success(`Scene ${sceneIndex} triggered successfully`);
    } catch (error) {
      console.error("Failed to trigger scene:", error);
      toast.error(`Failed to trigger scene: ${error.message}`);
    }
  }, [unit]);

  // Memoized render card function
  const renderCard = useCallback(({ key, item, onDelete, loading }) => (
    <SceneCard
      key={key}
      item={item}
      onTrigger={handleTriggerScene}
      onDelete={onDelete}
      loading={loading}
    />
  ), [handleTriggerScene]);

  // Memoized entity config
  const memoizedEntityConfig = useMemo(() => sceneConfig, []);

  return (
    <BaseControlDialog
      open={open}
      onOpenChange={onOpenChange}
      unit={unit}
      entityConfig={memoizedEntityConfig}
      renderCard={renderCard}
      DeleteComponent={DeleteSceneDialog}
      emptyStateMessage="Load scene information to see available scenes."
    />
  );
}, (prev, next) => {
  return (
    prev.open === next.open &&
    prev.unit?.ip_address === next.unit?.ip_address &&
    prev.unit?.id_can === next.unit?.id_can
  );
});

SceneDialog.displayName = "SceneDialog";
