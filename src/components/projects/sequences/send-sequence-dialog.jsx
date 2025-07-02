import React from "react";
import { toast } from "sonner";
import { SendItemsDialog } from "@/components/shared/send-items-dialog";

export function SendSequenceDialog({ open, onOpenChange, items = [] }) {
  const handleLoadSingleSequence = async (sequence) => {
    const sequenceData = await window.electronAPI.sequences.getMultiScenes(
      sequence.id
    );
    return sequenceData;
  };

  const handleValidateSingleSequence = (sequenceData) => {
    if (!sequenceData || sequenceData.length === 0) {
      toast.error("Sequence has no multi-scenes to send");
      return false;
    }
    return true;
  };

  const handleSendSingleSequence = async (
    sequence,
    sequenceData,
    selectedUnits
  ) => {
    let successCount = 0;
    let errorCount = 0;

    // Get multi-scene addresses from the sequence data, preserving order
    const multiSceneAddresses = sequenceData
      .sort((a, b) => a.multi_scene_order - b.multi_scene_order)
      .map((ms) => ms.multi_scene_address);

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

        const response = await window.electronAPI.rcuController.setupSequence(
          unit.ip_address,
          unit.id_can,
          {
            sequenceIndex: sequence.calculatedIndex ?? 0,
            sequenceAddress: sequence.address,
            multiSceneAddresses: multiSceneAddresses,
          }
        );

        console.log(`Sequence sent successfully to ${unit.ip_address}:`, {
          responseLength: response?.msg?.length,
          success: response?.result?.success,
        });

        successCount++;
        toast.success(
          `Sequence sent successfully to ${unit.type || "Unknown Unit"} (${
            unit.ip_address
          })`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `Failed to send sequence to unit ${unit.ip_address}:`,
          error
        );
        toast.error(
          `Failed to send sequence to ${unit.type || "Unknown Unit"} (${
            unit.ip_address
          }): ${error.message}`
        );
      }
    }

    if (successCount > 0) {
      toast.success(`Sequence sent successfully to ${successCount} unit(s)`);
    }

    if (errorCount > 0) {
      throw new Error(`Failed to send to ${errorCount} unit(s)`);
    }
  };

  const handleSendBulkSequences = async (
    sequences,
    selectedUnits,
    onProgress
  ) => {
    let totalSuccessCount = 0;
    let totalErrorCount = 0;

    for (let i = 0; i < sequences.length; i++) {
      const sequence = sequences[i];
      onProgress?.(
        ((i + 1) / sequences.length) * 100,
        `Sending sequence ${i + 1}/${sequences.length}: ${sequence.name}`
      );

      try {
        // Load sequence data
        const sequenceData = await handleLoadSingleSequence(sequence);

        // Validate sequence data
        if (!handleValidateSingleSequence(sequenceData)) {
          totalErrorCount++;
          continue;
        }

        // Send to all selected units
        await handleSendSingleSequence(sequence, sequenceData, selectedUnits);
        totalSuccessCount++;
      } catch (error) {
        totalErrorCount++;
        console.error(`Failed to send sequence ${sequence.name}:`, error);
        toast.error(`Failed to send sequence ${sequence.name}: ${error.message}`);
      }
    }

    // Final summary
    if (totalSuccessCount > 0) {
      toast.success(
        `Successfully sent ${totalSuccessCount} sequence(s) to ${selectedUnits.length} unit(s)`
      );
    }

    if (totalErrorCount > 0) {
      toast.error(`Failed to send ${totalErrorCount} sequence(s)`);
    }
  };

  return (
    <SendItemsDialog
      open={open}
      onOpenChange={onOpenChange}
      items={items}
      itemType="sequence"
      itemTypePlural="sequences"
      title="Send Sequence to Units"
      description="Select units to send the sequence configuration to."
      loadItemData={handleLoadSingleSequence}
      validateItemData={handleValidateSingleSequence}
      sendSingleItem={handleSendSingleSequence}
      sendBulkItems={handleSendBulkSequences}
      getItemDisplayInfo={(sequence) => ({
        name: sequence.name,
        address: sequence.address,
        description: sequence.description,
        additionalInfo: `Index: ${sequence.calculatedIndex ?? 0}`,
      })}
    />
  );
}
