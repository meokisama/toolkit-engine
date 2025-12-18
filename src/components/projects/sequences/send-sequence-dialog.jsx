import React from "react";
import { toast } from "sonner";
import { SendItemsDialog } from "@/components/shared/send-items-dialog";
import { useProjectDetail } from "@/contexts/project-detail-context";

export function SendSequenceDialog({ open, onOpenChange, items = [] }) {
  const { projectItems } = useProjectDetail();
  const handleLoadSingleSequence = async (sequence) => {
    const sequenceData = await window.electronAPI.sequences.getMultiScenes(sequence.id);
    return sequenceData;
  };

  const handleValidateSingleSequence = (sequenceData) => {
    if (!sequenceData || sequenceData.length === 0) {
      toast.error("Sequence has no multi-scenes to send");
      return false;
    }
    return true;
  };

  const handleSendSingleSequence = async (sequence, sequenceData, selectedUnits) => {
    let successCount = 0;
    let errorCount = 0;

    // Get multi-scene addresses from the sequence data, preserving order
    const multiSceneAddresses = sequenceData.sort((a, b) => a.multi_scene_order - b.multi_scene_order).map((ms) => ms.multi_scene_address);

    // Send sequence to all selected units
    for (const unit of selectedUnits) {
      try {
        console.log("Sending sequence to unit:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          sequenceIndex: sequence.calculatedIndex ?? 0,
          sequenceName: sequence.name,
          sequenceAddress: sequence.address,
          multiSceneAddresses: multiSceneAddresses,
        });

        const response = await window.electronAPI.sequenceController.setupSequence(unit.ip_address, unit.id_can, {
          sequenceIndex: sequence.calculatedIndex ?? 0,
          sequenceAddress: sequence.address,
          multiSceneAddresses: multiSceneAddresses,
        });

        console.log(`Sequence sent successfully to ${unit.ip_address}:`, {
          responseLength: response?.msg?.length,
          success: response?.result?.success,
        });

        successCount++;
        toast.success(`Sequence sent successfully to ${unit.type || "Unknown Unit"} (${unit.ip_address})`);
      } catch (error) {
        errorCount++;
        console.error(`Failed to send sequence to unit ${unit.ip_address}:`, error);
        toast.error(`Failed to send sequence to ${unit.type || "Unknown Unit"} (${unit.ip_address}): ${error.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Sequence sent successfully to ${successCount} unit(s)`);
    }

    if (errorCount > 0) {
      throw new Error(`Failed to send to ${errorCount} unit(s)`);
    }
  };

  const handleSendBulkSequences = async (sequences, selectedUnits, onProgress) => {
    // Add delete operations to total count (one delete per unit)
    const totalOperations = sequences.length * selectedUnits.length + selectedUnits.length;
    let completedOperations = 0;
    const operationResults = [];

    // First, delete all existing sequences from selected units
    onProgress(0, "Deleting existing sequences...");
    for (const unit of selectedUnits) {
      try {
        console.log("Deleting all sequences from unit:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });

        await window.electronAPI.sequenceController.deleteAllSequences(unit.ip_address, unit.id_can);

        operationResults.push({
          scene: "Delete All Sequences",
          unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
          success: true,
          message: "Existing sequences deleted successfully",
        });

        completedOperations++;
        onProgress((completedOperations / totalOperations) * 100, "Deleting existing sequences...");
      } catch (error) {
        console.error(`Failed to delete existing sequences from unit ${unit.ip_address}:`, error);
        operationResults.push({
          scene: "Delete All Sequences",
          unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
          success: false,
          message: error.message || "Failed to delete existing sequences",
        });

        completedOperations++;
        onProgress((completedOperations / totalOperations) * 100, "Deleting existing sequences...");
      }
    }

    for (let sequenceIndex = 0; sequenceIndex < sequences.length; sequenceIndex++) {
      const currentSequence = sequences[sequenceIndex];
      onProgress((completedOperations / totalOperations) * 100, `Sending ${currentSequence.name} (${sequenceIndex + 1}/${sequences.length})`);

      // Get sequence data for this sequence
      let sequenceData = [];
      try {
        sequenceData = await handleLoadSingleSequence(currentSequence);
      } catch (error) {
        console.error(`Failed to load data for sequence ${currentSequence.id}:`, error);
        // Skip sequences without data
        completedOperations += selectedUnits.length;
        onProgress((completedOperations / totalOperations) * 100, "");
        continue;
      }

      if (!sequenceData || sequenceData.length === 0) {
        // Skip sequences without multi-scenes
        completedOperations += selectedUnits.length;
        onProgress((completedOperations / totalOperations) * 100, "");
        continue;
      }

      // Get multi-scene addresses from the sequence data, preserving order
      const multiSceneAddresses = sequenceData.sort((a, b) => a.multi_scene_order - b.multi_scene_order).map((ms) => ms.multi_scene_address);

      // Send sequence to each selected unit
      for (const unit of selectedUnits) {
        try {
          console.log("Sending sequence to unit:", {
            unitIp: unit.ip_address,
            canId: unit.id_can,
            sequenceIndex: currentSequence.calculatedIndex ?? 0,
            sequenceName: currentSequence.name,
            sequenceAddress: currentSequence.address,
            multiSceneAddresses: multiSceneAddresses,
          });

          const response = await window.electronAPI.sequenceController.setupSequence(unit.ip_address, unit.id_can, {
            sequenceIndex: currentSequence.calculatedIndex ?? 0,
            sequenceAddress: currentSequence.address,
            multiSceneAddresses: multiSceneAddresses,
          });

          console.log(`Sequence sent successfully to ${unit.ip_address}:`, {
            responseLength: response?.msg?.length,
            success: response?.result?.success,
          });

          operationResults.push({
            sequence: currentSequence.name,
            unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
            success: true,
            message: "Sent successfully",
          });
        } catch (error) {
          console.error(`Failed to send sequence to unit ${unit.ip_address}:`, error);
          operationResults.push({
            sequence: currentSequence.name,
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
      itemType="sequence"
      onLoadSingleItem={handleLoadSingleSequence}
      onSendSingle={handleSendSingleSequence}
      onSendBulk={handleSendBulkSequences}
      validateSingleItem={handleValidateSingleSequence}
      projectItems={projectItems}
    />
  );
}
