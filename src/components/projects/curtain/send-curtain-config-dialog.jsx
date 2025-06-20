import React from "react";
import { toast } from "sonner";
import { SendItemsDialog } from "@/components/shared/send-items-dialog";
import { CURTAIN_TYPES } from "@/constants";

export function SendCurtainConfigDialog({ open, onOpenChange, items = [] }) {
  const handleLoadSingleCurtain = async (curtain) => {
    // For curtain config, we don't need to load additional data
    // All required data is already in the curtain item
    return curtain;
  };

  const handleValidateSingleCurtain = (curtain) => {
    if (!curtain.address) {
      toast.error("Curtain address is required");
      return false;
    }
    if (!curtain.curtain_type || curtain.curtain_value === 0) {
      toast.error("Curtain type must be selected");
      return false;
    }
    if (!curtain.open_group || !curtain.close_group) {
      toast.error("Open and Close groups are required");
      return false;
    }
    return true;
  };

  const handleSendSingleCurtain = async (
    curtain,
    curtainData,
    selectedUnits
  ) => {
    let successCount = 0;
    let errorCount = 0;

    // Get curtain type value from constants
    const curtainType = CURTAIN_TYPES.find(
      (type) => type.name === curtain.curtain_type
    );
    const curtainTypeValue = curtainType ? curtainType.value : 0;

    // Send curtain config to all selected units
    for (const unit of selectedUnits) {
      try {
        console.log("Sending curtain config to unit:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          index: 0, // Default index
          address: parseInt(curtain.address),
          curtainType: curtainTypeValue,
          pausePeriod: curtain.pause_period || 0,
          transitionPeriod: curtain.transition_period || 0,
          openGroup: parseInt(curtain.open_group),
          closeGroup: parseInt(curtain.close_group),
          stopGroup: parseInt(curtain.stop_group || 0),
        });

        const success = await window.electronAPI.rcuController.setCurtainConfig(
          {
            unitIp: unit.ip_address,
            canId: unit.id_can,
            index: 0, // Default index
            address: parseInt(curtain.address),
            curtainType: curtainTypeValue,
            pausePeriod: curtain.pause_period || 0,
            transitionPeriod: curtain.transition_period || 0,
            openGroup: parseInt(curtain.open_group),
            closeGroup: parseInt(curtain.close_group),
            stopGroup: parseInt(curtain.stop_group || 0),
          }
        );

        if (success) {
          successCount++;
          toast.success(
            `Curtain config sent successfully to ${
              unit.type || "Unknown Unit"
            } (${unit.ip_address})`
          );
        } else {
          throw new Error("Unit returned failure response");
        }
      } catch (error) {
        errorCount++;
        console.error(
          `Failed to send curtain config to unit ${unit.ip_address}:`,
          error
        );
        toast.error(
          `Failed to send curtain config to ${unit.type || "Unknown Unit"} (${
            unit.ip_address
          }): ${error.message}`
        );
      }
    }

    if (successCount > 0) {
      toast.success(
        `Curtain config sent successfully to ${successCount} unit(s)`
      );
    }

    if (errorCount > 0) {
      throw new Error(`Failed to send to ${errorCount} unit(s)`);
    }
  };

  const handleSendBulkCurtains = async (
    curtains,
    selectedUnits,
    onProgress
  ) => {
    const totalOperations = curtains.length * selectedUnits.length;
    let completedOperations = 0;
    const operationResults = [];

    for (let curtainIndex = 0; curtainIndex < curtains.length; curtainIndex++) {
      const currentCurtain = curtains[curtainIndex];
      onProgress(
        (completedOperations / totalOperations) * 100,
        `${currentCurtain.name} (${curtainIndex + 1}/${curtains.length})`
      );

      // Validate curtain config
      if (!handleValidateSingleCurtain(currentCurtain)) {
        // Skip invalid curtains
        completedOperations += selectedUnits.length;
        onProgress((completedOperations / totalOperations) * 100, "");
        continue;
      }

      // Get curtain type value from constants
      const curtainType = CURTAIN_TYPES.find(
        (type) => type.name === currentCurtain.curtain_type
      );
      const curtainTypeValue = curtainType ? curtainType.value : 0;

      // Send curtain config to all selected units
      for (const unit of selectedUnits) {
        try {
          console.log("Sending curtain config to unit:", {
            unitIp: unit.ip_address,
            canId: unit.id_can,
            index: curtainIndex,
            address: parseInt(currentCurtain.address),
            curtainType: curtainTypeValue,
            pausePeriod: currentCurtain.pause_period || 0,
            transitionPeriod: currentCurtain.transition_period || 0,
            openGroup: parseInt(currentCurtain.open_group),
            closeGroup: parseInt(currentCurtain.close_group),
            stopGroup: parseInt(currentCurtain.stop_group || 0),
          });

          const success =
            await window.electronAPI.rcuController.setCurtainConfig({
              unitIp: unit.ip_address,
              canId: unit.id_can,
              index: curtainIndex,
              address: parseInt(currentCurtain.address),
              curtainType: curtainTypeValue,
              pausePeriod: currentCurtain.pause_period || 0,
              transitionPeriod: currentCurtain.transition_period || 0,
              openGroup: parseInt(currentCurtain.open_group),
              closeGroup: parseInt(currentCurtain.close_group),
              stopGroup: parseInt(currentCurtain.stop_group || 0),
            });

          if (success) {
            operationResults.push({
              scene: currentCurtain.name,
              unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
              success: true,
              message: "Sent successfully",
            });
          } else {
            throw new Error("Unit returned failure response");
          }
        } catch (error) {
          console.error(
            `Failed to send curtain config ${currentCurtain.name} to unit ${unit.ip_address}:`,
            error
          );
          operationResults.push({
            scene: currentCurtain.name,
            unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
            success: false,
            message: error.message || "Failed to send",
          });
        }

        completedOperations++;
        onProgress((completedOperations / totalOperations) * 100, "");
      }
    }

    return operationResults;
  };

  return (
    <SendItemsDialog
      open={open}
      onOpenChange={onOpenChange}
      items={items}
      itemType="curtain config"
      onLoadSingleItem={handleLoadSingleCurtain}
      onSendSingle={handleSendSingleCurtain}
      onSendBulk={handleSendBulkCurtains}
      validateSingleItem={handleValidateSingleCurtain}
    />
  );
}
