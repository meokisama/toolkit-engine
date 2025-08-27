import React from "react";
import { toast } from "sonner";
import { SendItemsDialog } from "@/components/shared/send-items-dialog";
import { CONSTANTS } from "@/constants";

export function SendKnxDialog({ open, onOpenChange, items = [] }) {
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
    let rcuGroup = null;

    switch (knxData.type) {
      case 1: // Switch
      case 2: // Dimmer
        const lightingItems = await window.electronAPI.lighting.getAll(
          knxData.project_id
        );
        rcuGroup = lightingItems.find(
          (item) => item.id === knxData.rcu_group_id
        );
        break;
      case 3: // Curtain
        const curtainItems = await window.electronAPI.curtain.getAll(
          knxData.project_id
        );
        rcuGroup = curtainItems.find(
          (item) => item.id === knxData.rcu_group_id
        );
        break;
      case 4: // Scene
        const sceneItems = await window.electronAPI.scene.getAll(
          knxData.project_id
        );
        rcuGroup = sceneItems.find((item) => item.id === knxData.rcu_group_id);
        break;
      case 5: // Multi Scene
        const multiSceneItems = await window.electronAPI.multiScenes.getAll(
          knxData.project_id
        );
        rcuGroup = multiSceneItems.find(
          (item) => item.id === knxData.rcu_group_id
        );
        break;
      case 6: // Sequences
        const sequenceItems = await window.electronAPI.sequences.getAll(
          knxData.project_id
        );
        rcuGroup = sequenceItems.find(
          (item) => item.id === knxData.rcu_group_id
        );
        break;
      case 7: // AC Power
      case 8: // AC Mode
      case 9: // AC Fan Speed
      case 10: // AC Swing
      case 11: // AC Set Point
        const airconItems = await window.electronAPI.aircon.getAll(
          knxData.project_id
        );
        rcuGroup = airconItems.find((item) => item.id === knxData.rcu_group_id);
        break;
      default:
        const defaultLightingItems = await window.electronAPI.lighting.getAll(
          knxData.project_id
        );
        rcuGroup = defaultLightingItems.find(
          (item) => item.id === knxData.rcu_group_id
        );
        break;
    }

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

        const success = await window.electronAPI.rcuController.setKnxConfig(
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
          toast.success(
            `KNX config sent successfully to ${unit.type || "Unknown Unit"} (${
              unit.ip_address
            })`
          );
        } else {
          throw new Error("Unit returned failure response");
        }
      } catch (error) {
        errorCount++;
        console.error(
          `Failed to send KNX config to unit ${unit.ip_address}:`,
          error
        );
        toast.error(
          `Failed to send KNX config to ${unit.type || "Unknown Unit"} (${
            unit.ip_address
          }): ${error.message}`
        );
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
    const totalOperations = knxConfigs.length * selectedUnits.length;
    let completedOperations = 0;
    const operationResults = [];

    // Get all project items for RCU group lookup
    const projectId = knxConfigs[0].project_id;
    const lightingItems = await window.electronAPI.lighting.getAll(projectId);
    const curtainItems = await window.electronAPI.curtain.getAll(projectId);
    const sceneItems = await window.electronAPI.scene.getAll(projectId);
    const multiSceneItems =
      await window.electronAPI.multiScenes.getAll(projectId);
    const sequenceItems = await window.electronAPI.sequences.getAll(projectId);
    const airconItems = await window.electronAPI.aircon.getAll(projectId);

    for (let i = 0; i < knxConfigs.length; i++) {
      const currentKnx = knxConfigs[i];
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
      let rcuGroup = null;

      switch (knxData.type) {
        case 1: // Switch
        case 2: // Dimmer
          rcuGroup = lightingItems.find(
            (item) => item.id === knxData.rcu_group_id
          );
          break;
        case 3: // Curtain
          rcuGroup = curtainItems.find(
            (item) => item.id === knxData.rcu_group_id
          );
          break;
        case 4: // Scene
          rcuGroup = sceneItems.find(
            (item) => item.id === knxData.rcu_group_id
          );
          break;
        case 5: // Multi Scene
          rcuGroup = multiSceneItems.find(
            (item) => item.id === knxData.rcu_group_id
          );
          break;
        case 6: // Sequences
          rcuGroup = sequenceItems.find(
            (item) => item.id === knxData.rcu_group_id
          );
          break;
        case 7: // AC Power
        case 8: // AC Mode
        case 9: // AC Fan Speed
        case 10: // AC Swing
        case 11: // AC Set Point
          rcuGroup = airconItems.find(
            (item) => item.id === knxData.rcu_group_id
          );
          break;
        default:
          rcuGroup = lightingItems.find(
            (item) => item.id === knxData.rcu_group_id
          );
          break;
      }

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

          const success = await window.electronAPI.rcuController.setKnxConfig(
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
          console.error(
            `Failed to send KNX config ${currentKnx.name} to unit ${unit.ip_address}:`,
            error
          );
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
    />
  );
}
