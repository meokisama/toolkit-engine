import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { OBJECT_TYPES, CONSTANTS } from "@/constants";
import { AirconPropertiesDialog } from "./dialogs/aircon-properties-dialog";
import { DmxPropertiesDialog } from "./dialogs/dmx-properties-dialog";
import { ProjectItemDialog } from "../lighting/lighting-dialog";
import { CurtainDialog } from "../curtain/curtain-dialog";
import { DmxDialog } from "../dmx/dmx-dialog";
import { SceneBasicInfoForm } from "./components/scene-basic-info-form";
import { CurrentSceneItems } from "./components/current-scene-items";
import { AvailableItemsTabs } from "./components/available-items-tabs";
import { useSceneItems } from "./hooks/useSceneItems";
import { useDmxManagement } from "./hooks/useDmxManagement";
import { useAirconManagement } from "./hooks/useAirconManagement";
import { useLightingManagement } from "./hooks/useLightingManagement";
import { useCurtainManagement } from "./hooks/useCurtainManagement";
import { useSpiManagement } from "./hooks/useSpiManagement";
import log from "electron-log/renderer";

// Create label mappings directly from CONSTANTS.AIRCON
const AC_POWER_LABELS =
  CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_POWER")?.values.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {}) || {};

const AC_MODE_LABELS =
  CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_MODE")?.values.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {}) || {};

const AC_FAN_SPEED_LABELS =
  CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_FAN_SPEED")?.values.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {}) || {};

const AC_SWING_LABELS =
  CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_SWING")?.values.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {}) || {};

