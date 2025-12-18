import React from "react";
import { toast } from "sonner";
import { SendItemsDialog } from "@/components/shared/send-items-dialog";
import { CONSTANTS } from "@/constants";
import { useProjectDetail } from "@/contexts/project-detail-context";

export function SendKnxDialog({ open, onOpenChange, items = [] }) {
  const { projectItems } = useProjectDetail();
  const handleLoadSingleKnx = async (knx) => {
    // For KNX, we just return the knx data directly since it doesn't have sub-items
    return knx;
  };

  const handleValidateSingleKnx = (knxData) => {
    if (!knxData) {
      toast.error("KNX configuration is invalid");
      return false;
    }

    // Validate required fields
    if (knxData.address === null || knxData.address === undefined) {
      toast.error("KNX address is required");
      return false;
    }

    if (knxData.type === null || knxData.type === undefined) {
      toast.error("KNX type is required");
      return false;
    }

    if (!knxData.rcu_group_id) {
      toast.error("RCU group is required");
      return false;
    }

    return true;
  };

  const handleSendSingleKnx = async (knx, knxData, selectedUnits) => {
    // knxData is already loaded and passed from the parent component
    if (!handleValidateSingleKnx(knxData)) {
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Get RCU group value from appropriate items based on KNX type
    const typeConfig = CONSTANTS.KNX.KNX_OUTPUT_TYPES.find((t) => t.value === knxData.type);
    const resource = typeConfig?.resource || "lighting";

    // Map resource to API method
    const apiMethodMap = {
      lighting: "lighting",
      curtain: "curtain",
      scene: "scene",
      multi_scenes: "multiScenes",
      sequences: "sequences",
      aircon: "aircon",
    };

    const items = await window.electronAPI[apiMethodMap[resource]].getAll(knxData.project_id);
    const rcuGroup = items.find((item) => item.id === knxData.rcu_group_id);

    if (!rcuGroup) {
      toast.error("RCU group not found");
      return;
    }

    // Send KNX config to all selected units
    for (const unit of selectedUnits) {
      try {
        console.log("Sending KNX config to unit:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          address: knxData.address,
          type: knxData.type,
          factor: knxData.factor || 1,
          feedback: knxData.feedback || 0,
          rcuGroup: rcuGroup.address,
          knxSwitchGroup: knxData.knx_switch_group || "",
          knxDimmingGroup: knxData.knx_dimming_group || "",
          knxValueGroup: knxData.knx_value_group || "",
        });

        const success = await window.electronAPI.knxController.setKnxConfig(
          unit.ip_address,
          unit.id_can,
          {
            address: knxData.address,
            type: knxData.type,
            factor: knxData.factor || 1,
            feedback: knxData.feedback || 0,
            rcuGroup: rcuGroup.address,
            knxSwitchGroup: knxData.knx_switch_group || "",
            knxDimmingGroup: knxData.knx_dimming_group || "",
            knxValueGroup: knxData.knx_value_group || "",
          },
          unit.type || "Unknown Unit" // Pass unit type for logging
        );

        if (success) {
          successCount++;
          toast.success(`KNX config sent successfully to ${unit.type || "Unknown Unit"} (${unit.ip_address})`);
        } else {
          throw new Error("Unit returned failure response");
        }
      } catch (error) {
        errorCount++;
        console.error(`Failed to send KNX config to unit ${unit.ip_address}:`, error);
        toast.error(`Failed to send KNX config to ${unit.type || "Unknown Unit"} (${unit.ip_address}): ${error.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`KNX config sent successfully to ${successCount} unit(s)`);
    }

    if (errorCount > 0) {
      throw new Error(`Failed to send to ${errorCount} unit(s)`);
    }
  };

  const handleSendBulkKnx = async (knxConfigs, selectedUnits, onProgress) => {
    // Add delete operations to total count (one delete per unit)
    const totalOperations = knxConfigs.length * selectedUnits.length + selectedUnits.length;
    let completedOperations = 0;
    const operationResults = [];

    // First, delete all existing KNX configs from selected units
    onProgress(0, "Deleting existing KNX configs...");
    for (const unit of selectedUnits) {
      try {
        console.log("Deleting all KNX configs from unit:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });

        await window.electronAPI.knxController.deleteAllKnxConfigs(unit.ip_address, unit.id_can);

        operationResults.push({
          scene: "Delete All KNX Configs",
          unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
          success: true,
          message: "Existing KNX configs deleted successfully",
        });

        completedOperations++;
        onProgress((completedOperations / totalOperations) * 100, "Deleting existing KNX configs...");
      } catch (error) {
        console.error(`Failed to delete existing KNX configs from unit ${unit.ip_address}:`, error);
        operationResults.push({
          scene: "Delete All KNX Configs",
          unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
          success: false,
          message: error.message || "Failed to delete existing KNX configs",
        });

        completedOperations++;
        onProgress((completedOperations / totalOperations) * 100, "Deleting existing KNX configs...");
      }
    }

    // Get all project items for RCU group lookup
    const projectId = knxConfigs[0].project_id;
    const lightingItems = await window.electronAPI.lighting.getAll(projectId);
    const curtainItems = await window.electronAPI.curtain.getAll(projectId);
    const sceneItems = await window.electronAPI.scene.getAll(projectId);
    const multiSceneItems = await window.electronAPI.multiScenes.getAll(projectId);
    const sequenceItems = await window.electronAPI.sequences.getAll(projectId);
    const airconItems = await window.electronAPI.aircon.getAll(projectId);

    for (let i = 0; i < knxConfigs.length; i++) {
      const currentKnx = knxConfigs[i];
      onProgress((completedOperations / totalOperations) * 100, `Sending ${currentKnx.name} (${i + 1}/${knxConfigs.length})`);
      const knxData = await handleLoadSingleKnx(currentKnx);

      if (!handleValidateSingleKnx(knxData)) {
        // Skip invalid KNX configs and mark as failed for all units
        for (const unit of selectedUnits) {
          operationResults.push({
            scene: currentKnx.name,
            unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
            success: false,
            message: "Invalid KNX configuration",
          });
          completedOperations++;
          onProgress((completedOperations / totalOperations) * 100, "");
        }
        continue;
      }

      // Get RCU group value based on KNX type
      const typeConfig = CONSTANTS.KNX.KNX_OUTPUT_TYPES.find((t) => t.value === knxData.type);
      const resource = typeConfig?.resource || "lighting";

      // Map resource to items
      const itemsMap = {
        lighting: lightingItems,
        curtain: curtainItems,
        scene: sceneItems,
        multi_scenes: multiSceneItems,
        sequences: sequenceItems,
        aircon: airconItems,
      };

      const rcuGroup = itemsMap[resource].find((item) => item.id === knxData.rcu_group_id);

      if (!rcuGroup) {
        // Skip if RCU group not found
        for (const unit of selectedUnits) {
          operationResults.push({
            scene: currentKnx.name,
            unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
            success: false,
            message: "RCU group not found",
          });
          completedOperations++;
          onProgress((completedOperations / totalOperations) * 100, "");
        }
        continue;
      }

      // Send KNX config to all selected units
      for (const unit of selectedUnits) {
        try {
          console.log("Sending KNX config to unit:", {
            unitIp: unit.ip_address,
            canId: unit.id_can,
            address: knxData.address,
            type: knxData.type,
            factor: knxData.factor || 1,
            feedback: knxData.feedback || 0,
            rcuGroup: rcuGroup.address,
            knxSwitchGroup: knxData.knx_switch_group || "",
            knxDimmingGroup: knxData.knx_dimming_group || "",
            knxValueGroup: knxData.knx_value_group || "",
          });

          const success = await window.electronAPI.knxController.setKnxConfig(
            unit.ip_address,
            unit.id_can,
            {
              address: knxData.address,
              type: knxData.type,
              factor: knxData.factor || 1,
              feedback: knxData.feedback || 0,
              rcuGroup: rcuGroup.address,
              knxSwitchGroup: knxData.knx_switch_group || "",
              knxDimmingGroup: knxData.knx_dimming_group || "",
              knxValueGroup: knxData.knx_value_group || "",
            },
            unit.type || "Unknown Unit" // Pass unit type for logging
          );

          if (success) {
            operationResults.push({
              scene: currentKnx.name,
              unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
              success: true,
              message: "Sent successfully",
            });
          } else {
            throw new Error("Unit returned failure response");
          }
        } catch (error) {
          console.error(`Failed to send KNX config ${currentKnx.name} to unit ${unit.ip_address}:`, error);
          operationResults.push({
            scene: currentKnx.name,
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
      itemType="KNX config"
      onLoadSingleItem={handleLoadSingleKnx}
      onSendSingle={handleSendSingleKnx}
      onSendBulk={handleSendBulkKnx}
      validateSingleItem={handleValidateSingleKnx}
      projectItems={projectItems}
    />
  );
}
