import React from "react";
import { toast } from "sonner";
import { SendItemsDialog } from "@/components/shared/send-items-dialog";
import { useProjectDetail } from "@/contexts/project-detail-context";
import log from "electron-log/renderer";

export function SendDmxDialog({ open, onOpenChange, items = [] }) {
  const { projectItems } = useProjectDetail();

  // Get total DMX device count from database
  const totalDmxCount = projectItems?.dmx?.length || 0;

  const handleLoadSingleDmx = async (dmx) => {
    // For DMX, we just return the dmx data directly
    return dmx;
  };

  const handleValidateSingleDmx = (dmxData) => {
    if (!dmxData) {
      toast.error("DMX configuration is invalid");
      return false;
    }

    // Validate required fields
    if (dmxData.address === null || dmxData.address === undefined) {
      toast.error("DMX address is required");
      return false;
    }

    return true;
  };

  const handleSendSingleDmx = async (dmx, dmxData, selectedUnits) => {
    // dmxData is already loaded and passed from the parent component
    if (!handleValidateSingleDmx(dmxData)) {
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Send DMX config to all selected units
    for (const unit of selectedUnits) {
      try {
        const success = await window.electronAPI.dmxController.setDmxColor(
          unit.ip_address,
          unit.id_can,
          dmxData, // Single DMX item
          totalDmxCount // Total DMX devices in database
        );

        if (success) {
          successCount++;
          toast.success(`DMX config sent successfully to ${unit.type || "Unknown Unit"} (${unit.ip_address})`);
        } else {
          throw new Error("Unit returned failure response");
        }
      } catch (error) {
        errorCount++;
        log.error(`Failed to send DMX config to unit ${unit.ip_address}:`, error);
        toast.error(`Failed to send DMX config to ${unit.type || "Unknown Unit"} (${unit.ip_address}): ${error.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`DMX config sent successfully to ${successCount} unit(s)`);
    }

    if (errorCount > 0) {
      throw new Error(`Failed to send to ${errorCount} unit(s)`);
    }
  };

  const handleSendBulkDmx = async (dmxConfigs, selectedUnits, onProgress) => {
    const totalOperations = dmxConfigs.length * selectedUnits.length;
    let completedOperations = 0;
    const operationResults = [];

    // Batch DMX configs in groups of 15
    const BATCH_SIZE = 15;
    const batches = [];
    for (let i = 0; i < dmxConfigs.length; i += BATCH_SIZE) {
      batches.push(dmxConfigs.slice(i, i + BATCH_SIZE));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchName = `Batch ${batchIndex + 1}/${batches.length} (${batch.length} devices)`;

      onProgress((completedOperations / totalOperations) * 100, `Sending ${batchName} (${completedOperations}/${totalOperations})`);

      // Validate all items in batch
      const validDmxConfigs = [];
      for (const dmx of batch) {
        const dmxData = await handleLoadSingleDmx(dmx);
        if (handleValidateSingleDmx(dmxData)) {
          validDmxConfigs.push(dmxData);
        } else {
          // Mark as failed for all units
          for (const unit of selectedUnits) {
            operationResults.push({
              scene: dmx.name,
              unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
              success: false,
              message: "Invalid DMX configuration",
            });
            completedOperations++;
          }
        }
      }

      // Send batch to all selected units
      for (const unit of selectedUnits) {
        if (validDmxConfigs.length === 0) {
          // Skip if no valid configs in batch
          continue;
        }

        try {
          const success = await window.electronAPI.dmxController.setDmxColor(
            unit.ip_address,
            unit.id_can,
            validDmxConfigs, // Array of DMX items (max 15)
            totalDmxCount // Total DMX devices in database
          );

          if (success) {
            // Mark all items in batch as successful for this unit
            for (const dmx of validDmxConfigs) {
              operationResults.push({
                scene: dmx.name,
                unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
                success: true,
                message: "Sent successfully",
              });
              completedOperations++;
            }
          } else {
            throw new Error("Unit returned failure response");
          }
        } catch (error) {
          log.error(`Failed to send DMX batch to unit ${unit.ip_address}:`, error);

          // Mark all items in batch as failed for this unit
          for (const dmx of validDmxConfigs) {
            operationResults.push({
              scene: dmx.name,
              unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
              success: false,
              message: error.message || "Failed to send",
            });
            completedOperations++;
          }
        }

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
      itemType="DMX device"
      onLoadSingleItem={handleLoadSingleDmx}
      onSendSingle={handleSendSingleDmx}
      onSendBulk={handleSendBulkDmx}
      validateSingleItem={handleValidateSingleDmx}
      projectItems={projectItems}
    />
  );
}
