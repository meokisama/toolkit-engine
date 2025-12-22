import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { OBJECT_TYPES, CONSTANTS } from "@/constants";

export function useAirconManagement({ projectItems, sceneItems, setSceneItems, mode }) {
  const [airconPropertiesDialog, setAirconPropertiesDialog] = useState({
    open: false,
    airconCard: null,
  });
  const [editAirconPropertiesDialog, setEditAirconPropertiesDialog] = useState({
    open: false,
    airconGroup: null,
  });
  const [airconDialog, setAirconDialog] = useState({
    open: false,
  });
  const [editAirconDialog, setEditAirconDialog] = useState({
    open: false,
    item: null,
  });

  const getCommandForAirconItem = useCallback((objectType, itemValue) => {
    switch (objectType) {
      case OBJECT_TYPES.AC_POWER.obj_name:
        return (
          CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_POWER").values.find((item) => item.value.toString() === itemValue)?.command ||
          null
        );
      case OBJECT_TYPES.AC_FAN_SPEED.obj_name:
        return (
          CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_FAN_SPEED").values.find((item) => item.value.toString() === itemValue)?.command ||
          null
        );
      case OBJECT_TYPES.AC_MODE.obj_name:
        return (
          CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_MODE").values.find((item) => item.value.toString() === itemValue)?.command || null
        );
      case OBJECT_TYPES.AC_SWING.obj_name:
        return (
          CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_SWING").values.find((item) => item.value.toString() === itemValue)?.command ||
          null
        );
      case OBJECT_TYPES.AC_TEMPERATURE.obj_name:
        return null;
      default:
        return null;
    }
  }, []);

  // Get aircon cards from aircon items - memoized
  const availableAirconCards = useMemo(() => {
    if (!projectItems.aircon) return [];

    return projectItems.aircon
      .map((item) => ({
        address: item.address,
        name: item.name,
        description: item.description,
        item: item,
      }))
      .sort((a, b) => parseInt(a.address) - parseInt(b.address));
  }, [projectItems.aircon]);

  const filteredAirconCards = useMemo(() => {
    return availableAirconCards.filter((card) => {
      const isInCurrentScene = sceneItems.some((si) => si.item_type === "aircon" && si.item_address === card.address);
      return !isInCurrentScene;
    });
  }, [availableAirconCards, sceneItems]);

  // Add multiple aircon items to scene from a card
  const addAirconCardToScene = useCallback(
    async (address, selectedProperties) => {
      if (sceneItems.length + selectedProperties.length > 60) {
        toast.error(`Cannot add ${selectedProperties.length} items. Maximum 60 items allowed per scene (current: ${sceneItems.length})`);
        return;
      }

      const airconItem = projectItems.aircon?.find((item) => item.address === address);
      if (!airconItem) return;

      selectedProperties.forEach((property) => {
        const newSceneItem = {
          id: mode === "edit" ? `temp_${Date.now()}_${property.objectType}` : `${Date.now()}_${property.objectType}`,
          item_type: "aircon",
          item_id: airconItem.id,
          item_value: property.value,
          command: getCommandForAirconItem(property.objectType, property.value),
          object_type: property.objectType,
          item_name: airconItem.name,
          item_address: airconItem.address,
          item_description: airconItem.description,
          label: CONSTANTS.AIRCON.find((item) => item.obj_type === property.objectType)?.label || property.objectType,
        };
        setSceneItems((prev) => [...prev, newSceneItem]);
      });
    },
    [sceneItems.length, projectItems.aircon, getCommandForAirconItem, mode, setSceneItems]
  );

  const handleAddAirconCard = useCallback((airconCard) => {
    setAirconPropertiesDialog({
      open: true,
      airconCard,
    });
  }, []);

  const handleAirconPropertiesConfirm = useCallback(
    async (address, selectedProperties) => {
      await addAirconCardToScene(address, selectedProperties);
    },
    [addAirconCardToScene]
  );

  const handleOpenAirconDialog = useCallback(() => {
    setAirconDialog({ open: true });
  }, []);

  const handleCloseAirconDialog = useCallback((open) => {
    setAirconDialog({ open });
  }, []);

  const handleEditAirconItem = useCallback((item) => {
    setEditAirconDialog({ open: true, item });
  }, []);

  const handleCloseEditAirconDialog = useCallback((open) => {
    setEditAirconDialog({ open, item: null });
  }, []);

  const removeAirconGroupFromScene = useCallback((address) => {
    setSceneItems((prev) => prev.filter((item) => !(item.item_type === "aircon" && item.item_address === address)));
  }, [setSceneItems]);

  const handleEditAirconGroup = useCallback((airconGroup) => {
    setEditAirconPropertiesDialog({
      open: true,
      airconGroup,
    });
  }, []);

  const handleEditAirconPropertiesConfirm = useCallback(
    async (address, selectedProperties) => {
      const airconItem = projectItems.aircon?.find((item) => item.address === address);
      if (!airconItem) return;

      setSceneItems((prev) => {
        const filteredItems = prev.filter((item) => !(item.item_type === "aircon" && item.item_address === address));

        const newAirconItems = selectedProperties.map((property) => ({
          id: mode === "edit" ? `temp_${Date.now()}_${property.objectType}` : `${Date.now()}_${property.objectType}`,
          item_type: "aircon",
          item_id: airconItem.id,
          item_value: property.value,
          command: getCommandForAirconItem(property.objectType, property.value),
          object_type: property.objectType,
          item_name: airconItem.name,
          item_address: airconItem.address,
          item_description: airconItem.description,
          label: CONSTANTS.AIRCON.find((item) => item.obj_type === property.objectType)?.label || property.objectType,
        }));

        return [...filteredItems, ...newAirconItems];
      });
    },
    [projectItems.aircon, getCommandForAirconItem, mode, setSceneItems]
  );

  return {
    // State
    airconPropertiesDialog,
    setAirconPropertiesDialog,
    editAirconPropertiesDialog,
    setEditAirconPropertiesDialog,
    airconDialog,
    editAirconDialog,

    // Data
    availableAirconCards,
    filteredAirconCards,

    // Handlers
    getCommandForAirconItem,
    addAirconCardToScene,
    handleAddAirconCard,
    handleAirconPropertiesConfirm,
    handleOpenAirconDialog,
    handleCloseAirconDialog,
    handleEditAirconItem,
    handleCloseEditAirconDialog,
    removeAirconGroupFromScene,
    handleEditAirconGroup,
    handleEditAirconPropertiesConfirm,
  };
}