export function SceneDialog({ open, onOpenChange, scene = null, mode = "create" }) {
  const { selectedProject, projectItems, createItem, updateItem, setActiveTab, loadTabData, loadedTabs } = useProjectDetail();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    source_unit: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("lighting");
  const validationTimeoutRef = useRef(null);

  // Use custom hooks for scene items management
  const airconHooks = useAirconManagement({ projectItems, sceneItems: [], setSceneItems: () => {}, mode });
  const sceneItemsHooks = useSceneItems({
    projectItems,
    getCommandForAirconItem: airconHooks.getCommandForAirconItem,
    mode,
  });

  // Now pass the actual sceneItems to other hooks
  const dmxHooks = useDmxManagement({
    projectItems,
    sceneItems: sceneItemsHooks.sceneItems,
    setSceneItems: sceneItemsHooks.setSceneItems,
    mode,
  });

  const airconManagement = useAirconManagement({
    projectItems,
    sceneItems: sceneItemsHooks.sceneItems,
    setSceneItems: sceneItemsHooks.setSceneItems,
    mode,
  });

  const lightingHooks = useLightingManagement({
    projectItems,
    sceneItems: sceneItemsHooks.sceneItems,
  });

  const curtainHooks = useCurtainManagement({
    projectItems,
    sceneItems: sceneItemsHooks.sceneItems,
  });

  const spiHooks = useSpiManagement({
    sceneItems: sceneItemsHooks.sceneItems,
    setSceneItems: sceneItemsHooks.setSceneItems,
    mode,
  });

  // Validate address field - memoized
  const validateAddress = useCallback((value) => {
    if (!value.trim()) {
      return "Address is required for scenes";
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || !Number.isInteger(parseFloat(value))) {
      return "Address must be an integer";
    }

    if (num < 1 || num > 255) {
      return "Address must be between 1 and 255";
    }

    return null;
  }, []);

  // Validate name field - memoized
  const validateName = useCallback((value) => {
    if (!value.trim()) {
      return "Name is required";
    }

    return null;
  }, []);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && scene) {
        setFormData({
          name: scene.name || "",
          address: scene.address || "",
          description: scene.description || "",
          source_unit: scene.source_unit || null,
        });
        sceneItemsHooks.loadSceneItems(scene.id);
      } else {
        setFormData({
          name: "",
          address: "",
          description: "",
          source_unit: null,
        });
        sceneItemsHooks.setSceneItems([]);
        sceneItemsHooks.setOriginalSceneItems([]);
      }
      setErrors({});

      // Load required data for scene dialog if not already loaded
      if (selectedProject) {
        if (!loadedTabs.has("aircon")) {
          loadTabData(selectedProject.id, "aircon");
        }
        if (!loadedTabs.has("curtain")) {
          loadTabData(selectedProject.id, "curtain");
        }
        if (!loadedTabs.has("lighting")) {
          loadTabData(selectedProject.id, "lighting");
        }
        if (!loadedTabs.has("dmx")) {
          loadTabData(selectedProject.id, "dmx");
        }
        if (!loadedTabs.has("unit")) {
          loadTabData(selectedProject.id, "unit");
        }
      }
    }
  }, [open, mode, scene, selectedProject, loadedTabs, loadTabData, sceneItemsHooks.loadSceneItems]);

  // Reload scene items when project data changes
  useEffect(() => {
    if (open && mode === "edit" && scene && scene.id) {
      sceneItemsHooks.loadSceneItems(scene.id);
    }
  }, [open, mode, scene, projectItems.aircon, projectItems.lighting, projectItems.curtain, projectItems.dmx, sceneItemsHooks.loadSceneItems]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      setErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors.general) {
          delete newErrors.general;
        }

        if (newErrors[field]) {
          delete newErrors[field];
        }

        return newErrors;
      });

      if (field === "address") {
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }

        validationTimeoutRef.current = setTimeout(() => {
          const error = validateAddress(value);
          setErrors((prev) => ({ ...prev, address: error }));
        }, 300);
      }
    },
    [validateAddress]
  );

  // Handle opening dialog based on current tab
  const handleAddNewItem = useCallback(() => {
    switch (currentTab) {
      case "lighting":
        lightingHooks.handleOpenLightingDialog();
        break;
      case "aircon":
        airconManagement.handleOpenAirconDialog();
        break;
      case "curtain":
        curtainHooks.handleOpenCurtainDialog();
        break;
      case "dmx":
        dmxHooks.handleOpenDmxDialog();
        break;
      default:
        break;
    }
  }, [currentTab, lightingHooks, airconManagement, curtainHooks, dmxHooks]);

  // Handle closing add new item dialogs with data reload
  const handleCloseLightingDialog = useCallback(
    (open) => {
      lightingHooks.handleCloseLightingDialog(open);
      if (!open && selectedProject) {
        loadTabData("lighting");
      }
    },
    [lightingHooks, selectedProject, loadTabData]
  );

  const handleCloseAirconDialog = useCallback(
    (open) => {
      airconManagement.handleCloseAirconDialog(open);
      if (!open && selectedProject) {
        loadTabData("aircon");
      }
    },
    [airconManagement, selectedProject, loadTabData]
  );

  const handleCloseCurtainDialog = useCallback(
    (open) => {
      curtainHooks.handleCloseCurtainDialog(open);
      if (!open && selectedProject) {
        loadTabData("curtain");
      }
    },
    [curtainHooks, selectedProject, loadTabData]
  );

  const handleCloseDmxDialog = useCallback(
    (open) => {
      dmxHooks.handleCloseDmxDialog(open);
      if (!open && selectedProject) {
        loadTabData("dmx");
      }
    },
    [dmxHooks, selectedProject, loadTabData]
  );

  // Handle closing edit dialogs with data reload
  const handleCloseEditLightingDialog = useCallback(
    (open) => {
      lightingHooks.handleCloseEditLightingDialog(open);
      if (!open && selectedProject) {
        loadTabData("lighting");
      }
    },
    [lightingHooks, selectedProject, loadTabData]
  );

  const handleCloseEditAirconDialog = useCallback(
    (open) => {
      airconManagement.handleCloseEditAirconDialog(open);
      if (!open && selectedProject) {
        loadTabData("aircon");
      }
    },
    [airconManagement, selectedProject, loadTabData]
  );

  const handleCloseEditCurtainDialog = useCallback(
    (open) => {
      curtainHooks.handleCloseEditCurtainDialog(open);
      if (!open && selectedProject) {
        loadTabData("curtain");
      }
    },
    [curtainHooks, selectedProject, loadTabData]
  );

  const handleCloseEditDmxDialog = useCallback(
    (open) => {
      dmxHooks.handleCloseEditDmxDialog(open);
      if (!open && selectedProject) {
        loadTabData("dmx");
      }
    },
    [dmxHooks, selectedProject, loadTabData]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameError = validateName(formData.name);
    if (nameError) {
      setErrors({ name: nameError });
      return;
    }

    const addressError = validateAddress(formData.address);
    if (addressError) {
      setErrors({ address: addressError });
      return;
    }

    setLoading(true);
    try {
      if (mode === "edit" && scene) {
        await updateItem("scene", scene.id, formData);
        await sceneItemsHooks.applySceneItemsChanges(scene.id);
      } else {
        const newScene = await createItem("scene", formData);

        for (const sceneItem of sceneItemsHooks.sceneItems) {
          // For SPI items, pass item_address directly since they don't have database entries
          const itemAddress = sceneItem.item_type === "spi" ? sceneItem.item_address : null;
          await window.electronAPI.scene.addItem(
            newScene.id,
            sceneItem.item_type,
            sceneItem.item_id,
            sceneItem.item_value,
            sceneItem.command,
            sceneItem.object_type,
            itemAddress
          );
        }

        setActiveTab("scene");
      }
      onOpenChange(false);

      setFormData({
        name: "",
        address: "",
        description: "",
        source_unit: null,
      });
      sceneItemsHooks.setSceneItems([]);
      sceneItemsHooks.setOriginalSceneItems([]);
      setErrors({});
    } catch (error) {
      log.error("Failed to save scene:", error);

      if (error.message && error.message.includes("already used by another scene")) {
        setErrors({ general: error.message });
      } else if (error.message && error.message.includes("already exists")) {
        const cleanMessage = error.message.split(": ").pop();
        setErrors({ address: cleanMessage });
      } else if (error.message && error.message.includes("Address is required")) {
        setErrors({ address: "Address is required for scenes" });
      } else if (error.message && error.message.includes("Maximum 100 scenes allowed")) {
        setErrors({
          general: "Maximum 100 scenes allowed per project (indexed 0-99)",
        });
      } else {
        setErrors({ general: "Failed to save scene. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetToOriginalState = useCallback(() => {
    if (mode === "edit" && sceneItemsHooks.originalSceneItems.length > 0) {
      sceneItemsHooks.setSceneItems([...sceneItemsHooks.originalSceneItems]);
      setFormData({
        name: scene?.name || "",
        address: scene?.address || "",
        description: scene?.description || "",
        source_unit: scene?.source_unit || null,
      });
    }
    setErrors({});
  }, [mode, sceneItemsHooks.originalSceneItems, scene]);

  const handleCancel = useCallback(() => {
    resetToOriginalState();
    onOpenChange(false);
  }, [resetToOriginalState, onOpenChange]);

  const handleDialogOpenChange = useCallback(
    (isOpen) => {
      if (!isOpen) {
        resetToOriginalState();
      }
      onOpenChange(isOpen);
    },
    [resetToOriginalState, onOpenChange]
  );

  // Memoize value options to prevent recalculation on every render
  const getValueOptions = useMemo(() => {
    const optionsCache = {
      [OBJECT_TYPES.AC_POWER.obj_name]: Object.entries(AC_POWER_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      [OBJECT_TYPES.AC_FAN_SPEED.obj_name]: Object.entries(AC_FAN_SPEED_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      [OBJECT_TYPES.AC_MODE.obj_name]: Object.entries(AC_MODE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      [OBJECT_TYPES.AC_SWING.obj_name]: Object.entries(AC_SWING_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      [OBJECT_TYPES.AC_TEMPERATURE.obj_name]: [],
      [OBJECT_TYPES.CURTAIN.obj_name]: CONSTANTS.CURTAIN.VALUES.map((item) => ({
        value: item.value.toString(),
        label: item.label,
      })),
      curtain: CONSTANTS.CURTAIN.VALUES.map((item) => ({
        value: item.value.toString(),
        label: item.label,
      })),
    };

    return (objectType, itemType) => {
      if (optionsCache[objectType]) {
        return optionsCache[objectType];
      }
      if (itemType === "curtain") {
        return optionsCache.curtain;
      }
      return [];
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Scene" : "Create New Scene"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the scene details and manage scene items."
              : "Create a new scene and add items from lighting, aircon, and curtain sections."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Scene Basic Info */}
            <SceneBasicInfoForm formData={formData} errors={errors} onInputChange={handleInputChange} projectItems={projectItems} />

            {/* Scene Items Management */}
            <div className="space-y-4">
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Scene Items</h3>
                <p className="text-sm text-muted-foreground">Add items from the right panel. You can set values for each item if applicable.</p>
              </div>

              {/* Two-column layout for Current Items and Add Items */}
              <div className="grid grid-cols-2 gap-4">
                {/* Current Scene Items - Left Side */}
                <CurrentSceneItems
                  sceneItems={sceneItemsHooks.sceneItems}
                  groupedSceneItems={sceneItemsHooks.groupedSceneItems}
                  onAllLightingOn={sceneItemsHooks.handleAllLightingOn}
                  onAllLightingOff={sceneItemsHooks.handleAllLightingOff}
                  customBrightnessDialog={sceneItemsHooks.customBrightnessDialog}
                  setCustomBrightnessDialog={sceneItemsHooks.setCustomBrightnessDialog}
                  onCustomBrightness={sceneItemsHooks.handleCustomBrightness}
                  onEditAirconGroup={airconManagement.handleEditAirconGroup}
                  onRemoveAirconGroup={airconManagement.removeAirconGroupFromScene}
                  onEditDmxItem={dmxHooks.handleEditDmxItem}
                  onRemoveItem={sceneItemsHooks.removeItemFromScene}
                  updateSceneItemValue={sceneItemsHooks.updateSceneItemValue}
                  getValueOptions={getValueOptions}
                  ledEffects={spiHooks.ledEffects}
                  onUpdateSpiEffect={spiHooks.updateSpiEffect}
                />

                {/* Add Items to Scene - Right Side */}
                <AvailableItemsTabs
                  currentTab={currentTab}
                  onTabChange={setCurrentTab}
                  filteredLightingItems={lightingHooks.filteredLightingItems}
                  filteredAirconCards={airconManagement.filteredAirconCards}
                  filteredCurtainItems={curtainHooks.filteredCurtainItems}
                  filteredDmxCards={dmxHooks.filteredDmxCards}
                  filteredSpiChannels={spiHooks.filteredSpiChannels}
                  onAddNewItem={handleAddNewItem}
                  onEditLightingItem={lightingHooks.handleEditLightingItem}
                  onEditAirconItem={airconManagement.handleEditAirconItem}
                  onEditCurtainItem={curtainHooks.handleEditCurtainItem}
                  onEditDmxItem={dmxHooks.handleEditDmxItemDialog}
                  onAddLightingItem={(itemId) => sceneItemsHooks.addItemToScene("lighting", itemId, "255")}
                  onAddAirconCard={airconManagement.handleAddAirconCard}
                  onAddCurtainItem={(itemId) => sceneItemsHooks.addItemToScene("curtain", itemId, "1")}
                  onAddDmxCard={dmxHooks.handleAddDmxCard}
                  onAddSpiChannel={spiHooks.handleAddSpiChannel}
                />
              </div>
            </div>
          </div>

          {/* General Error Display */}
          {errors.general && <div className="text-sm text-red-500 text-center mt-4">{errors.general}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim() || !formData.address.trim() || errors.name || errors.address}>
              {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Aircon Properties Dialog */}
      <AirconPropertiesDialog
        open={airconManagement.airconPropertiesDialog.open}
        onOpenChange={(open) => airconManagement.setAirconPropertiesDialog((prev) => ({ ...prev, open }))}
        airconCard={airconManagement.airconPropertiesDialog.airconCard}
        onConfirm={airconManagement.handleAirconPropertiesConfirm}
      />

      {/* Edit Aircon Properties Dialog */}
      <AirconPropertiesDialog
        open={airconManagement.editAirconPropertiesDialog.open}
        onOpenChange={(open) => airconManagement.setEditAirconPropertiesDialog((prev) => ({ ...prev, open }))}
        airconGroup={airconManagement.editAirconPropertiesDialog.airconGroup}
        mode="edit"
        onConfirm={airconManagement.handleEditAirconPropertiesConfirm}
      />

      {/* Add New Lighting Dialog */}
      <ProjectItemDialog open={lightingHooks.lightingDialog.open} onOpenChange={handleCloseLightingDialog} category="lighting" mode="create" />

      {/* Add New Aircon Dialog */}
      <ProjectItemDialog open={airconManagement.airconDialog.open} onOpenChange={handleCloseAirconDialog} category="aircon" mode="create" />

      {/* Add New Curtain Dialog */}
      <CurtainDialog open={curtainHooks.curtainDialog.open} onOpenChange={handleCloseCurtainDialog} mode="create" />

      {/* Edit Lighting Dialog */}
      <ProjectItemDialog
        open={lightingHooks.editLightingDialog.open}
        onOpenChange={handleCloseEditLightingDialog}
        category="lighting"
        item={lightingHooks.editLightingDialog.item}
        mode="edit"
      />

      {/* Edit Aircon Dialog */}
      <ProjectItemDialog
        open={airconManagement.editAirconDialog.open}
        onOpenChange={handleCloseEditAirconDialog}
        category="aircon"
        item={airconManagement.editAirconDialog.item}
        mode="edit"
      />

      {/* Edit Curtain Dialog */}
      <CurtainDialog
        open={curtainHooks.editCurtainDialog.open}
        onOpenChange={handleCloseEditCurtainDialog}
        item={curtainHooks.editCurtainDialog.item}
        mode="edit"
      />

      {/* DMX Properties Dialog */}
      <DmxPropertiesDialog
        open={dmxHooks.dmxPropertiesDialog.open}
        onOpenChange={(open) => dmxHooks.setDmxPropertiesDialog((prev) => ({ ...prev, open }))}
        dmxCard={dmxHooks.dmxPropertiesDialog.dmxCard}
        onConfirm={dmxHooks.handleDmxPropertiesConfirm}
      />

      {/* Edit DMX Properties Dialog */}
      <DmxPropertiesDialog
        open={dmxHooks.editDmxPropertiesDialog.open}
        onOpenChange={(open) => dmxHooks.setEditDmxPropertiesDialog((prev) => ({ ...prev, open }))}
        dmxItem={dmxHooks.editDmxPropertiesDialog.dmxItem}
        mode="edit"
        onConfirm={dmxHooks.handleEditDmxPropertiesConfirm}
      />

      {/* Add New DMX Dialog */}
      <DmxDialog open={dmxHooks.dmxDialog.open} onOpenChange={handleCloseDmxDialog} mode="create" />

      {/* Edit DMX Dialog */}
      <DmxDialog open={dmxHooks.editDmxDialog.open} onOpenChange={handleCloseEditDmxDialog} item={dmxHooks.editDmxDialog.item} mode="edit" />
    </Dialog>
  );
}
