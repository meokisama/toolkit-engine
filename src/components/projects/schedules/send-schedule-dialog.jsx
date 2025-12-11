import React from "react";
import { toast } from "sonner";
import { SendItemsDialog } from "@/components/shared/send-items-dialog";

export function SendScheduleDialog({ open, onOpenChange, items = [] }) {
  const handleLoadSingleSchedule = async (schedule) => {
    const data = await window.electronAPI.schedule.getForSending(schedule.id);
    return data;
  };

  const handleValidateSingleSchedule = (scheduleData) => {
    if (!scheduleData || scheduleData.sceneAddresses.length === 0) {
      toast.error("Schedule has no scenes to send");
      return false;
    }
    return true;
  };

  const handleSendSingleSchedule = async (schedule, scheduleData, selectedUnits) => {
    let successCount = 0;
    let errorCount = 0;

    // Send schedule to all selected units
    for (const unit of selectedUnits) {
      try {
        console.log("Sending schedule to unit:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          scheduleIndex: schedule.calculatedIndex ?? 0,
          enabled: scheduleData.enabled,
          weekDays: scheduleData.parsedDays,
          hour: scheduleData.hour,
          minute: scheduleData.minute,
          sceneAddresses: scheduleData.sceneAddresses,
        });

        await window.electronAPI.schedule.send({
          unitIp: unit.ip_address,
          canId: unit.id_can,
          scheduleIndex: schedule.calculatedIndex ?? 0,
          enabled: scheduleData.enabled,
          weekDays: scheduleData.parsedDays,
          hour: scheduleData.hour,
          minute: scheduleData.minute,
          sceneAddresses: scheduleData.sceneAddresses,
        });

        successCount++;
        toast.success(`Schedule sent successfully to ${unit.type || unit.unit_type} (${unit.ip_address})`);
      } catch (error) {
        errorCount++;
        console.error(`Failed to send schedule to ${unit.ip_address}:`, error);
        toast.error(`Failed to send schedule to ${unit.type || unit.unit_type} (${unit.ip_address}): ${error.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Schedule sent successfully to ${successCount} unit(s)`);
    }

    if (errorCount > 0) {
      throw new Error(`Failed to send to ${errorCount} unit(s)`);
    }
  };

  const handleSendBulkSchedules = async (schedules, selectedUnits, onProgress) => {
    // Add delete operations to total count (one delete per unit)
    const totalOperations = schedules.length * selectedUnits.length + selectedUnits.length;
    let completedOperations = 0;
    const operationResults = [];

    // First, delete all existing schedules from selected units
    onProgress(0, "Deleting existing schedules...");
    for (const unit of selectedUnits) {
      try {
        console.log("Deleting all schedules from unit:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });

        await window.electronAPI.scheduleController.deleteAllSchedules(unit.ip_address, unit.id_can);

        operationResults.push({
          scene: "Delete All Schedules",
          unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
          success: true,
          message: "Existing schedules deleted successfully",
        });

        completedOperations++;
        onProgress((completedOperations / totalOperations) * 100, "Deleting existing schedules...");
      } catch (error) {
        console.error(`Failed to delete existing schedules from unit ${unit.ip_address}:`, error);
        operationResults.push({
          scene: "Delete All Schedules",
          unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
          success: false,
          message: error.message || "Failed to delete existing schedules",
        });

        completedOperations++;
        onProgress((completedOperations / totalOperations) * 100, "Deleting existing schedules...");
      }
    }

    for (let scheduleIndex = 0; scheduleIndex < schedules.length; scheduleIndex++) {
      const currentScheduleData = schedules[scheduleIndex];
      onProgress((completedOperations / totalOperations) * 100, `Sending ${currentScheduleData.name} (${scheduleIndex + 1}/${schedules.length})`);

      // Get schedule data
      let schedulePayload = null;
      try {
        const scheduleScenes = await window.electronAPI.schedule.getForSending(currentScheduleData.id);

        schedulePayload = {
          enabled: currentScheduleData.enabled || false,
          parsedDays: scheduleScenes.parsedDays,
          hour: scheduleScenes.hour,
          minute: scheduleScenes.minute,
          sceneAddresses: scheduleScenes.sceneAddresses,
        };
      } catch (error) {
        console.error(`Failed to load data for schedule ${currentScheduleData.id}:`, error);
        // Skip schedules without data
        completedOperations += selectedUnits.length;
        onProgress((completedOperations / totalOperations) * 100, "");
        continue;
      }

      if (!schedulePayload || schedulePayload.sceneAddresses.length === 0) {
        // Skip schedules without scenes
        completedOperations += selectedUnits.length;
        onProgress((completedOperations / totalOperations) * 100, "");
        continue;
      }

      // Send schedule to all selected units
      for (const unit of selectedUnits) {
        try {
          console.log("Sending schedule to unit:", {
            unitIp: unit.ip_address,
            canId: unit.id_can,
            scheduleIndex: scheduleIndex,
            enabled: schedulePayload.enabled,
            weekDays: schedulePayload.parsedDays,
            hour: schedulePayload.hour,
            minute: schedulePayload.minute,
            sceneAddresses: schedulePayload.sceneAddresses,
          });

          await window.electronAPI.schedule.send({
            unitIp: unit.ip_address,
            canId: unit.id_can,
            scheduleIndex: scheduleIndex,
            enabled: schedulePayload.enabled,
            weekDays: schedulePayload.parsedDays,
            hour: schedulePayload.hour,
            minute: schedulePayload.minute,
            sceneAddresses: schedulePayload.sceneAddresses,
          });

          operationResults.push({
            schedule: currentScheduleData.name,
            unit: `${unit.type || unit.unit_type || "Unknown Unit"} (${unit.ip_address})`,
            success: true,
            message: "Sent successfully",
          });

          console.log(`Schedule sent successfully to ${unit.ip_address}`);
        } catch (error) {
          console.error(`Failed to send schedule ${currentScheduleData.name} to unit ${unit.ip_address}:`, error);
          operationResults.push({
            schedule: currentScheduleData.name,
            unit: `${unit.type || unit.unit_type || "Unknown Unit"} (${unit.ip_address})`,
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
      itemType="schedule"
      onLoadSingleItem={handleLoadSingleSchedule}
      onSendSingle={handleSendSingleSchedule}
      onSendBulk={handleSendBulkSchedules}
      validateSingleItem={handleValidateSingleSchedule}
    />
  );
}
