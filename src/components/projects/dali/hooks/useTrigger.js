import { useState, useCallback, useRef, useEffect } from "react";
import { useDali } from "@/contexts/dali-context";
import { toast } from "sonner";

/**
 * Custom hook for handling DALI trigger logic with debounce
 * @param {Object} params
 * @param {string} params.type - Trigger type: 'device', 'group', or 'scene'
 * @param {number} params.id - Device address, group ID, or scene ID
 * @returns {Object} - Trigger state and handlers
 */
export function useTrigger({ type, id }) {
  const { selectedGateway } = useDali();
  const [level, setLevel] = useState([128]); // Default 50% brightness
  const [open, setOpen] = useState(false);
  const debounceTimerRef = useRef(null);

  const handleLevelChange = useCallback(
    (newLevel) => {
      setLevel(newLevel);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounced timer (300ms)
      debounceTimerRef.current = setTimeout(async () => {
        if (!selectedGateway) return;

        try {
          // Call appropriate API based on type
          if (type === "device") {
            await window.electronAPI.daliController.triggerDevice({
              unitIp: selectedGateway.ip_address,
              canId: selectedGateway.id_can,
              deviceAddress: id,
              level: newLevel[0],
            });
          } else if (type === "group") {
            await window.electronAPI.daliController.triggerGroup({
              unitIp: selectedGateway.ip_address,
              canId: selectedGateway.id_can,
              groupId: id,
              level: newLevel[0],
            });
          }
        } catch (error) {
          console.error(`Failed to trigger ${type}:`, error);
          toast.error(`Failed to trigger ${type}: ${error.message}`);
        }
      }, 300);
    },
    [selectedGateway, type, id]
  );

  const handleTriggerScene = useCallback(
    async (e) => {
      e?.stopPropagation?.(); // Prevent event bubbling if provided

      if (!selectedGateway) {
        toast.error("Please select a gateway first");
        return;
      }

      try {
        await window.electronAPI.daliController.triggerScene({
          unitIp: selectedGateway.ip_address,
          canId: selectedGateway.id_can,
          sceneId: id,
        });
        toast.success(`Scene ${id} triggered`);
      } catch (error) {
        console.error("Failed to trigger scene:", error);
        toast.error(`Failed to trigger scene: ${error.message}`);
      }
    },
    [selectedGateway, id]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    level,
    open,
    setOpen,
    handleLevelChange,
    handleTriggerScene,
    selectedGateway,
  };
}
