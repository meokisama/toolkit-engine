import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

export function useDmxManagement({ projectItems, sceneItems, setSceneItems, mode }) {
  const [dmxPropertiesDialog, setDmxPropertiesDialog] = useState({
    open: false,
    dmxCard: null,
  });
  const [editDmxPropertiesDialog, setEditDmxPropertiesDialog] = useState({
    open: false,
    dmxItem: null,
  });
  const [dmxDialog, setDmxDialog] = useState({
    open: false,
  });
  const [editDmxDialog, setEditDmxDialog] = useState({
    open: false,
    item: null,
  });

  // Get dmx cards from dmx items - memoized
  const availableDmxCards = useMemo(() => {
    if (!projectItems.dmx) return [];

    return projectItems.dmx
      .map((item) => ({
        address: item.address,
        name: item.name,
        description: item.description,
        item: item,
        id: item.id,
        // Include all 16 color data
        ...Object.fromEntries(
          Array.from({ length: 16 }, (_, i) => [`color${i + 1}`, item[`color${i + 1}`]])
        ),
      }))
      .sort((a, b) => parseInt(a.address) - parseInt(b.address));
  }, [projectItems.dmx]);

  const filteredDmxCards = useMemo(() => {
    return availableDmxCards.filter((card) => {
      // Filter out DMX devices that are already in the scene
      // A DMX device can only be added once to a scene
      return !sceneItems.some((item) => item.item_type === "dmx" && item.item_id === card.id);
    });
  }, [availableDmxCards, sceneItems]);

  // Handle opening dmx properties dialog
  const handleAddDmxCard = useCallback((dmxCard) => {
    setDmxPropertiesDialog({
      open: true,
      dmxCard,
    });
  }, []);

  // Handle confirming dmx properties selection
  const handleDmxPropertiesConfirm = useCallback(
    async ({ address: _address, itemId, objectType, value, colorIndex }) => {
      // Check scene items limit (60 items maximum)
      if (sceneItems.length >= 60) {
        toast.error("Maximum 60 items allowed per scene");
        return;
      }

      // Find the DMX item
      const dmxItem = projectItems.dmx?.find((item) => item.id === itemId);
      if (!dmxItem) return;

      // Create scene item
      const newSceneItem = {
        id: mode === "edit" ? `temp_${Date.now()}` : Date.now(),
        item_type: "dmx",
        item_id: itemId,
        item_value: value,
        command: null, // DMX doesn't use command
        object_type: objectType,
        item_name: dmxItem.name,
        item_address: dmxItem.address,
        item_description: dmxItem.description,
        label: `Color ${colorIndex + 1}`,
      };
      setSceneItems((prev) => [...prev, newSceneItem]);
    },
    [sceneItems.length, projectItems.dmx, mode, setSceneItems]
  );

  // Handle opening edit dmx properties dialog
  const handleEditDmxItem = useCallback((dmxSceneItem) => {
    // Find the DMX device to get color data
    const dmxDevice = projectItems.dmx?.find((item) => item.id === dmxSceneItem.item_id);

    // Merge scene item with DMX device data for the dialog
    const mergedData = {
      ...dmxSceneItem,
      // Add color data from DMX device
      ...Object.fromEntries(
        Array.from({ length: 16 }, (_, i) => [`color${i + 1}`, dmxDevice?.[`color${i + 1}`] || "0,0,0,0"])
      ),
    };

    setEditDmxPropertiesDialog({
      open: true,
      dmxItem: mergedData,
    });
  }, [projectItems.dmx]);

  // Handle confirming edit dmx properties
  const handleEditDmxPropertiesConfirm = useCallback(
    async ({ address: _address, itemId, objectType, value, colorIndex }) => {
      // Find the DMX item
      const dmxItem = projectItems.dmx?.find((item) => item.id === itemId);
      if (!dmxItem) return;

      // Update scene items
      setSceneItems((prev) =>
        prev.map((item) => {
          if (item.id === editDmxPropertiesDialog.dmxItem?.id) {
            return {
              ...item,
              item_value: value,
              object_type: objectType,
              label: `Color ${colorIndex + 1}`,
            };
          }
          return item;
        })
      );
    },
    [projectItems.dmx, editDmxPropertiesDialog.dmxItem, setSceneItems]
  );

  const handleOpenDmxDialog = useCallback(() => {
    setDmxDialog({ open: true });
  }, []);

  const handleCloseDmxDialog = useCallback((open) => {
    setDmxDialog({ open });
  }, []);

  const handleEditDmxItemDialog = useCallback((item) => {
    setEditDmxDialog({ open: true, item });
  }, []);

  const handleCloseEditDmxDialog = useCallback((open) => {
    setEditDmxDialog({ open, item: null });
  }, []);

  const removeDmxItemFromScene = useCallback((sceneItemId) => {
    setSceneItems((prev) => prev.filter((item) => item.id !== sceneItemId));
  }, [setSceneItems]);

  return {
    // State
    dmxPropertiesDialog,
    setDmxPropertiesDialog,
    editDmxPropertiesDialog,
    setEditDmxPropertiesDialog,
    dmxDialog,
    editDmxDialog,

    // Data
    availableDmxCards,
    filteredDmxCards,

    // Handlers
    handleAddDmxCard,
    handleDmxPropertiesConfirm,
    handleEditDmxItem,
    handleEditDmxPropertiesConfirm,
    handleOpenDmxDialog,
    handleCloseDmxDialog,
    handleEditDmxItemDialog,
    handleCloseEditDmxDialog,
    removeDmxItemFromScene,
  };
}
