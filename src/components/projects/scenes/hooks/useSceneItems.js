import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { CONSTANTS } from "@/constants";

export function useSceneItems({ projectItems, getCommandForAirconItem, mode }) {
  const [sceneItems, setSceneItems] = useState([]);
  const [originalSceneItems, setOriginalSceneItems] = useState([]);
  const [customBrightnessDialog, setCustomBrightnessDialog] = useState({
    open: false,
    brightness: 50,
    brightness255: 128,
  });

  const loadSceneItems = useCallback(async (sceneId) => {
    try {
      const items = await window.electronAPI.scene.getItemsWithDetails(sceneId);
      setSceneItems(items);
      setOriginalSceneItems(items);
    } catch (error) {
      console.error("Failed to load scene items:", error);
    }
  }, []);

  const getItemDetails = useMemo(() => {
    return (itemType, itemId) => {
      const items = projectItems[itemType] || [];
      return items.find((item) => item.id === itemId);
    };
  }, [projectItems]);

  const addItemToScene = useCallback(
    async (itemType, itemId, itemValue = null) => {
      if (sceneItems.length >= 60) {
        toast.error("Maximum 60 items allowed per scene");
        return;
      }

      const item = getItemDetails(itemType, itemId);
      if (!item) return;

      let command = null;
      let objectType = item.object_type;

      if (itemType === "aircon" && itemValue !== null) {
        command = getCommandForAirconItem(item.object_type, itemValue);
      }

      const newSceneItem = {
        id: mode === "edit" ? `temp_${Date.now()}` : Date.now(),
        item_type: itemType,
        item_id: itemId,
        item_value: itemValue,
        command: command,
        object_type: objectType,
        item_name: item.name,
        item_address: item.address,
        item_description: item.description,
        label: item.label,
      };
      setSceneItems((prev) => [...prev, newSceneItem]);
    },
    [sceneItems.length, getItemDetails, getCommandForAirconItem, mode]
  );

  const removeItemFromScene = useCallback((sceneItemId) => {
    setSceneItems((prev) => prev.filter((item) => item.id !== sceneItemId));
  }, []);

  const updateSceneItemValue = useCallback(
    (sceneItemId, itemValue) => {
      setSceneItems((prev) =>
        prev.map((item) => {
          if (item.id === sceneItemId) {
            let command = null;
            if (item.item_type === "aircon") {
              command = getCommandForAirconItem(item.object_type, itemValue);
            }
            return { ...item, item_value: itemValue, command: command };
          }
          return item;
        })
      );
    },
    [getCommandForAirconItem]
  );

  const groupedSceneItems = useMemo(() => {
    const grouped = [];
    const airconGroups = new Map();

    sceneItems.forEach((item) => {
      if (item.item_type === "aircon") {
        if (!airconGroups.has(item.item_address)) {
          airconGroups.set(item.item_address, {
            type: "aircon-group",
            address: item.item_address,
            name: item.item_name,
            description: item.item_description,
            items: [],
          });
        }
        airconGroups.get(item.item_address).items.push(item);
      } else {
        grouped.push(item);
      }
    });

    airconGroups.forEach((group) => {
      grouped.push(group);
    });

    return grouped.sort((a, b) => {
      if (a.address && b.address) {
        return parseInt(a.address) - parseInt(b.address);
      }
      if (a.item_address && b.item_address) {
        return parseInt(a.item_address) - parseInt(b.item_address);
      }
      return 0;
    });
  }, [sceneItems]);

  const handleAllLightingOn = useCallback(() => {
    setSceneItems((prev) =>
      prev.map((item) => {
        if (item.item_type === "lighting") {
          return { ...item, item_value: "255" };
        }
        return item;
      })
    );
  }, []);

  const handleAllLightingOff = useCallback(() => {
    setSceneItems((prev) =>
      prev.map((item) => {
        if (item.item_type === "lighting") {
          return { ...item, item_value: "0" };
        }
        return item;
      })
    );
  }, []);

  const handleCustomBrightness = useCallback(() => {
    const { brightness255 } = customBrightnessDialog;

    const value255 = parseInt(brightness255);
    if (isNaN(value255) || value255 < 0 || value255 > 255) {
      toast.error("Brightness must be between 0 and 255");
      return;
    }

    const percentValue = Math.round((value255 * 100) / 255);

    setSceneItems((prev) =>
      prev.map((item) => {
        if (item.item_type === "lighting") {
          return { ...item, item_value: value255.toString() };
        }
        return item;
      })
    );
    setCustomBrightnessDialog({
      open: false,
      brightness: 50,
      brightness255: 128,
    });
    toast.success(`Set all lighting to ${percentValue}% (${value255}/255) brightness`);
  }, [customBrightnessDialog]);

  const applySceneItemsChanges = async (sceneId) => {
    const itemsToRemove = originalSceneItems.filter((item) => !sceneItems.some((currentItem) => currentItem.id === item.id));
    const itemsToAdd = sceneItems.filter(
      (item) => !originalSceneItems.some((originalItem) => originalItem.id === item.id) || item.id.toString().startsWith("temp_")
    );
    const itemsToUpdate = sceneItems.filter((item) => {
      const originalItem = originalSceneItems.find((orig) => orig.id === item.id);
      return originalItem && (originalItem.item_value !== item.item_value || originalItem.command !== item.command || originalItem.object_type !== item.object_type);
    });

    for (const item of itemsToRemove) {
      await window.electronAPI.scene.removeItem(item.id);
    }

    for (const item of itemsToAdd) {
      await window.electronAPI.scene.addItem(sceneId, item.item_type, item.item_id, item.item_value, item.command, item.object_type);
    }

    for (const item of itemsToUpdate) {
      await window.electronAPI.scene.updateItemValue(item.id, item.item_value, item.command, item.object_type);
    }
  };

  return {
    // State
    sceneItems,
    setSceneItems,
    originalSceneItems,
    setOriginalSceneItems,
    customBrightnessDialog,
    setCustomBrightnessDialog,

    // Data
    groupedSceneItems,

    // Methods
    loadSceneItems,
    addItemToScene,
    removeItemFromScene,
    updateSceneItemValue,
    handleAllLightingOn,
    handleAllLightingOff,
    handleCustomBrightness,
    applySceneItemsChanges,
  };
}
