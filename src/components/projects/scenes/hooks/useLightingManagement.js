import { useState, useMemo, useCallback } from "react";

export function useLightingManagement({ projectItems, sceneItems }) {
  const [lightingDialog, setLightingDialog] = useState({
    open: false,
  });
  const [editLightingDialog, setEditLightingDialog] = useState({
    open: false,
    item: null,
  });

  const filteredLightingItems = useMemo(() => {
    return (
      projectItems.lighting?.filter((item) => {
        const isInCurrentScene = sceneItems.some((si) => si.item_type === "lighting" && si.item_id === item.id);
        return !isInCurrentScene;
      }) || []
    );
  }, [projectItems.lighting, sceneItems]);

  const handleOpenLightingDialog = useCallback(() => {
    setLightingDialog({ open: true });
  }, []);

  const handleCloseLightingDialog = useCallback((open) => {
    setLightingDialog({ open });
  }, []);

  const handleEditLightingItem = useCallback((item) => {
    setEditLightingDialog({ open: true, item });
  }, []);

  const handleCloseEditLightingDialog = useCallback((open) => {
    setEditLightingDialog({ open, item: null });
  }, []);

  return {
    // State
    lightingDialog,
    editLightingDialog,

    // Data
    filteredLightingItems,

    // Handlers
    handleOpenLightingDialog,
    handleCloseLightingDialog,
    handleEditLightingItem,
    handleCloseEditLightingDialog,
  };
}
