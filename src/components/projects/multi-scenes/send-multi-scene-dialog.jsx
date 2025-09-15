import React from "react";
import { toast } from "sonner";
import { SendItemsDialog } from "@/components/shared/send-items-dialog";

export function SendMultiSceneDialog({ open, onOpenChange, items = [] }) {
  const handleLoadSingleMultiScene = async (multiScene) => {
    const multiSceneData = await window.electronAPI.multiScenes.getScenes(
      multiScene.id
    );
    return multiSceneData;
  };

  const handleValidateSingleMultiScene = (multiSceneData) => {
    if (!multiSceneData || multiSceneData.length === 0) {
      toast.error("Multi-scene has no scenes to send");
      return false;
    }
    return true;
  };

  const handleSendSingleMultiScene = async (
    multiScene,
    multiSceneData,
    selectedUnits
  ) => {
    let successCount = 0;
    let errorCount = 0;

    // Get unique scene addresses from the multi-scene data, preserving order
    const sceneAddresses = [];
    const seenAddresses = new Set();
    for (const scene of multiSceneData) {
      if (!seenAddresses.has(scene.scene_address)) {
        sceneAddresses.push(scene.scene_address);
        seenAddresses.add(scene.scene_address);
      }
    }

    // Send multi-scene to all selected units
    for (const unit of selectedUnits) {
      try {
        console.log("Sending multi-scene to unit:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          multiSceneIndex: multiScene.calculatedIndex ?? 0,
          multiSceneName: multiScene.name,
          multiSceneAddress: multiScene.address,
          multiSceneType: multiScene.type,
          sceneAddresses: sceneAddresses,
        });

        const response = await window.electronAPI.rcuController.setupMultiScene(
          unit.ip_address,
          unit.id_can,
          {
            multiSceneIndex: multiScene.calculatedIndex ?? 0,
            multiSceneName: multiScene.name,
            multiSceneAddress: multiScene.address,
            multiSceneType: multiScene.type,
            sceneAddresses: sceneAddresses,
          }
        );

        console.log(`Multi-scene sent successfully to ${unit.ip_address}:`, {
          responseLength: response?.msg?.length,
          success: response?.result?.success,
        });

        successCount++;
        toast.success(
          `Multi-scene sent successfully to ${unit.type || "Unknown Unit"} (${unit.ip_address
          })`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `Failed to send multi-scene to unit ${unit.ip_address}:`,
          error
        );
        toast.error(
          `Failed to send multi-scene to ${unit.type || "Unknown Unit"} (${unit.ip_address
          }): ${error.message}`
        );
      }
    }

    if (successCount > 0) {
      toast.success(`Multi-scene sent successfully to ${successCount} unit(s)`);
    }

    if (errorCount > 0) {
      throw new Error(`Failed to send to ${errorCount} unit(s)`);
    }
  };

  const handleSendBulkMultiScenes = async (
    multiScenes,
    selectedUnits,
    onProgress
  ) => {
    // Add delete operations to total count (one delete per unit)
    const totalOperations = multiScenes.length * selectedUnits.length + selectedUnits.length;
    let completedOperations = 0;
    const operationResults = [];

    // First, delete all existing multi-scenes from selected units
    onProgress(0, "Deleting existing multi-scenes...");
    for (const unit of selectedUnits) {
      try {
        console.log("Deleting all multi-scenes from unit:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });

        await window.electronAPI.rcuController.deleteAllMultiScenes(
          unit.ip_address,
          unit.id_can
        );

        operationResults.push({
          scene: "Delete All Multi-Scenes",
          unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
          success: true,
          message: "Existing multi-scenes deleted successfully",
        });

        completedOperations++;
        onProgress((completedOperations / totalOperations) * 100, "Deleting existing multi-scenes...");
      } catch (error) {
        console.error(
          `Failed to delete existing multi-scenes from unit ${unit.ip_address}:`,
          error
        );
        operationResults.push({
          scene: "Delete All Multi-Scenes",
          unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
          success: false,
          message: error.message || "Failed to delete existing multi-scenes",
        });

        completedOperations++;
        onProgress((completedOperations / totalOperations) * 100, "Deleting existing multi-scenes...");
      }
    }

    for (let i = 0; i < multiScenes.length; i++) {
      const currentMultiScene = multiScenes[i];
      const multiSceneIndex = i; // Use array index as multi-scene index

      onProgress(
        (completedOperations / totalOperations) * 100,
        `Sending ${currentMultiScene.name} (${i + 1}/${multiScenes.length})`
      );

      // Load multi-scene data
      let multiSceneData;
      try {
        multiSceneData = await window.electronAPI.multiScenes.getScenes(
          currentMultiScene.id
        );
      } catch (error) {
        console.error(
          `Failed to load multi-scene data for ${currentMultiScene.name}:`,
          error
        );
        // Add error for all units for this multi-scene
        for (const unit of selectedUnits) {
          operationResults.push({
            scene: currentMultiScene.name,
            unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
            success: false,
            message: "Failed to load multi-scene data",
          });
          completedOperations++;
          onProgress((completedOperations / totalOperations) * 100, "");
        }
        continue;
      }

      // Validate multi-scene data
      if (!multiSceneData || multiSceneData.length === 0) {
        console.error(`Multi-scene ${currentMultiScene.name} has no scenes`);
        // Add error for all units for this multi-scene
        for (const unit of selectedUnits) {
          operationResults.push({
            scene: currentMultiScene.name,
            unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
            success: false,
            message: "Multi-scene has no scenes",
          });
          completedOperations++;
          onProgress((completedOperations / totalOperations) * 100, "");
        }
        continue;
      }

      // Get unique scene addresses, preserving order
      const sceneAddresses = [];
      const seenAddresses = new Set();
      for (const scene of multiSceneData) {
        if (!seenAddresses.has(scene.scene_address)) {
          sceneAddresses.push(scene.scene_address);
          seenAddresses.add(scene.scene_address);
        }
      }

      // Send multi-scene to all selected units
      for (const unit of selectedUnits) {
        try {
          console.log("Sending multi-scene to unit:", {
            unitIp: unit.ip_address,
            canId: unit.id_can,
            multiSceneIndex: multiSceneIndex,
            multiSceneName: currentMultiScene.name,
            multiSceneAddress: currentMultiScene.address,
            multiSceneType: currentMultiScene.type,
            sceneAddresses: sceneAddresses,
          });

          const response =
            await window.electronAPI.rcuController.setupMultiScene(
              unit.ip_address,
              unit.id_can,
              {
                multiSceneIndex: multiSceneIndex,
                multiSceneName: currentMultiScene.name,
                multiSceneAddress: currentMultiScene.address,
                multiSceneType: currentMultiScene.type,
                sceneAddresses: sceneAddresses,
              }
            );

          operationResults.push({
            scene: currentMultiScene.name,
            unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
            success: true,
            message: "Sent successfully",
          });

          console.log(`Multi-scene sent successfully to ${unit.ip_address}:`, {
            responseLength: response?.msg?.length,
            success: response?.result?.success,
          });
        } catch (error) {
          console.error(
            `Failed to send multi-scene ${currentMultiScene.name} to unit ${unit.ip_address}:`,
            error
          );
          operationResults.push({
            scene: currentMultiScene.name,
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
      itemType="multi-scene"
      onLoadSingleItem={handleLoadSingleMultiScene}
      onSendSingle={handleSendSingleMultiScene}
      onSendBulk={handleSendBulkMultiScenes}
      validateSingleItem={handleValidateSingleMultiScene}
    />
  );
}
