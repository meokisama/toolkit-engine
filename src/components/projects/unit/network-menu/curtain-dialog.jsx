import React, { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { BaseControlDialog } from "@/components/shared/base-control-dialog";
import { CurtainCard } from "./cards/curtain-card";
import { DeleteCurtainDialog } from "./delete-curtain-popover";
import { curtainConfig } from "./configs/curtain-config";
import { CURTAIN_VALUE_LABELS } from "@/constants";

/**
 * Optimized Curtain Control Dialog
 */
export const CurtainDialog = React.memo(({ open, onOpenChange, unit }) => {
  // Memoized curtain control handler
  const handleCurtainControl = useCallback(async (curtainAddress, value) => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    try {
      const valueLabel = CURTAIN_VALUE_LABELS[value] || value;
      
      const success = await window.electronAPI.rcuController.setCurtain({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        curtainAddress,
        value,
      });

      if (success) {
        toast.success(`Curtain ${curtainAddress} ${valueLabel.toLowerCase()} command sent`);
      } else {
        throw new Error("Unit returned failure response");
      }
    } catch (error) {
      console.error("Failed to control curtain:", error);
      toast.error(`Failed to control curtain: ${error.message}`);
    }
  }, [unit]);

  // Memoized render card function
  const renderCard = useCallback(({ key, item, onDelete, loading }) => (
    <CurtainCard
      key={key}
      item={item}
      onControl={handleCurtainControl}
      onDelete={onDelete}
      loading={loading}
    />
  ), [handleCurtainControl]);

  // Memoized entity config
  const memoizedEntityConfig = useMemo(() => curtainConfig, []);

  return (
    <BaseControlDialog
      open={open}
      onOpenChange={onOpenChange}
      unit={unit}
      entityConfig={memoizedEntityConfig}
      renderCard={renderCard}
      DeleteComponent={DeleteCurtainDialog}
      emptyStateMessage="Load curtain information to see available curtains."
    />
  );
}, (prev, next) => {
  return (
    prev.open === next.open &&
    prev.unit?.ip_address === next.unit?.ip_address &&
    prev.unit?.id_can === next.unit?.id_can
  );
});

CurtainDialog.displayName = "CurtainDialog";
