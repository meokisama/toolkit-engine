import React from "react";
import { toast } from "sonner";
import { SendItemsDialog } from "@/components/shared/send-items-dialog";

export function SendSceneDialog({ open, onOpenChange, items = [] }) {
  const handleLoadSingleScene = async (scene) => {
    const sceneItemsData = await window.electronAPI.scene.getItemsWithDetails(
      scene.id
    );
    return sceneItemsData;
  };

  const handleValidateSingleScene = (sceneItems) => {
    if (!sceneItems || sceneItems.length === 0) {
      toast.error("Scene has no items to send");
      return false;
    }
    return true;
  };

  const handleSendSingleScene = async (scene, sceneItems, selectedUnits) => {
    let successCount = 0;
    let errorCount = 0;

    // Prepare scene items data for sending
    const sceneItemsData = sceneItems.map((item) => ({
      object_value: item.object_value || 0,
      item_address: item.item_address || "0",
      item_value: item.item_value || "0",
    }));

    // Send scene to all selected units
    for (const unit of selectedUnits) {
      try {
        console.log("Sending scene to unit:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          sceneIndex: scene.calculatedIndex ?? 0,
          sceneName: scene.name,
          sceneAddress: scene.address,
          sceneItems: sceneItemsData,
        });

        const response = await window.electronAPI.rcuController.setupScene(
          unit.ip_address,
          unit.id_can,
          scene.calculatedIndex ?? 0,
          scene.name,
          scene.address,
          sceneItemsData
        );

        console.log(`Scene sent successfully to ${unit.ip_address}:`, {
          responseLength: response?.msg?.length,
          success: response?.result?.success,
        });

        successCount++;
        toast.success(
          `Scene sent successfully to ${unit.type || "Unknown Unit"} (${
            unit.ip_address
          })`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `Failed to send scene to unit ${unit.ip_address}:`,
          error
        );
        toast.error(
          `Failed to send scene to ${unit.type || "Unknown Unit"} (${
            unit.ip_address
          }): ${error.message}`
        );
      }
    }

    if (successCount > 0) {
      toast.success(`Scene sent successfully to ${successCount} unit(s)`);
    }

    if (errorCount > 0) {
      throw new Error(`Failed to send to ${errorCount} unit(s)`);
    }
  };

  const handleSendBulkScenes = async (scenes, selectedUnits, onProgress) => {
    const totalOperations = scenes.length * selectedUnits.length;
    let completedOperations = 0;
    const operationResults = [];

    for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
      const currentSceneData = scenes[sceneIndex];
      onProgress(
        (completedOperations / totalOperations) * 100,
        `${currentSceneData.name} (${sceneIndex + 1}/${scenes.length})`
      );

      // Get scene items for this scene
      let sceneItems = [];
      try {
        sceneItems = await window.electronAPI.scene.getItemsWithDetails(
          currentSceneData.id
        );
      } catch (error) {
        console.error(
          `Failed to load items for scene ${currentSceneData.id}:`,
          error
        );
        // Skip scenes without items
        completedOperations += selectedUnits.length;
        onProgress((completedOperations / totalOperations) * 100, "");
        continue;
      }

      if (sceneItems.length === 0) {
        // Skip scenes without items
        completedOperations += selectedUnits.length;
        onProgress((completedOperations / totalOperations) * 100, "");
        continue;
      }

      // Prepare scene items data for sending
      const sceneItemsData = sceneItems.map((item) => ({
        object_value: item.object_value || 0,
        item_address: item.item_address || "0",
        item_value: item.item_value || "0",
      }));

      // Send scene to all selected units
      for (const unit of selectedUnits) {
        try {
          console.log("Sending scene to unit:", {
            unitIp: unit.ip_address,
            canId: unit.id_can,
            sceneIndex: sceneIndex,
            sceneName: currentSceneData.name,
            sceneAddress: currentSceneData.address,
            sceneItems: sceneItemsData,
          });

          const response = await window.electronAPI.rcuController.setupScene(
            unit.ip_address,
            unit.id_can,
            sceneIndex,
            currentSceneData.name,
            currentSceneData.address,
            sceneItemsData
          );

          operationResults.push({
            scene: currentSceneData.name,
            unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
            success: true,
            message: "Sent successfully",
          });

          console.log(`Scene sent successfully to ${unit.ip_address}:`, {
            responseLength: response?.msg?.length,
            success: response?.result?.success,
          });
        } catch (error) {
          console.error(
            `Failed to send scene ${currentSceneData.name} to unit ${unit.ip_address}:`,
            error
          );
          operationResults.push({
            scene: currentSceneData.name,
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
      itemType="scene"
      onLoadSingleItem={handleLoadSingleScene}
      onSendSingle={handleSendSingleScene}
      onSendBulk={handleSendBulkScenes}
      validateSingleItem={handleValidateSingleScene}
    />
  );
}
