import { useState, useMemo, useCallback } from "react";

export function useCurtainManagement({ projectItems, sceneItems }) {
  const [curtainDialog, setCurtainDialog] = useState({
    open: false,
  });
  const [editCurtainDialog, setEditCurtainDialog] = useState({
    open: false,
    item: null,
  });

  const filteredCurtainItems = useMemo(() => {
    return (
      projectItems.curtain?.filter((item) => {
        const isInCurrentScene = sceneItems.some((si) => si.item_type === "curtain" && si.item_id === item.id);
        return !isInCurrentScene;
      }) || []
    );
  }, [projectItems.curtain, sceneItems]);

  const handleOpenCurtainDialog = useCallback(() => {
    setCurtainDialog({ open: true });
  }, []);

  const handleCloseCurtainDialog = useCallback((open) => {
    setCurtainDialog({ open });
  }, []);

  const handleEditCurtainItem = useCallback((item) => {
    setEditCurtainDialog({ open: true, item });
  }, []);

  const handleCloseEditCurtainDialog = useCallback((open) => {
    setEditCurtainDialog({ open, item: null });
  }, []);

  return {
    // State
    curtainDialog,
    editCurtainDialog,

    // Data
    filteredCurtainItems,

    // Handlers
    handleOpenCurtainDialog,
    handleCloseCurtainDialog,
    handleEditCurtainItem,
    handleCloseEditCurtainDialog,
  };
}
